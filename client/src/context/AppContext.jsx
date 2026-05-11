import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('cb_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cb_token') || '');
  const [nickname, setNickname] = useState(() => localStorage.getItem('cb_nickname') || (user?.nickname || ''));
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  const saveNickname = (name) => {
    localStorage.setItem('cb_nickname', name);
    setNickname(name);
    if (user) {
      const updatedUser = { ...user, nickname: name };
      setUser(updatedUser);
      localStorage.setItem('cb_user', JSON.stringify(updatedUser));
    }
  };

  const login = ({ user: loggedUser, token: authToken }) => {
    localStorage.setItem('cb_token', authToken);
    localStorage.setItem('cb_user', JSON.stringify(loggedUser));
    localStorage.setItem('cb_nickname', loggedUser.nickname || loggedUser.email);
    setToken(authToken);
    setUser(loggedUser);
    setNickname(loggedUser.nickname || loggedUser.email);
  };

  const logout = () => {
    localStorage.removeItem('cb_token');
    localStorage.removeItem('cb_user');
    localStorage.removeItem('cb_nickname');
    setToken('');
    setUser(null);
    setNickname('');
  };

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  return (
    <AppContext.Provider value={{ user, token, nickname, saveNickname, login, logout, toasts, addToast }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
