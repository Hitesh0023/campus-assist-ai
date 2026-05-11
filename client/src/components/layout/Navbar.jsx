import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const NAV_ITEMS = [
  { path: '/chat',      emoji: '💬', label: 'Chat Hub' },
  { path: '/brainstorm',emoji: '🧠', label: 'BrainSpace' },
  { path: '/talent',    emoji: '🌟', label: 'TalentArena' },
  { path: '/creator',   emoji: '🎨', label: 'CreatorCorner' },
  { path: '/placement', emoji: '💼', label: 'PlacementDojo' },
  { path: '/history',   emoji: '📚', label: 'History' },
];

const Navbar = () => {
  const { user, logout, saveNickname, nickname } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hideMobileToggle = location.pathname === '/chat' ? false : true;

  const handleNicknameClick = () => {
    const newName = prompt('Change your nickname:', nickname || user?.nickname || user?.email || '');
    if (newName?.trim()) saveNickname(newName.trim());
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand" onClick={closeMobileMenu}>
        🎓 CAMPUS ASSIT AI
      </NavLink>

      {!hideMobileToggle && (
        <button
          className={`navbar-mobile-toggle${location.pathname === '/chat' ? ' navbar-mobile-toggle--chat' : ''}`}
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label="Toggle navigation menu"
          type="button"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      )}

      {location.pathname === '/chat' && (
        <div className="navbar-chat-quick-actions">
          <NavLink to="/chat" className="navbar-quick-btn navbar-quick-btn--new" title="New Chat">
            ✨
          </NavLink>
          <NavLink to="/history" className="navbar-quick-btn navbar-quick-btn--history" title="History">
            📚
          </NavLink>
        </div>
      )}

      <ul className="navbar-tabs">
        {NAV_ITEMS.map(({ path, emoji, label }) => (
          <li key={path}>
            <NavLink
              to={path}
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={closeMobileMenu}
            >
              {emoji} {label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="navbar-actions">
        <div
          className="nickname-badge"
          onClick={handleNicknameClick}
          title="Click to change nickname"
        >
          👤 {nickname || user?.nickname || user?.email || 'Set nickname'}
        </div>
        <button className="navbar-logout" onClick={handleLogout} type="button">
          Logout
        </button>
      </div>

      {mobileMenuOpen && <div className="navbar-mobile-overlay" onClick={closeMobileMenu} />}

      <div className={`navbar-mobile-drawer${mobileMenuOpen ? ' open' : ''}`}>
        <ul>
          {NAV_ITEMS.map(({ path, emoji, label }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) => isActive ? 'active' : ''}
                onClick={closeMobileMenu}
              >
                {emoji} {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="navbar-mobile-actions">
          <div
            className="nickname-badge"
            onClick={() => {
              handleNicknameClick();
              closeMobileMenu();
            }}
            title="Click to change nickname"
          >
            👤 {nickname || user?.nickname || user?.email || 'Set nickname'}
          </div>
          <button className="navbar-logout" onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
