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

  // ===== ĐĂNG NHẬP =====
  const login = async (email, password) => {
    setAuthLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('🎉 Đăng nhập thành công!');
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setAuthLoading(false);
    }
  };

  // ===== ĐĂNG KÝ =====
  const register = async (email, password, displayName = '') => {
    setAuthLoading(true);
    setError('');
    try {
      // Tạo tài khoản
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Cập nhật tên hiển thị nếu có
      if (displayName && displayName.trim()) {
        await updateProfile(userCredential.user, { 
          displayName: displayName.trim() 
        });
      }
      
      toast.success('🎉 Đăng ký thành công!');
      return { success: true, user: userCredential.user };
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setAuthLoading(false);
    }
  };

  // ===== ĐĂNG NHẬP GOOGLE =====
  const loginWithGoogle = async () => {
    setAuthLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('🎉 Đăng nhập Google thành công!');
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setAuthLoading(false);
    }
  };

  // ===== ĐĂNG XUẤT =====
  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Đã đăng xuất!');
      return { success: true };
    } catch (err) {
      toast.error('Đăng xuất thất bại!');
      return { success: false };
    }
  };

  // ===== QUÊN MẬT KHẨU =====
  const forgotPassword = async (email) => {
    setAuthLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('📧 Email đặt lại mật khẩu đã gửi!');
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setAuthLoading(false);
    }
  };

  // ===== XỬ LÝ LỖI =====
  const getErrorMessage = (err) => {
    console.log('Auth Error:', err); // Log để debug
    
    const errorMap = {
      'auth/user-not-found': '❌ Email không tồn tại. Vui lòng kiểm tra lại.',
      'auth/wrong-password': '❌ Sai mật khẩu. Vui lòng thử lại.',
      'auth/invalid-email': '❌ Email không hợp lệ. Vui lòng kiểm tra lại.',
      'auth/too-many-requests': '❌ Quá nhiều lần thử. Vui lòng đợi và thử lại sau.',
      'auth/email-already-in-use': '❌ Email này đã được sử dụng. Vui lòng dùng email khác hoặc đăng nhập.',
      'auth/weak-password': '❌ Mật khẩu quá yếu. Mật khẩu phải có ít nhất 6 ký tự.',
      'auth/popup-closed-by-user': '❌ Bạn đã đóng cửa sổ đăng nhập. Vui lòng mở lại.',
      'auth/popup-blocked': '❌ Popup bị chặn. Vui lòng cho phép popup trên trình duyệt.',
      'auth/network-request-failed': '❌ Mất kết nối mạng. Vui lòng kiểm tra internet.',
      'auth/internal-error': '❌ Lỗi hệ thống. Vui lòng thử lại sau.',
      'auth/operation-not-allowed': '❌ Đăng ký bằng email đang bị tắt. Vui lòng liên hệ quản trị viên.'
    };
    
    return errorMap[err.code] || `❌ Lỗi: ${err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.'}`;
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
    forgotPassword,
    getErrorMessage
  };
};
