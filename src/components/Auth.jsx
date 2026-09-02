import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const Auth = ({ isOpen, onClose }) => {
  const { login, register, loginWithGoogle, authLoading, error, setError, forgotPassword } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (!isOpen) return null;

  // ===== XỬ LÝ ĐĂNG NHẬP =====
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    
    const result = await login(email, password);
    if (result.success) {
      onClose();
      setEmail('');
      setPassword('');
    }
  };

  // ===== XỬ LÝ ĐĂNG KÝ =====
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Kiểm tra email
    if (!email) {
      setError('Vui lòng nhập email.');
      return;
    }

    // Kiểm tra password
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    // Kiểm tra xác nhận mật khẩu
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    // Thực hiện đăng ký
    const result = await register(email, password, displayName);
    if (result.success) {
      onClose();
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDisplayName('');
    }
  };

  // ===== XỬ LÝ QUÊN MẬT KHẨU =====
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Vui lòng nhập email để đặt lại mật khẩu.');
      return;
    }
    const result = await forgotPassword(email);
    if (result.success) {
      setShowForgotPassword(false);
    }
  };

  // ===== CHUYỂN ĐỔI GIỮA ĐĂNG NHẬP/ĐĂNG KÝ =====
  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  // ===== STYLES =====
  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    marginBottom: '14px',
    background: 'var(--input-bg)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    borderRadius: '10px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.3s'
  };

  const buttonStyle = {
    width: '100%',
    padding: '14px',
    background: 'var(--text-primary)',
    color: 'var(--bg-primary)',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '16px',
    boxShadow: '0 0 30px var(--shadow-color)',
    opacity: 1,
    cursor: 'pointer',
    transition: 'all 0.3s'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    opacity: 0.5,
    cursor: 'not-allowed'
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
          background: 'var(--bg-secondary)',
          padding: '40px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 0 60px var(--shadow-color)',
          width: '440px',
          maxWidth: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== HEADER ===== */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/2.png" alt="An Nam AI" style={{ height: '50px', marginBottom: '12px' }} />
          <h2 style={{
            color: 'var(--text-primary)',
            fontSize: '24px',
            textShadow: '0 0 30px var(--shadow-color)'
          }}>
            {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            {isLogin ? 'Chào mừng trở lại!' : 'Bắt đầu với An Nam AI'}
          </p>
        </div>

        {/* ===== FORM ===== */}
        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {/* Tên hiển thị - chỉ khi đăng ký */}
          {!isLogin && (
            <input
              type="text"
              placeholder="Tên hiển thị (tùy chọn)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={inputStyle}
            />
          )}

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          {/* Mật khẩu */}
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
          />

          {/* Xác nhận mật khẩu - chỉ khi đăng ký */}
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

          {/* Hiển thị lỗi */}
          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(255,68,68,0.1)',
              border: '1px solid #ff4444',
              borderRadius: '8px',
              marginBottom: '14px',
              color: '#ff4444',
              fontSize: '14px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Nút submit */}
          <button
            type="submit"
            disabled={authLoading}
            style={authLoading ? disabledButtonStyle : buttonStyle}
          >
            {authLoading ? '⏳ Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
          </button>
        </form>

        {/* ===== DIVIDER ===== */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>HOẶC</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* ===== ĐĂNG NHẬP GOOGLE ===== */}
        <button
          onClick={loginWithGoogle}
          disabled={authLoading}
          style={{
            width: '100%',
            padding: '14px',
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            fontSize: '15px',
            cursor: authLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            opacity: authLoading ? 0.5 : 1
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--input-bg)'}
        >
          <span style={{ fontSize: '20px' }}>🌐</span>
          Đăng nhập với Google
        </button>

        {/* ===== CHUYỂN ĐỔI GIỮA ĐĂNG NHẬP/ĐĂNG KÝ ===== */}
        <div style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <span
            onClick={switchMode}
            style={{ color: 'var(--text-primary)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Đăng ký' : 'Đăng nhập'}
          </span>
        </div>

        {/* ===== QUÊN MẬT KHẨU ===== */}
        {isLogin && (
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <span
              onClick={() => setShowForgotPassword(true)}
              style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
            >
              Quên mật khẩu?
            </span>
          </div>
        )}

        {/* ===== ĐÓNG ===== */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ✕ Đóng
        </button>
      </div>

      {/* ===== QUÊN MẬT KHẨU POPUP ===== */}
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
              background: 'var(--bg-secondary)',
              padding: '30px',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              width: '380px',
              maxWidth: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Đặt lại mật khẩu</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
              Nhập email để nhận link đặt lại mật khẩu.
            </p>
            <input
              type="email"
              placeholder="Email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                marginBottom: '14px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleForgotPassword}
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--text-primary)',
                color: 'var(--bg-primary)',
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
                color: 'var(--text-muted)',
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

export default Auth;
