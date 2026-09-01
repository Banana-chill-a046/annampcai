import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import toast from 'react-hot-toast';

export const useAuth = () => {
  // ===== STATE =====
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
      toast.success('🎉 Đăng nhập thành công!');
      return true;
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // ===== REGISTER =====
  const register = async (email, password) => {
    setAuthLoading(true);
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success('🎉 Đăng ký thành công!');
      return true;
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // ===== LOGIN WITH GOOGLE =====
  const loginWithGoogle = async () => {
    setAuthLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('🎉 Đăng nhập Google thành công!');
      return true;
    } catch (err) {
      const msg = getErrorMessage(err);
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
    } catch {
      toast.error('Đăng xuất thất bại!');
      return false;
    }
  };

  // ===== FORGOT PASSWORD =====
  const forgotPassword = async (email) => {
    setAuthLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('📧 Email đặt lại mật khẩu đã gửi!');
      return true;
    } catch {
      toast.error('Không thể gửi email!');
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // ===== HELPERS =====
  const getErrorMessage = (err) => {
    const errorMap = {
      'auth/user-not-found': '❌ Email không tồn tại.',
      'auth/wrong-password': '❌ Sai mật khẩu.',
      'auth/invalid-email': '❌ Email không hợp lệ.',
      'auth/too-many-requests': '❌ Quá nhiều lần thử. Vui lòng đợi.',
      'auth/email-already-in-use': '❌ Email đã được sử dụng.',
      'auth/weak-password': '❌ Mật khẩu quá yếu (tối thiểu 6 ký tự).',
      'auth/popup-closed-by-user': '❌ Bạn đã đóng cửa sổ đăng nhập.',
      'auth/popup-blocked': '❌ Popup bị chặn. Vui lòng cho phép popup.'
    };
    return errorMap[err.code] || err.message || '❌ Đã có lỗi xảy ra.';
  };

  return {
    user,
    loading,
    authLoading,
    error,
    setError,
    login,
    register,
    loginWithGoogle,
    logout,
    forgotPassword
  };
};
