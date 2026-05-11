const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Chat } = require('../models');
const { generateChat } = require('../config/gemini');
const { CHAT_MODES } = require('../prompts/allPrompts');
const { aiLimiter } = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/auth');
const { extractTextFromFile, processFileForGemini } = require('../utils/fileProcessor');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDFs, documents, images, and text files
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
      'application/json',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// POST /api/chat
// Send a message and get AI response
router.post('/', upload.single('file'), aiLimiter, authMiddleware, async (req, res, next) => {
  try {
    const { nickname, message, mode, sessionId } = req.body;
    const userId = req.user._id;

    let attachment = null;
    let fileDataForGemini = null;

    // Handle file upload
    if (req.file) {
      const fileData = await processFileForGemini(req.file.buffer, req.file.mimetype, req.file.originalname);
      
      if (fileData.success) {
        // Store file data for Gemini API
        if (fileData.isImage || fileData.isPdf) {
          fileDataForGemini = fileData;
        }

        attachment = {
          name: req.file.originalname,
          type: req.file.mimetype,
          size: req.file.size,
          text: fileData.text || `[${fileData.isPdf ? 'PDF' : 'Image'} file: ${req.file.originalname}]`,
          isUploaded: true
        };
      } else {
        return res.status(400).json({
          success: false,
          error: `Error processing file: ${fileData.error}`
        });
      }
    }

    // Fallback to JSON attachment (for backward compatibility)
    if (!attachment && req.body.attachment) {
      attachment = req.body.attachment;
    }

    if (!nickname || (!message && !attachment) || !mode) {
      return res.status(400).json({
        success: false,
        error: 'nickname, message or attachment, and mode are required'
      });
    }

    const systemPrompt = CHAT_MODES[mode] || CHAT_MODES.study;

    // Find existing session or create new one
    let session = sessionId
      ? await Chat.findById(sessionId)
      : null;

    if (!session || (session.userId && session.userId.toString() !== userId.toString())) {
      session = new Chat({
        userId,
        nickname,
        mode,
        title: (message || attachment?.name || '').trim().slice(0, 120),
        messages: []
      });
    } else if (!session.title) {
      session.title = (message || attachment?.name || '').trim().slice(0, 120);
    }

    const userMessage = message || (attachment ? `Attached file: ${attachment.name}` : '');
    const attachmentText = attachment ? (() => {
      if (fileDataForGemini?.isImage) {
        return `\n\n[Image attached: ${attachment.name}. Please analyze or explain the image contents.]`;
      }
      if (fileDataForGemini?.isPdf) {
        return `\n\n[PDF attached: ${attachment.name}. Please analyze or extract information from the PDF.]`;
      }
      if (attachment.text) {
        return `\n\n[Attached file: ${attachment.name}]\n${attachment.text}`;
      }
      return `\n\n[File attached: ${attachment.name} (${attachment.type || 'unknown type'}). Please explain or analyze the contents of this file.]`;
    })() : '';

    // Pass file data for multimodal processing
    const aiResponse = await generateChat(
      systemPrompt,
      session.messages,
      `${userMessage}${attachmentText}`,
      fileDataForGemini
    );

    // Save both messages to DB using new sender/message structure
    session.messages.push({
      sender: 'user',
      message: userMessage,
      timestamp: new Date(),
      role: 'user',
      content: userMessage,
      attachment: attachment || undefined,
    });
    session.messages.push({
      sender: 'bot',
      message: aiResponse,
      timestamp: new Date(),
      role: 'assistant',
      content: aiResponse,
    });
    await session.save();

    res.json({
      success: true,
      sessionId: session._id,
      response: aiResponse,
      mode
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/chat/history/:sessionId
// Load previous chat history
router.get('/history/:sessionId', authMiddleware, async (req, res, next) => {
  try {
    const session = await Chat.findById(req.params.sessionId);
    if (!session || (session.userId && session.userId.toString() !== req.user._id.toString())) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, session });
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/sessions
// List all chat sessions for current user
router.get('/sessions', authMiddleware, async (req, res, next) => {
  try {
    const sessions = await Chat.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select('title mode createdAt updatedAt messages');

    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/chat/sessions/:sessionId
// Rename a saved chat session
router.patch('/sessions/:sessionId', authMiddleware, async (req, res, next) => {
  try {
    const { title } = req.body;
    const session = await Chat.findById(req.params.sessionId);
    if (!session || (session.userId && session.userId.toString() !== req.user._id.toString())) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    session.title = title ? title.trim().slice(0, 120) : session.title;
    await session.save();

    res.json({ success: true, session });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/chat/sessions/:sessionId
// Delete a saved chat session
router.delete('/sessions/:sessionId', authMiddleware, async (req, res, next) => {
  try {
    const session = await Chat.findById(req.params.sessionId);
    if (!session || (session.userId && session.userId.toString() !== req.user._id.toString())) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    await session.deleteOne();
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
