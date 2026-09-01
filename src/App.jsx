import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const Auth = ({ isOpen, onClose }) => {
  const { login, register, loginWithGoogle, authLoading, error, setError } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      await login(email, password);
      if (!error) onClose();
    } else {
      if (password !== confirmPassword) {
        setError('Mật khẩu không khớp!');
        return;
      }
      if (password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự!');
        return;
      }
      const success = await register(email, password, displayName);
      if (success) onClose();
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Vui lòng nhập email!');
      return;
    }
    await forgotPassword(email);
    if (!error) setShowForgotPassword(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0d0d0d',
          padding: '40px',
          borderRadius: '20px',
          border: '1px solid #00ff41',
          boxShadow: '0 0 80px rgba(0,255,65,0.15)',
          width: '440px',
          maxWidth: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== HEADER ===== */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img src="/2.png" alt="An Nam AI" style={{ height: '50px', marginBottom: '12px' }} />
          <h2 style={{
            color: '#00ff41',
            fontSize: '24px',
            textShadow: '0 0 30px rgba(0,255,65,0.3)'
          }}>
            {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h2>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '6px' }}>
            {isLogin ? 'Chào mừng trở lại!' : 'Bắt đầu hành trình với An Nam AI'}
          </p>
        </div>

        {/* ===== FORM ===== */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Tên hiển thị (tùy chọn)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={inputStyle}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          {!isLogin && (
            <input
              type="password"
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={inputStyle}
            />
          )}

          {error && (
            <p style={{ color: '#ff4444', fontSize: '14px', marginBottom: '12px' }}>
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={authLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: '#00ff41',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '16px',
              boxShadow: '0 0 30px rgba(0,255,65,0.3)',
              cursor: authLoading ? 'not-allowed' : 'pointer',
              opacity: authLoading ? 0.5 : 1,
              transition: 'all 0.3s'
            }}
          >
            {authLoading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
          </button>
        </form>

        {/* ===== DIVIDER ===== */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          margin: '20px 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#333' }} />
          <span style={{ color: '#666', fontSize: '13px' }}>HOẶC</span>
          <div style={{ flex: 1, height: '1px', background: '#333' }} />
        </div>

        {/* ===== GOOGLE ===== */}
        <button
          onClick={loginWithGoogle}
          disabled={authLoading}
          style={{
            width: '100%',
            padding: '14px',
            background: '#1a1a1a',
            color: '#00ff41',
            border: '1px solid #00ff41',
            borderRadius: '12px',
            fontSize: '15px',
            cursor: authLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,255,65,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#1a1a1a'}
        >
          <span style={{ fontSize: '20px' }}>🌐</span>
          Đăng nhập với Google
        </button>

        {/* ===== FOOTER ===== */}
        <div style={{ textAlign: 'center', marginTop: '20px', color: '#888', fontSize: '14px' }}>
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <span
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ color: '#00ff41', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </span>
        </div>

        {isLogin && (
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <span
              onClick={() => setShowForgotPassword(true)}
              style={{ color: '#666', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
            >
              Quên mật khẩu?
            </span>
          </div>
        )}

        {/* ===== CLOSE ===== */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '16px',
            background: 'transparent',
            border: 'none',
            color: '#555',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ✕ Đóng
        </button>
      </div>

      {/* ===== FORGOT PASSWORD POPUP ===== */}
      {showForgotPassword && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000
          }}
          onClick={() => setShowForgotPassword(false)}
        >
          <div
            style={{
              background: '#0d0d0d',
              padding: '30px',
              borderRadius: '16px',
              border: '1px solid #00ff41',
              width: '380px',
              maxWidth: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#00ff41', marginBottom: '16px' }}>Đặt lại mật khẩu</h3>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>
              Nhập email của bạn để nhận link đặt lại mật khẩu.
            </p>
            <input
              type="email"
              placeholder="Email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={handleForgotPassword}
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '12px',
                background: '#00ff41',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                marginTop: '12px',
                cursor: authLoading ? 'not-allowed' : 'pointer',
                opacity: authLoading ? 0.5 : 1
              }}
            >
              {authLoading ? 'Đang gửi...' : 'Gửi email'}
            </button>
            <button
              onClick={() => setShowForgotPassword(false)}
              style={{
                width: '100%',
                marginTop: '10px',
                background: 'transparent',
                border: 'none',
                color: '#555',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== STYLES =====
const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  marginBottom: '14px',
  background: '#1a1a1a',
  border: '1px solid rgba(0,255,65,0.2)',
  color: '#00ff41',
  borderRadius: '10px',
  fontSize: '15px',
  outline: 'none',
  transition: 'border-color 0.3s'
};

export default Auth;
