import React, { useState, useRef, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { useChat, MODELS } from './hooks/useChat';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Settings from './components/Settings';

const App = () => {
  // ===== AUTH HOOK =====
  const { user, loading, logout } = useAuth();

  // ===== CHAT HOOK =====
  const chat = useChat(user);

  // ===== STATE =====
  const [showAuth, setShowAuth] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState('');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'matrix';
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'vi';
  });

  const messagesEndRef = useRef(null);

  // ===== APPLY THEME =====
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    document.body.style.background = 'var(--bg-primary)';
    document.body.style.color = 'var(--text-primary)';
  }, [theme]);

  // ===== LOADING =====
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: '#00ff41',
        fontSize: '20px'
      }}>
        ⏳ Đang tải...
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      {/* ===== SIDEBAR ===== */}
      <Sidebar
        conversations={chat.conversations}
        currentChatId={chat.currentChatId}
        setCurrentChatId={chat.setCurrentChatId}
        setMessages={chat.setMessages}
        createNewChat={chat.createNewChat}
        deleteChat={chat.deleteChat}
        user={user}
        onSettingsClick={() => setShowSettings(true)}
      />

      {/* ===== CHAT AREA ===== */}
      <ChatArea
        messages={chat.messages}
        selectedModel={chat.selectedModel}
        setSelectedModel={chat.setSelectedModel}
        usage={chat.usage}
        loading={chat.loading}
        input={input}
        setInput={setInput}
        sendMessage={chat.sendMessage}
        messagesEndRef={messagesEndRef}
        MODELS={MODELS}
        uploadedFiles={chat.uploadedFiles}
        setUploadedFiles={chat.setUploadedFiles}
        processFiles={chat.processFiles}
        user={user}
        setShowAuth={setShowAuth}
        onSettingsClick={() => setShowSettings(true)}
        theme={theme}
        getRemainingUsage={chat.getRemainingUsage}
      />

      {/* ===== MODALS ===== */}
      <Auth isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        logout={logout}
        theme={theme}
        setTheme={setTheme}
        language={language}
        setLanguage={setLanguage}
      />

      {/* ===== TOAST ===== */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)'
          }
        }}
      />
    </div>
  );
};

export default App;
