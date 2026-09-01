import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');

  // ===== LISTEN AUTH STATE =====
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ===== LOGIN =====
  const login = async (email, password) => {
    setAuthLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Đăng nhập thành công! 🎉');
      return true;
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // ===== REGISTER =====
  const register = async (email, password, displayName = '') => {
    setAuthLoading(true);
    setError('');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      toast.success('Đăng ký thành công! 🎉');
      return true;
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // ===== GOOGLE LOGIN =====
  const loginWithGoogle = async () => {
    setAuthLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Đăng nhập Google thành công! 🎉');
      return true;
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // ===== LOGOUT =====
  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Đã đăng xuất!');
      return true;
    } catch (err) {
      toast.error('Đăng xuất thất bại!');
      return false;
    }
  };

  // ===== FORGOT PASSWORD =====
  const forgotPassword = async (email) => {
    setAuthLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Email đặt lại mật khẩu đã gửi! 📧');
      return true;
    } catch (err) {
      const msg = 'Không thể gửi email. Vui lòng kiểm tra lại.';
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // ===== HELPERS =====
  const getAuthErrorMessage = (err) => {
    const map = {
      'auth/user-not-found': 'Email không tồn tại.',
      'auth/wrong-password': 'Sai mật khẩu.',
      'auth/invalid-email': 'Email không hợp lệ.',
      'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng đợi.',
      'auth/email-already-in-use': 'Email đã được sử dụng.',
      'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự).',
      'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập.',
      'auth/popup-blocked': 'Popup bị chặn. Vui lòng cho phép popup.'
    };
    return map[err.code] || err.message || 'Đã có lỗi xảy ra.';
  };

  return {
    user,
    loading,
    authLoading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
    forgotPassword,
    setError
  };
};
