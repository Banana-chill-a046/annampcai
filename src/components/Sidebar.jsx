import React, { useState } from 'react';

const Sidebar = ({
  conversations,
  currentChatId,
  setCurrentChatId,
  setMessages,
  createNewChat,
  deleteChat,
  user,
  onSettingsClick
}) => {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div style={{
      width: '280px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      flexShrink: 0,
      height: '100vh'
    }}>
      {/* ===== HEADER ===== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/2.png" alt="Logo" style={{ height: '30px' }} />
          <span style={{
            fontSize: '15px',
            fontWeight: 'bold',
            color: 'var(--text-primary)'
          }}>
            Lịch sử
          </span>
        </div>
        <button
          onClick={createNewChat}
          style={{
            background: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          + Mới
        </button>
      </div>

      {/* ===== LIST ===== */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <div style={{
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '40px',
            fontSize: '14px'
          }}>
            Chưa có cuộc trò chuyện nào
            <br />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {user ? 'Nhấn "+ Mới" để bắt đầu' : 'Đăng nhập để lưu lịch sử'}
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
                background: currentChatId === conv.id ? 'var(--hover-bg)' : 'transparent',
                borderRadius: '10px',
                cursor: 'pointer',
                border: currentChatId === conv.id ? '1px solid var(--border-color)' : '1px solid transparent',
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
                color: currentChatId === conv.id ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}>
                {conv.hasFiles && '📎 '}
                {conv.title || 'Chat mới'}
              </span>
              {(hoveredId === conv.id || currentChatId === conv.id) && user && (
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
      <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={onSettingsClick}
          style={{
            width: '100%',
            padding: '10px',
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          ⚙️ Cài đặt
          {user && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              👤 {user.email?.split('@')[0]}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
