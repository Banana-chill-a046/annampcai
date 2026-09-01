import React, { useState, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { useChat, MODELS } from './hooks/useChat';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './index.css';

const App = () => {
  const { user, loading, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const {
    conversations,
    currentChatId,
    setCurrentChatId,
    messages,
    setMessages,
    selectedModel,
    setSelectedModel,
    usage,
    loading: chatLoading,
    uploadedFiles,
    setUploadedFiles,
    createNewChat,
    deleteChat,
    sendMessage,
    processFiles,
    checkUsageLimit,
    getSystemPrompt
  } = useChat(user);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#00ff41', fontSize: '20px' }}>
        ⏳ Đang tải...
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div style={{
          height: '100vh',
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <button
            onClick={() => setShowAuth(true)}
            style={{
              position: 'absolute',
              top: 20,
              right: 30,
              background: 'transparent',
              border: '1px solid #00ff41',
              color: '#00ff41',
              padding: '12px 28px',
              borderRadius: '30px',
              fontSize: '16px',
              boxShadow: '0 0 20px rgba(0,255,65,0.2)',
              transition: 'all 0.3s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#00ff41';
              e.currentTarget.style.color = '#0a0a0a';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(0,255,65,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#00ff41';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,65,0.2)';
            }}
          >
            Đăng nhập
          </button>

          <img
            src="/1.png"
            alt="An Nam AI"
            style={{
              maxWidth: '70%',
              maxHeight: '55%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 60px rgba(0,255,65,0.15))'
            }}
          />

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <div style={{ fontSize: '18px', color: '#00ff41', textShadow: '0 0 20px rgba(0,255,65,0.1)' }}>
              🤖 An Nam AI - Siêu trợ lý đa phương thức
            </div>
            <div style={{ fontSize: '13px', marginTop: '8px', color: '#555' }}>
              <span style={{ margin: '0 8px' }}>🌟 Basic (10/ngày)</span>
              <span style={{ margin: '0 8px' }}>🚀 Pro (15/ngày)</span>
              <span style={{ margin: '0 8px' }}>👑 Premium (Vô hạn)</span>
            </div>
            <div style={{ fontSize: '12px', marginTop: '6px', color: '#444' }}>
              📸 Ảnh • 📄 Tài liệu • 💻 Code
            </div>
          </div>

          <Auth isOpen={showAuth} onClose={() => setShowAuth(false)} />
        </div>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a1a', color: '#00ff41' } }} />
      </>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0a' }}>
      <Sidebar
        conversations={conversations}
        currentChatId={currentChatId}
        setCurrentChatId={setCurrentChatId}
        setMessages={setMessages}
        createNewChat={createNewChat}
        deleteChat={deleteChat}
        user={user}
        logout={logout}
      />
      <ChatArea
        messages={messages}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        usage={usage}
        loading={chatLoading}
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        messagesEndRef={messagesEndRef}
        MODELS={MODELS}
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
        processFiles={processFiles}
        isProcessingFile={false}
        getSystemPrompt={getSystemPrompt}
      />
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a1a', color: '#00ff41' } }} />
    </div>
  );
};

export default App;
