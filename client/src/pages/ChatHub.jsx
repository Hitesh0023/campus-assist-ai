import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TypingIndicator } from '../components/shared';
import { useApp } from '../context/AppContext';
import api from '../utils/api';

const MODES = [
  { id: 'fest',      emoji: '🎉', name: 'Fest Mode',      desc: 'Events & college fun',   color: '#F59E0B' },
  { id: 'placement', emoji: '💼', name: 'Placement',      desc: 'Job prep & careers',     color: '#06B6D4' },
  { id: 'study',     emoji: '📚', name: 'Study Mode',     desc: 'Doubts & academics',     color: '#10B981' },
  { id: 'rant',      emoji: '😤', name: 'Rant Mode',      desc: 'Vent & feel better',     color: '#EC4899' },
];

const QUICK_CHIPS = {
  fest:      ['When is the next fest? 🎊', 'Best events to join?', 'How to join organising committee?', 'Sponsorship ideas 💡'],
  placement: ['How to crack TCS NQT? 💼', 'Resume tips for freshers', 'Best DSA roadmap?', 'Mock interview tips 🎯'],
  study:     ['Calculate my CGPA 📊', 'Best study techniques?', 'Explain recursion simply', 'How to focus better? 🧠'],
  rant:      ['Canteen food is terrible 😭', 'Professor gave 0 internals!', "Exam tomorrow, haven't studied 😱", 'Hostel wifi is dead again'],
};

