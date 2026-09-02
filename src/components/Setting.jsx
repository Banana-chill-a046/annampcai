import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const Settings = ({ isOpen, onClose, user, logout, theme, setTheme, language, setLanguage }) => {
  const [showAbout, setShowAbout] = useState(false);

  if (!isOpen) return null;

  const themes = [
    { id: 'matrix', label: 'Matrix Hacker', emoji: '💻' },
    { id: 'light', label: 'Sáng', emoji: '☀️' },
    { id: 'dark', label: 'Tối', emoji: '🌙' },
    { id: 'stars', label: 'Sao băng lộng lẫy', emoji: '✨' }
  ];

  const languages = [
    { id: 'vi', label: 'Tiếng Việt' },
    { id: 'en', label: 'English' }
  ];

  const handleThemeChange = (themeId) => {
    setTheme(themeId);
    localStorage.setItem('theme', themeId);
    toast.success(`🎨 Đã chuyển giao diện: ${themes.find(t => t.id === themeId)?.label}`);
  };

  const handleLanguageChange = (langId) => {
    setLanguage(langId);
    localStorage.setItem('language', langId);
    toast.success(`🌐 Đã chuyển ngôn ngữ: ${languages.find(l => l.id === langId)?.label}`);
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        zIndex: 9999,
        paddingTop: '70px',
        paddingRight: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          width: '320px',
          maxWidth: '95%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{
          color: 'var(--text-primary)',
          fontSize: '18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          ⚙️ Cài đặt
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
            {user ? `👤 ${user.email?.split('@')[0]}` : ''}
          </span>
        </h3>

        {/* ===== NGÔN NGỮ ===== */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
            🌐 Ngôn ngữ
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {languages.map(lang => (
              <button
                key={lang.id}
                onClick={() => handleLanguageChange(lang.id)}
                style={{
                  padding: '6px 16px',
                  background: language === lang.id ? 'var(--text-primary)' : 'var(--input-bg)',
                  color: language === lang.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.3s'
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== GIAO DIỆN ===== */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
            🎨 Giao diện
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                style={{
                  padding: '6px 14px',
                  background: theme === t.id ? 'var(--text-primary)' : 'var(--input-bg)',
                  color: theme === t.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== ĐĂNG XUẤT ===== */}
        {user && (
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              background: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '12px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#cc0000';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(255,68,68,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ff4444';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🚪 Đăng xuất
          </button>
        )}

        {/* ===== VỀ CHÚNG TÔI ===== */}
        <button
          onClick={() => setShowAbout(!showAbout)}
          style={{
            width: '100%',
            padding: '10px',
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.3s',
            marginBottom: '10px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          ℹ️ Về chúng tôi
        </button>

        {showAbout && (
          <div style={{
            background: 'var(--bg-card)',
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '12px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6'
          }}>
            <p><strong style={{ color: 'var(--text-primary)' }}>🤖 An Nam AI</strong></p>
            <p>Được tạo bởi <strong>Vũ Hoàng An Nam</strong></p>
            <p>Trợ lý trí tuệ nhân tạo đa phương thức</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              © An Nam PC 2022 - 2026
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '8px',
            background: 'transparent',
            color: 'var(--text-muted)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          ✕ Đóng
        </button>
      </div>
    </div>
  );
};

export default Settings;
