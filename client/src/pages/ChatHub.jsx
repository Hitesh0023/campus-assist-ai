import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TypingIndicator } from '../components/shared';
import { useApp } from '../context/AppContext';
import api from '../utils/api';

const MODES = [
  { id: 'fest',      emoji: '🎉', name: 'Fest Mode',      desc: 'Events & college fun',   color: '#F59E0B' },
  { id: 'placement', emoji: '💼', name: 'Placement',      desc: 'Job prep & careers',     color: '#06B6D4' },
  { id: 'study',     emoji: '📚', name: 'Study Mode',     desc: 'Doubts & academics',     color: '#10B981' },
  { id: 'rant',      emoji: '😤', name: 'Rant Mode',      desc: 'Vent & feel better',     color: '#EC4899' },
];

const ChatHub = () => {
  const { nickname, user } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode]           = useState('study');
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState(''); // 'listening' | 'done' | ''
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches
  );
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const chatEndRef  = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const inputRef    = useRef(null);
  const recRef      = useRef(null);

  // Save session ID for current mode to localStorage
  const saveSessionId = (currentMode, id) => {
    if (id) {
      localStorage.setItem(`chat_session_${currentMode}`, id);
    }
  };



  /* ── Welcome message on mode change ─────────────── */
  useEffect(() => {
    const displayName = nickname || user?.nickname || user?.email || 'Student';
    const welcomes = {
      fest:      `Hey ${displayName}! 🎉 I'm FestBot! Ask me anything about college fests, events, or how to make yours legendary!`,
      placement: `Welcome ${displayName}! 💼 I'm your placement mentor. Let's crack those interviews together. What do you need help with?`,
      study:     `Hi ${displayName}! 📚 I'm StudyBot. Any doubts, CGPA calculations, or concepts you're struggling with?`,
      rant:      `Yooo ${displayName} 😤 Rant Mode activated! What's bothering you today? I'm all ears (and maybe a few jokes 😂)`,
    };

    setSessionId(null);
    setMessages([{ sender: 'bot', message: welcomes[mode], image: null, timestamp: new Date() }]);
  }, [mode, nickname, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 900px)').matches);
    };
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openSessionId = params.get('sessionId');
    if (!openSessionId) return;

    const loadSession = async () => {
      try {
        const { data } = await api.get(`/api/chat/history/${openSessionId}`);
        const session = data.session;
        if (session) {
          setMode(session.mode || 'study');
          setSessionId(session._id);
          setMessages(session.messages?.length > 0 ? session.messages.map(msg => ({
            sender: msg.sender,
            message: msg.message || msg.content || '',
            attachment: msg.attachment || null,
            timestamp: msg.timestamp || msg.createdAt || new Date()
          })) : [{ sender: 'bot', message: `Welcome back! This session has no saved messages.`, image: null, timestamp: new Date() }]);
        }
      } catch (err) {
        setMessages(prev => [...prev, { sender: 'bot', message: `❌ Unable to load saved session: ${err.message}`, image: null, timestamp: new Date() }]);
      }
    };

    loadSession();
  }, [location.search]);

  // Close save menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSaveMenu && !event.target.closest('[data-save-menu]')) {
        setShowSaveMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSaveMenu]);

  /* ── Send message ────────────────────────────────── */
  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    const hasAttachment = !!selectedAttachment;
    if ((!msg && !hasAttachment) || loading) return;

    const displayText = msg || `📎 Attached file: ${selectedAttachment.name}`;

    // Prepare payload
    let payload;
    let config = {};

    if (selectedAttachment && selectedAttachment.file) {
      // Use FormData for file uploads
      payload = new FormData();
      payload.append('nickname', nickname);
      payload.append('message', msg);
      payload.append('mode', mode);
      if (sessionId) payload.append('sessionId', sessionId);
      payload.append('file', selectedAttachment.file);
      config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
    } else {
      // Use JSON for text-only messages or legacy attachments
      payload = { nickname, message: msg, mode, sessionId };
      if (selectedAttachment) {
        payload.attachment = {
          name: selectedAttachment.name,
          type: selectedAttachment.type,
          size: selectedAttachment.size,
          data: selectedAttachment.data,
          text: selectedAttachment.text,
        };
      }
    }

    setInput('');
    setMessages(prev => [...prev, {
      sender: 'user',
      message: displayText,
      attachment: selectedAttachment,
      timestamp: new Date()
    }]);// keep visual attachment in the chat while sending
    removeSelectedAttachment();
    setLoading(true);

    try {
      const { data } = await api.post('/api/chat', payload, config);
      setMessages(prev => [...prev, { sender: 'bot', message: data.response, image: null, timestamp: new Date() }]);
      setSessionId(data.sessionId);
      saveSessionId(mode, data.sessionId);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', message: `❌ Oops! ${err.message}. Check if the server is running.`, image: null, timestamp: new Date() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handlePaste = async (e) => {
    if (!e.clipboardData) return;
    const imageItem = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'));
    if (!imageItem) return;

    e.preventDefault();
    const blob = imageItem.getAsFile();
    if (!blob) return;

    const file = new File([blob], `pasted-image.${blob.type.split('/')[1] || 'png'}`, { type: blob.type });
    const dataUrl = await readFileAsDataURL(file);
    const attachment = {
      name: file.name,
      type: file.type,
      size: file.size,
      data: dataUrl,
      text: null,
      isImage: true,
    };

    setSelectedAttachment(attachment);
  };

  // Save chat history as JSON
  const saveChatAsJSON = () => {
    const chatData = {
      mode: mode,
      nickname: nickname,
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      messages: messages
    };

    const dataStr = JSON.stringify(chatData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-history-${mode}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowSaveMenu(false);
  };

  // Save chat history as text
  const saveChatAsText = () => {
    const chatText = messages.map(msg => {
      const time = new Date(msg.timestamp).toLocaleString();
      const sender = msg.sender === 'user' ? nickname : 'Bot';
      return `[${time}] ${sender}: ${msg.message}`;
    }).join('\n\n');

    const header = `Chat History - ${MODES.find(m => m.id === mode)?.name}\nSession: ${sessionId || 'New'}\nDate: ${new Date().toLocaleString()}\n\n`;
    const fullText = header + chatText;

    const dataBlob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-history-${mode}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowSaveMenu(false);
  };

  const startNewChat = useCallback(() => {
    const welcomes = {
      fest:      `Hey ${nickname}! 🎉 I'm FestBot! Ask me anything about college fests, events, or how to make yours legendary!`,
      placement: `Welcome ${nickname}! 💼 I'm your placement mentor. Let's crack those interviews together. What do you need help with?`,
      study:     `Hi ${nickname}! 📚 I'm StudyBot. Any doubts, CGPA calculations, or concepts you're struggling with?`,
      rant:      `Yooo ${nickname} 😤 Rant Mode activated! What's bothering you today? I'm all ears (and maybe a few jokes 😂)`,
    };

    setSessionId(null);
    setInput('');
    localStorage.removeItem(`chat_session_${mode}`);
    setMessages([{ sender: 'bot', message: welcomes[mode], image: null, timestamp: new Date() }]);
    setShowSaveMenu(false);
  }, [mode, nickname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('newChat') === 'true') {
      startNewChat();
      params.delete('newChat');
      const newSearch = params.toString();
      navigate({ pathname: location.pathname, search: newSearch ? `?${newSearch}` : '' }, { replace: true });
    }
  }, [location.search, location.pathname, navigate, startNewChat]);

  const clearChatHistory = () => {
    if (confirm(`Are you sure you want to clear the chat history for ${MODES.find(m => m.id === mode)?.name}? This cannot be undone.`)) {
      localStorage.removeItem(`chat_session_${mode}`);
      setSessionId(null);
      setMessages([]);
      const welcomes = {
        fest:      `Hey ${nickname}! 🎉 I'm FestBot! Ask me anything about college fests, events, or how to make yours legendary!`,
        placement: `Welcome ${nickname}! 💼 I'm your placement mentor. Let's crack those interviews together. What do you need help with?`,
        study:     `Hi ${nickname}! 📚 I'm StudyBot. Any doubts, CGPA calculations, or concepts you're struggling with?`,
        rant:      `Yooo ${nickname} 😤 Rant Mode activated! What's bothering you today? I'm all ears (and maybe a few jokes 😂)`,
      };
      setMessages([{ sender: 'bot', message: welcomes[mode], image: null, timestamp: new Date() }]);
      setShowSaveMenu(false);
    }
  };

  /* ── Voice with clear recording states ───────────── */
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input needs Chrome browser. Try Chrome!');
      return;
    }

    if (isRecording && recRef.current) {
      recRef.current.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = 'en-IN';
    rec.continuous = false;
    rec.interimResults = false;
    recRef.current = rec;

    rec.onstart = () => {
      setIsRecording(true);
      setVoiceStatus('listening');
    };

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setVoiceStatus('done');
    };

    rec.onerror = () => {
      setIsRecording(false);
      setVoiceStatus('');
    };

    rec.onend = () => {
      setIsRecording(false);
      setTimeout(() => setVoiceStatus(''), 2000);
    };

    rec.start();
  };

  const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const readFileAsText = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isTextFile = file.type.startsWith('text/') || /\.(js|ts|tsx|jsx|json|html|css|md|py|java|c|cpp|cs|sh)$/i.test(file.name);
    const isDocument = file.type === 'application/pdf' ||
                      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                      file.type === 'application/msword';

    const attachment = {
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      data: null,
      text: null,
      isImage,
      file: file, // Store the actual file for upload
    };

    if (isImage) {
      attachment.data = await readFileAsDataURL(file);
    } else if (isTextFile) {
      attachment.text = await readFileAsText(file);
      attachment.data = await readFileAsDataURL(file);
    } else if (isDocument) {
      // For documents, just store the file - text will be extracted on server
      attachment.data = await readFileAsDataURL(file);
    } else {
      attachment.data = await readFileAsDataURL(file);
    }

    setSelectedAttachment(attachment);
  };

  const removeSelectedAttachment = () => {
    setSelectedAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const currentMode = MODES.find(m => m.id === mode);

  const formatMessageText = (text, sender) => {
    if (!text) return '';
    if (sender !== 'bot') return text;
    return text
      .replace(/^\s*###\s+/gm, '💡 ')
      .replace(/^\s*##\s+/gm, '✨ ')
      .replace(/^\s*#\s+/gm, '🎯 ')
      .replace(/^\s*(?:[-*+]|•)\s+/gm, '👉 ')
      .replace(/^\s*(\d+)\.\s+/gm, '$1️⃣ ')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/\bimportant\b/gi, 'important ⚡')
      .replace(/\bnote\b/gi, 'note 📝')
      .replace(/\btip\b/gi, 'tip 💡')
      .replace(/\bwarning\b/gi, 'warning ⚠️');
  };

  const formatAttachmentSize = (bytes) => {
    if (!bytes) return '0 B';
    const kb = 1024;
    if (bytes < kb) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let value = bytes / kb;
    let unitIndex = 0;
    while (value >= kb && unitIndex < units.length - 1) {
      value /= kb;
      unitIndex += 1;
    }
    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  const renderAttachment = (attachment) => {
    if (!attachment) return null;

    const isImage = attachment.type?.startsWith('image/');
    const fileUrl = attachment.data;

    return (
      <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)' }}>
        {isImage ? (
          <img
            src={fileUrl}
            alt={attachment.name}
            style={{ width: '100%', borderRadius: 14, maxHeight: 260, objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{attachment.name}</div>
              <div style={{ color: 'var(--text-subtle)', fontSize: '0.87rem' }}>{attachment.type || 'File'} • {formatAttachmentSize(attachment.size)}</div>
            </div>
            {fileUrl && (
              <a
                href={fileUrl}
                download={attachment.name}
                style={{ color: currentMode.color, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                ⬇️ Download
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      height: 'calc(100vh - var(--nav-h))',
      padding: '0',
      maxWidth: 1280,
      margin: '0 auto',
      width: '100%',
      minWidth: 0,
      gap: isMobile ? 0 : '1.5rem',
    }}>

      {!isMobile && (
        <aside style={{
          width: 320,
          minWidth: 320,
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          padding: '1.5rem',
          overflowY: 'auto',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.35rem' }}>💬</span>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text)' }}>Chat Hub</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>Pick a mode and jump into chat.</div>
              </div>
            </div>
            <button
              onClick={startNewChat}
              style={{
                width: '100%',
                padding: '0.95rem 1rem',
                borderRadius: '18px',
                border: '1px solid rgba(124,58,237,0.3)',
                background: 'rgba(124,58,237,0.08)',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
                marginBottom: '1rem',
              }}
            >
              ✨ New Chat
            </button>
          </div>

          <div style={{ display: 'grid', gap: '0.7rem' }}>
            {MODES.map(m => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    padding: '0.9rem 1rem',
                    borderRadius: '18px',
                    border: active ? `1px solid ${m.color}` : '1px solid var(--border)',
                    background: active ? `linear-gradient(135deg, ${m.color}22, ${m.color}15)` : 'var(--bg-input)',
                    color: active ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    textAlign: 'left',
                    transition: 'transform 0.18s ease, border-color 0.18s ease, background 0.18s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <span style={{ fontSize: '1.05rem' }}>{m.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{m.name}</div>
                    <div style={{ color: active ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)', fontSize: '0.82rem' }}>{m.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => navigate('/history')}
            style={{
              width: '100%',
              padding: '0.95rem 1rem',
              borderRadius: '18px',
              border: '1px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.08)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <span>📚</span>
            <span>History</span>
          </button>

          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <button
              onClick={() => setShowSaveMenu(prev => !prev)}
              style={{
                width: '100%',
                padding: '0.95rem 1rem',
                borderRadius: '18px',
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Save / Export</span>
              <span>💾</span>
            </button>
            {showSaveMenu && (
              <div style={{ display: 'grid', gap: '0.5rem', padding: '0.75rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={saveChatAsJSON}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '14px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  📄 Save as JSON
                </button>
                <button
                  onClick={saveChatAsText}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '14px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  📝 Save as Text
                </button>
                <button
                  onClick={clearChatHistory}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '14px',
                    border: '1px solid rgba(239,68,68,0.35)',
                    background: 'rgba(239,68,68,0.12)',
                    color: '#EF4444',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  🗑️ Clear History
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ── Mobile / Main Content ─────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>

      {/* ── Chat Messages — takes all remaining height ── */}
      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1.25rem 1rem',
          background: 'var(--bg)',
        }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.6rem',
              flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
              animation: 'bubbleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 36, height: 36,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem',
              flexShrink: 0,
              background: msg.sender === 'user' ? 'rgba(245,158,11,0.15)' : 'rgba(124,58,237,0.15)',
              border: `1px solid ${msg.sender === 'user' ? 'rgba(245,158,11,0.3)' : 'rgba(124,58,237,0.3)'}`,
            }}>
              {msg.sender === 'user' ? '🧑' : '🤖'}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: '86%',
              borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.sender === 'user'
                ? `linear-gradient(135deg, ${currentMode.color}CC, ${currentMode.color}99)`
                : 'var(--bg-elevated)',
              border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
              boxShadow: msg.sender === 'user' ? `0 4px 15px ${currentMode.color}30` : 'none',
              overflow: 'hidden',
            }}>
              {renderAttachment(msg.attachment || (msg.image ? {
                name: 'attachment',
                type: 'image/*',
                size: 0,
                data: msg.image,
                isImage: true,
              } : null))}
              <div style={{
                padding: '1rem 1.2rem',
                fontSize: '1.08rem',
                lineHeight: 1.95,
                letterSpacing: '0.01em',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                whiteSpace: 'pre-wrap',
                color: msg.sender === 'user' ? '#fff' : 'var(--text)',
              }}>
                {formatMessageText(msg.message, msg.sender)}
              </div>
            </div>
          </div>
        ))}

        {loading && <TypingIndicator />}

        {!loading && messages.length === 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40vh',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '1.5rem',
          }}>
            <div>
              <div style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>No messages yet.</div>
              <div style={{ fontSize: '0.95rem' }}>Tap "New Chat" or start typing to begin your conversation.</div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Voice Status Banner ───────────────────────── */}
      {voiceStatus && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          padding: '0.5rem 1rem',
          background: voiceStatus === 'listening'
            ? 'rgba(239,68,68,0.12)'
            : 'rgba(16,185,129,0.12)',
          borderTop: `1px solid ${voiceStatus === 'listening' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
          fontSize: '0.88rem',
          fontWeight: 500,
          color: voiceStatus === 'listening' ? '#EF4444' : '#10B981',
          flexShrink: 0,
        }}>
          {voiceStatus === 'listening' ? (
            <>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1s infinite' }} />
              🎙️ Listening... Speak now! Tap mic to stop.
            </>
          ) : (
            <>✅ Got it! Your message is ready — hit send!</>
          )}
        </div>
      )}

      {/* ── Input Bar ─────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 1rem',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
        flexShrink: 0,
        position: 'sticky',
        bottom: 0,
        zIndex: 20,
      }}>

        {/* Attachment Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Attach a file or paste an image"
          style={{
            width: 44, height: 44,
            borderRadius: '50%',
            border: `2px solid ${selectedAttachment ? currentMode.color : 'var(--border)'}`,
            background: selectedAttachment ? `${currentMode.color}20` : 'var(--bg-input)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,text/*,application/*"
          capture="environment"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Voice Button */}
        <button
          onClick={toggleVoice}
          title={isRecording ? 'Stop recording' : 'Start voice input'}
          style={{
            width: 44, height: 44,
            borderRadius: '50%',
            border: `2px solid ${isRecording ? '#EF4444' : 'var(--border)'}`,
            background: isRecording ? 'rgba(239,68,68,0.15)' : 'var(--bg-input)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem',
            flexShrink: 0,
            transition: 'all 0.2s',
            animation: isRecording ? 'voicePulse 1.5s ease-in-out infinite' : 'none',
          }}
        >
          {isRecording ? '🔴' : '🎤'}
        </button>

        {/* Input Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
          {selectedAttachment && (
            <div style={{ position: 'relative', width: '100%', maxWidth: isMobile ? '100%' : 140 }}>
              {selectedAttachment.isImage && selectedAttachment.data ? (
                <img
                  src={selectedAttachment.data}
                  alt="preview"
                  style={{ width: '100%', borderRadius: 12, maxHeight: isMobile ? 180 : 120, objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  minHeight: 80,
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: '0.85rem 1rem',
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{selectedAttachment.name}</div>
                  <div style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                    {selectedAttachment.type || 'File'} • {formatAttachmentSize(selectedAttachment.size)}
                  </div>
                </div>
              )}
              <button
                onClick={removeSelectedAttachment}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#EF4444',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
          )}
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Auto-grow
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKey}
            onPaste={handlePaste}
            placeholder={`Message ${currentMode.name}... (Enter to send, Shift+Enter for new line). Paste an image or attach a file.`}
            disabled={loading}
            style={{
              flex: 1,
              background: 'var(--bg-input)',
              border: `1.5px solid ${input.trim() ? currentMode.color + '60' : 'var(--border)'}`,
              borderRadius: 16,
              color: 'var(--text)',
              padding: '0.75rem 1.1rem',
              fontSize: '0.97rem',
              lineHeight: 1.5,
              fontFamily: 'var(--font-body)',
              resize: 'none',
              overflowY: 'hidden',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: input.trim() ? `0 0 0 3px ${currentMode.color}15` : 'none',
              outline: 'none',
              minHeight: 44,
              maxHeight: 120,
            }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          style={{
            width: 44, height: 44,
            borderRadius: '50%',
            border: 'none',
            background: (loading || !input.trim())
              ? 'var(--bg-input)'
              : `linear-gradient(135deg, var(--violet), var(--violet-light))`,
            color: (loading || !input.trim()) ? 'var(--text-subtle)' : '#fff',
            cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
            flexShrink: 0,
            transition: 'all 0.2s',
            transform: (!loading && input.trim()) ? 'scale(1)' : 'scale(0.9)',
            boxShadow: (!loading && input.trim()) ? '0 4px 15px rgba(124,58,237,0.4)' : 'none',
          }}
        >
          {loading ? '⏳' : '➤'}
        </button>
      </div>

    </div>
  </div>
  );
};

export default ChatHub;
