import React, { useState } from 'react';

const Sidebar = ({
  conversations,
  currentChatId,
  setCurrentChatId,
  setMessages,
  createNewChat,
  deleteChat,
  user,
  logout
}) => {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div style={{
      width: '280px',
      background: '#0d0d0d',
      borderRight: '1px solid rgba(0,255,65,0.1)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      flexShrink: 0,
      height: '100vh'
    }}>
      {/* ===== HEADER ===== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '1px solid rgba(0,255,65,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/2.png" alt="Logo" style={{ height: '30px' }} />
          <span style={{
            fontSize: '15px',
            fontWeight: 'bold',
            color: '#00ff41',
            textShadow: '0 0 10px rgba(0,255,65,0.15)'
          }}>
            Lịch sử
          </span>
        </div>
        <button
          onClick={createNewChat}
          style={{
            background: '#00ff41',
            color: '#0a0a0a',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '13px',
            boxShadow: '0 0 15px rgba(0,255,65,0.15)',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 30px rgba(0,255,65,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,65,0.15)'}
        >
          + Mới
        </button>
      </div>

      {/* ===== LIST ===== */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <div style={{
            color: '#555',
            textAlign: 'center',
            marginTop: '40px',
            fontSize: '14px'
          }}>
            Chưa có cuộc trò chuyện nào
            <br />
            <span style={{ fontSize: '12px', color: '#444' }}>
              Nhấn "+ Mới" để bắt đầu
            </span>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                setCurrentChatId(conv.id);
                setMessages(conv.messages || []);
              }}
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                padding: '10px 12px',
                marginBottom: '6px',
                background: currentChatId === conv.id ? 'rgba(0,255,65,0.06)' : '#1a1a1a',
                borderRadius: '10px',
                cursor: 'pointer',
                border: currentChatId === conv.id ? '1px solid rgba(0,255,65,0.2)' : '1px solid transparent',
                transition: 'all 0.3s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{
                fontSize: '13px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '180px',
                color: currentChatId === conv.id ? '#00ff41' : '#ccc'
              }}>
                {conv.hasFiles && '📎 '}
                {conv.title || 'Chat mới'}
              </span>
              {(hoveredId === conv.id || currentChatId === conv.id) && (
                <span
                  onClick={(e) => { e.stopPropagation(); deleteChat(conv.id); }}
                  style={{
                    color: '#ff4444',
                    cursor: 'pointer',
                    fontSize: '14px',
                    opacity: 0.6,
                    transition: 'opacity 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                >
                  ✕
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* ===== FOOTER ===== */}
      <div style={{ paddingTop: '15px', borderTop: '1px solid rgba(0,255,65,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(0,255,65,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#00ff41'
          }}>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <span style={{
            fontSize: '13px',
            color: '#aaa',
            flex: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {user?.email}
          </span>
        </div>
        <button
          onClick={logout}
          style={{
            width: '100%',
            padding: '10px',
            background: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            fontWeight: 'bold',
            boxShadow: '0 0 15px rgba(255,68,68,0.15)',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 30px rgba(255,68,68,0.3)';
            e.currentTarget.style.background = '#cc0000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 15px rgba(255,68,68,0.15)';
            e.currentTarget.style.background = '#ff4444';
          }}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