const ChatHub = () => {
  const { nickname } = useApp();
  const [mode, setMode]           = useState('study');
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState(''); // 'listening' | 'done' | ''
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [showHeader, setShowHeader] = useState(true);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const chatEndRef  = useRef(null);
  const chatContainerRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const inputRef    = useRef(null);
  const recRef      = useRef(null);

  // Load session ID for current mode from localStorage
  const loadSessionId = (currentMode) => {
    const stored = localStorage.getItem(`chat_session_${currentMode}`);
    return stored || null;
  };

  // Save session ID for current mode to localStorage
  const saveSessionId = (currentMode, id) => {
    if (id) {
      localStorage.setItem(`chat_session_${currentMode}`, id);
    }
  };

  // Load chat history for a session
  const getStoredSessions = () => {
    try {
      return JSON.parse(localStorage.getItem('chat_sessions') || '[]');
    } catch {
      return [];
    }
  };

  const saveStoredSession = (sessionId, currentMode, latestMessage) => {
    if (!sessionId) return;
    const stored = getStoredSessions();
    const modeInfo = MODES.find(m => m.id === currentMode);
    const existingIndex = stored.findIndex(item => item.sessionId === sessionId);
    const entry = {
      sessionId,
      mode: currentMode,
      label: `${modeInfo?.name || 'Chat'} • ${new Date().toLocaleDateString()}`,
      preview: latestMessage || `${modeInfo?.desc || 'Chat session'}...`,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      stored[existingIndex] = entry;
    } else {
      stored.unshift(entry);
    }

    localStorage.setItem('chat_sessions', JSON.stringify(stored.slice(0, 12)));
    setHistoryItems(stored.slice(0, 12));
  };

  const loadStoredHistory = () => {
    setHistoryItems(getStoredSessions());
  };

  const loadChatHistory = async (sessionId, currentMode) => {
    if (!sessionId) return false;
    try {
      const { data } = await api.get(`/api/chat/history/${sessionId}`);
      if (data.success && data.session.messages && data.session.messages.length > 0) {
        // Map backend format to required format and support old/new fields
        const historyMessages = data.session.messages.map(msg => ({
          sender: msg.sender ? msg.sender : (msg.role === 'user' ? 'user' : 'bot'),
          message: msg.message ?? msg.content,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }));
        setMessages(historyMessages);
        saveStoredSession(sessionId, currentMode, historyMessages[historyMessages.length - 1]?.message);
        return true;
      }
    } catch (err) {
      console.log('No existing chat history or error loading:', err.message);
    }
    return false;
  };


  /* ── Welcome message on mode change ─────────────── */
  useEffect(() => {
    const welcomes = {
      fest:      `Hey ${nickname}! 🎉 I'm FestBot! Ask me anything about college fests, events, or how to make yours legendary!`,
      placement: `Welcome ${nickname}! 💼 I'm your placement mentor. Let's crack those interviews together. What do you need help with?`,
      study:     `Hi ${nickname}! 📚 I'm StudyBot. Any doubts, CGPA calculations, or concepts you're struggling with?`,
      rant:      `Yooo ${nickname} 😤 Rant Mode activated! What's bothering you today? I'm all ears (and maybe a few jokes 😂)`,
    };

    // Load stored sessions for the panel
    loadStoredHistory();

    // Load existing session ID for this mode
    const existingSessionId = loadSessionId(mode);
    setSessionId(existingSessionId);

    // Try to load existing chat history
    loadChatHistory(existingSessionId, mode).then((hasHistory) => {
      if (!hasHistory) {
        // Show welcome message for new session or if no history
        setMessages([{ sender: 'bot', message: welcomes[mode], timestamp: new Date() }]);
      }
    });
  }, [mode, nickname]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (isMobile) {
        lastScrollTopRef.current = container.scrollTop;
        if (showHistory) setShowHistory(false);
        return;
      }

      const currentTop = container.scrollTop;
      const isScrollingDown = currentTop > lastScrollTopRef.current;
      if (isScrollingDown && currentTop > 20) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      lastScrollTopRef.current = currentTop;
      if (showHistory) setShowHistory(false);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isMobile, showHistory]);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) setMobileMenuOpen(false);
  }, [isMobile]);

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
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', message: msg, timestamp: new Date() }]);
    setLoading(true);
    try {
      const { data } = await api.post('/api/chat', { nickname, message: msg, mode, sessionId });
      setMessages(prev => [...prev, { sender: 'bot', message: data.response, timestamp: new Date() }]);
      setSessionId(data.sessionId);
      saveSessionId(mode, data.sessionId); // Save to localStorage
      saveStoredSession(data.sessionId, mode, data.response);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', message: `❌ Oops! ${err.message}. Check if the server is running.`, timestamp: new Date() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
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

  const startNewChat = () => {
    const welcomes = {
      fest:      `Hey ${nickname}! 🎉 I'm FestBot! Ask me anything about college fests, events, or how to make yours legendary!`,
      placement: `Welcome ${nickname}! 💼 I'm your placement mentor. Let's crack those interviews together. What do you need help with?`,
      study:     `Hi ${nickname}! 📚 I'm StudyBot. Any doubts, CGPA calculations, or concepts you're struggling with?`,
      rant:      `Yooo ${nickname} 😤 Rant Mode activated! What's bothering you today? I'm all ears (and maybe a few jokes 😂)`,
    };

    setSessionId(null);
    setInput('');
    localStorage.removeItem(`chat_session_${mode}`);
    setMessages([{ sender: 'bot', message: welcomes[mode], timestamp: new Date() }]);
    setShowSaveMenu(false);
    setShowHistory(false);
  };

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
      setMessages([{ sender: 'bot', message: welcomes[mode], timestamp: new Date() }]);
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

  const navigate = useNavigate();
  const currentMode = MODES.find(m => m.id === mode);
  const effectiveShowHeader = isMobile || showHeader;

  const mobileNavItems = [
    { label: 'BrainSpace', action: () => navigate('/brainstorm') },
    { label: 'TalentArena', action: () => navigate('/talent') },
    { label: 'CreatorCorner', action: () => navigate('/creator') },
    { label: 'PlacementDojo', action: () => navigate('/placement') },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - var(--nav-h))',
      padding: '0',
      maxWidth: 820,
      margin: '0 auto',
      width: '100%',
    }}>

      {/* ── Compact Mode Selector Bar ─────────────────── */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: effectiveShowHeader ? '0.85rem 1rem' : '0 1rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        flexShrink: 0,
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        maxHeight: effectiveShowHeader ? 260 : 0,
        overflow: 'hidden',
        transform: effectiveShowHeader ? 'translateY(0)' : 'translateY(-10%)',
        transition: 'max-height 0.25s ease, padding 0.25s ease, transform 0.25s ease',
      }}>
        {/* Title inline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>💬</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>Chat Hub</span>
        </div>

        {/* New chat + history controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!isMobile && (
            <>
              <button
                onClick={startNewChat}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '50px',
                  border: '2px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-body)',
                }}
              >
                ✨ New Chat
              </button>
              <button
                onClick={() => setShowHistory(prev => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '50px',
                  border: showHistory ? `2px solid ${currentMode.color}` : '2px solid var(--border)',
                  background: showHistory ? `${currentMode.color}14` : 'var(--bg-input)',
                  color: showHistory ? currentMode.color : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-body)',
                  transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                }}
              >
                📚 History
                <span style={{ transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
              </button>
            </>
          )}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '50px',
                border: '2px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-body)',
              }}
            >
              ☰ Menu
            </button>
          )}
        </div>

        {/* Mode pills — compact */}
        {!isMobile && MODES.map(m => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.9rem',
                borderRadius: '50px',
                border: active ? `2px solid ${m.color}` : '2px solid var(--border)',
                background: active ? `${m.color}18` : 'var(--bg-input)',
                color: active ? m.color : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: active ? 700 : 400,
                fontFamily: 'var(--font-body)',
                transition: 'all 0.18s',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{m.emoji}</span>
              <span>{m.name}</span>
            </button>
          );
        })}

        {/* Save Menu Button */}
        {!isMobile && (
          <div style={{ marginLeft: 'auto', position: 'relative' }} data-save-menu>
            <button
              onClick={() => setShowSaveMenu(!showSaveMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.9rem',
                borderRadius: '50px',
                border: '2px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 400,
                fontFamily: 'var(--font-body)',
                transition: 'all 0.18s',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: '1rem' }}>💾</span>
              <span>Save</span>
            </button>

          {/* Save Menu Dropdown */}
          {showSaveMenu && (
            <div data-save-menu style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              minWidth: '180px',
            }}>
              <button
                onClick={saveChatAsJSON}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'none',
                  color: 'var(--text)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)',
                  borderRadius: '8px 8px 0 0',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.target.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.target.style.background = 'none'}
              >
                📄 Save as JSON
              </button>
              <button
                onClick={saveChatAsText}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'none',
                  color: 'var(--text)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)',
                  borderTop: '1px solid var(--border)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.target.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.target.style.background = 'none'}
              >
                📝 Save as Text
              </button>
              <button
                onClick={clearChatHistory}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'none',
                  color: '#EF4444',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)',
                  borderTop: '1px solid var(--border)',
                  borderRadius: '0 0 8px 8px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={e => e.target.style.background = 'none'}
              >
                🗑️ Clear History
              </button>
            </div>
          )}
        </div>
        )}

        {showHistory && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            marginTop: '0.8rem',
            padding: '0 1rem',
            overflow: 'hidden',
            maxHeight: showHistory ? '420px' : '0',
            opacity: showHistory ? 1 : 0,
            transition: 'max-height 0.25s ease, opacity 0.25s ease',
            pointerEvents: showHistory ? 'auto' : 'none',
          }}>
            <div style={{
              padding: '1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '18px',
              boxShadow: '0 18px 45px rgba(0,0,0,0.08)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.8rem', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>Recent chats</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>Tap a chat to reopen history.</div>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('chat_sessions');
                    setHistoryItems([]);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                  }}
                >
                  Clear all
                </button>
              </div>

              {historyItems.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>No previous chats saved yet. Start a new chat or use the current session.</div>
              ) : (
                <div style={{ display: 'grid', gap: '0.7rem' }}>
                  {historyItems.map(item => {
                    const itemMode = MODES.find(m => m.id === item.mode);
                    return (
                      <button
                        key={item.sessionId}
                        onClick={() => {
                          setMode(item.mode);
                          setShowHistory(false);
                          setSessionId(item.sessionId);
                          loadChatHistory(item.sessionId, item.mode);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          borderRadius: '14px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-input)',
                          padding: '0.85rem 1rem',
                          cursor: 'pointer',
                          color: 'var(--text)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '1rem' }}>{itemMode?.emoji || '💬'}</span>
                          <div>
                            <div style={{ fontWeight: 700 }}>{item.label}</div>
                            <div style={{ fontSize: '0.79rem', color: 'var(--text-muted)' }}>{itemMode?.name || 'Chat'}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.84rem', color: 'var(--text-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.preview}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isMobile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          zIndex: 22,
          position: 'sticky',
          top: 0,
        }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>Chat Menu</div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            style={{
              padding: '0.6rem 0.85rem',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text)',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            ☰ Open
          </button>
        </div>
      )}

      {isMobile && mobileMenuOpen && (
        <>
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 40,
          }} onClick={() => setMobileMenuOpen(false)} />
          <aside style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: '78%',
            maxWidth: 320,
            background: 'var(--bg-card)',
            zIndex: 50,
            padding: '1rem',
            boxShadow: '4px 0 30px rgba(0,0,0,0.35)',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>Menu</div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <button
              onClick={() => { startNewChat(); setMobileMenuOpen(false); }}
              style={{
                width: '100%',
                padding: '0.95rem 1rem',
                borderRadius: '18px',
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text)',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '0.75rem',
                textAlign: 'left',
              }}
            >
              ✨ New Chat
            </button>
            <button
              onClick={() => { setShowHistory(prev => !prev); setMobileMenuOpen(false); }}
              style={{
                width: '100%',
                padding: '0.95rem 1rem',
                borderRadius: '18px',
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text)',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '0.75rem',
                textAlign: 'left',
              }}
            >
              📚 History
            </button>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Pages</div>
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {mobileNavItems.map(item => (
                  <button
                    key={item.label}
                    onClick={() => { item.action(); setMobileMenuOpen(false); }}
                    style={{
                      width: '100%',
                      borderRadius: '16px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input)',
                      color: 'var(--text)',
                      padding: '0.9rem 1rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Save</div>
              <button
                onClick={() => { saveChatAsJSON(); setMobileMenuOpen(false); }}
                style={{
                  width: '100%',
                  padding: '0.95rem 1rem',
                  borderRadius: '18px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '0.75rem',
                  textAlign: 'left',
                }}
              >
                💾 Save as JSON
              </button>
              <button
                onClick={() => { saveChatAsText(); setMobileMenuOpen(false); }}
                style={{
                  width: '100%',
                  padding: '0.95rem 1rem',
                  borderRadius: '18px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                }}
              >
                💾 Save as Text
              </button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Modes</div>
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {MODES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setMode(m.id); setMobileMenuOpen(false); }}
                    style={{
                      width: '100%',
                      borderRadius: '16px',
                      border: `1px solid ${mode === m.id ? m.color : 'var(--border)'}`,
                      background: mode === m.id ? `${m.color}20` : 'var(--bg-input)',
                      color: mode === m.id ? m.color : 'var(--text-muted)',
                      padding: '0.9rem 1rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.95rem',
                    }}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ── Chat Messages — takes all remaining height ── */}
      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
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
              maxWidth: '72%',
              padding: '0.85rem 1.1rem',
              borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              fontSize: '0.97rem',
              lineHeight: 1.7,
              letterSpacing: '0.01em',
              whiteSpace: 'pre-wrap',
              background: msg.sender === 'user'
                ? `linear-gradient(135deg, ${currentMode.color}CC, ${currentMode.color}99)`
                : 'var(--bg-elevated)',
              color: msg.sender === 'user' ? '#fff' : 'var(--text)',
              border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
              boxShadow: msg.sender === 'user' ? `0 4px 15px ${currentMode.color}30` : 'none',
            }}>
              {msg.message}
            </div>
          </div>
        ))}

        {loading && <TypingIndicator />}
        <div ref={chatEndRef} />
      </div>

      {/* ── Quick Chips ───────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        padding: '0.6rem 1rem',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {QUICK_CHIPS[mode].map((chip, i) => (
          <button
            key={i}
            onClick={() => sendMessage(chip)}
            style={{
              padding: '0.38rem 0.85rem',
              borderRadius: '50px',
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.target.style.borderColor = currentMode.color; e.target.style.color = currentMode.color; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)'; }}
          >
            {chip}
          </button>
        ))}
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

        {/* Text input — grows with content */}
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
          placeholder={`Message ${currentMode.name}... (Enter to send, Shift+Enter for new line)`}
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

      {/* Inline CSS for pulse animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes voicePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
      `}</style>
    </div>
  );
};

export default ChatHub;
