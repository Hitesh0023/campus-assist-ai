import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useApp } from '../context/AppContext';

const History = () => {
  const { user } = useApp();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/chat/sessions');
      setSessions(data.sessions || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const renameSession = async (session) => {
    const newTitle = window.prompt('Rename this chat session:', session.title || session.mode || 'Chat session');
    if (!newTitle || !newTitle.trim()) return;

    try {
      const { data } = await api.patch(`/api/chat/sessions/${session._id}`, { title: newTitle.trim() });
      setSessions((prev) => prev.map((s) => (s._id === session._id ? data.session : s)));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm('Delete this chat session? This cannot be undone.')) return;

    try {
      await api.delete(`/api/chat/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((session) => session._id !== sessionId));
    } catch (err) {
      setError(err.message);
    }
  };

  const getSessionTitle = (session) => {
    if (session.title && session.title.trim()) return session.title;
    if (session.messages?.length) {
      const firstUser = session.messages.find((message) => message.sender === 'user');
      return firstUser?.message?.slice(0, 70) || session.mode || 'Chat session';
    }
    return session.mode || 'Chat session';
  };

  const getSessionPreview = (session) => {
    if (session.title && session.title.trim()) return session.messages?.length ? session.messages[session.messages.length - 1]?.message : 'No messages yet.';
    if (session.messages?.length) {
      const lastUser = [...session.messages].reverse().find((item) => item.sender === 'user');
      return lastUser?.message || session.messages[session.messages.length - 1].message;
    }
    return 'No messages yet.';
  };

  return (
    <main className="page-content" style={{ paddingTop: '4rem', maxWidth: '100%' }}>
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <h1>Chat History</h1>
        <p>All your sessions with dates, modes, and recent conversation preview.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Signed in as</div>
            <div style={{ fontWeight: 700 }}>{user?.email || user?.nickname}</div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/chat')}
          >
            New Chat
          </button>
        </div>

        {loading ? (
          <p>Loading history...</p>
        ) : error ? (
          <p style={{ color: '#EF4444' }}>{error}</p>
        ) : sessions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No saved chat sessions yet. Start chatting to see them here.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {sessions.map(session => {
              const isExpanded = expandedId === session._id;
              const modeEmoji = {
                study: '📚',
                placement: '💼',
                fest: '🎉',
                rant: '😤'
              }[session.mode] || '💬';

              return (
                <div
                  key={session._id}
                  style={{
                    borderRadius: '14px',
                    border: '1px solid var(--border)',
                    background: isExpanded ? 'var(--bg-elevated)' : 'var(--bg-input)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : session._id)}
                    style={{
                      padding: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => !isExpanded && (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => !isExpanded && (e.currentTarget.style.background = 'var(--bg-input)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{modeEmoji}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
                          {getSessionTitle(session)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                          {session.messages?.length || 0} messages
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '1rem', background: 'var(--bg-input)' }}>
                      <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Created</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{new Date(session.createdAt).toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Last Updated</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{new Date(session.updatedAt).toLocaleString()}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem 0.75rem', minWidth: 'auto', fontSize: '0.85rem', flex: 1 }}
                          onClick={(e) => { e.stopPropagation(); renameSession(session); }}
                        >
                          ✏️ Rename
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem 0.75rem', minWidth: 'auto', fontSize: '0.85rem', flex: 1, background: '#F8D7DA', color: '#842029', borderColor: '#F5C2C7' }}
                          onClick={(e) => { e.stopPropagation(); deleteSession(session._id); }}
                        >
                          🗑️ Delete
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn"
                        style={{ width: '100%', padding: '0.7rem 1rem', fontSize: '0.9rem' }}
                        onClick={() => navigate(`/chat?sessionId=${session._id}`)}
                      >
                        Open Chat
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default History;
