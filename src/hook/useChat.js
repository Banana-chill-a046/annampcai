import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import Groq from '@groq/groq-sdk';
import toast from 'react-hot-toast';

// =============================================
// ===== GROQ CLIENT =====
// =============================================
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

// =============================================
// ===== MODEL CONFIGURATIONS =====
// =============================================
export const MODELS = {
  'llama-3.1-8b-instant': {
    id: 'llama-3.1-8b-instant',
    label: 'Basic',
    emoji: '🌟',
    limit: 10,
    supportImage: true,
    supportFile: false,
    maxTokens: 2048,
    temperature: 0.7,
    description: '🌟 10 lượt/ngày, hỗ trợ ảnh'
  },
  'llama-3.3-70b-versatile': {
    id: 'llama-3.3-70b-versatile',
    label: 'Pro',
    emoji: '🚀',
    limit: 15,
    supportImage: true,
    supportFile: true,
    maxTokens: 4096,
    temperature: 0.5,
    description: '🚀 15 lượt/ngày, hỗ trợ ảnh + tài liệu'
  },
  'deepseek-r1-distill-llama-70b': {
    id: 'deepseek-r1-distill-llama-70b',
    label: 'Premium',
    emoji: '👑',
    limit: Infinity,
    supportImage: true,
    supportFile: true,
    maxTokens: 8192,
    temperature: 0.3,
    description: '👑 Không giới hạn, siêu thông minh, mọi loại file'
  }
};

// =============================================
// ===== SYSTEM PROMPTS =====
// =============================================
const SYSTEM_PROMPTS = {
  basic: `Bạn là An Nam AI - trợ lý thông minh.
- Trả lời bằng tiếng Việt
- Phân tích ảnh cơ bản
- Nếu không biết: "Tôi không biết, vui lòng cung cấp rõ hơn!"`,

  pro: `Bạn là An Nam AI Pro - siêu trợ lý đa phương thức.
- Trả lời bằng tiếng Việt chuyên nghiệp
- Phân tích ảnh chi tiết
- Phân tích tài liệu: Excel, Word, PDF, PPT
- Hỗ trợ code: Python, Node.js`,

  premium: `Bạn là An Nam AI Premium - trợ lý toàn năng.
- Trả lời bằng tiếng Việt cao cấp
- Phân tích ảnh chuyên sâu
- Phân tích mọi loại tài liệu
- Viết code chuyên nghiệp như Claude
- Tư duy đa chiều, giải pháp tối ưu`
};

// =============================================
// ===== HOOK =====
// =============================================
export const useChat = (user) => {
  // ===== STATE =====
  const [conversations, setConversations] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama-3.1-8b-instant');
  const [usage, setUsage] = useState({ basic: 0, pro: 0, premium: 0 });
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // ===== GET MODEL KEY =====
  const getModelKey = (modelId) => {
    if (modelId === 'llama-3.1-8b-instant') return 'basic';
    if (modelId === 'llama-3.3-70b-versatile') return 'pro';
    return 'premium';
  };

  // ===== GET SYSTEM PROMPT =====
  const getSystemPrompt = (modelId) => {
    const key = getModelKey(modelId);
    return SYSTEM_PROMPTS[key] || SYSTEM_PROMPTS.basic;
  };

  // ===== LOAD CONVERSATIONS =====
  const loadConversations = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'users', user.uid, 'conversations'),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversations(convs);
      
      if (convs.length > 0 && !currentChatId) {
        setCurrentChatId(convs[0].id);
        setMessages(convs[0].messages || []);
      }
    } catch (error) {
      console.error('Load conversations error:', error);
      toast.error('Không thể tải lịch sử chat!');
    }
  };

  // ===== LOAD USAGE =====
  const loadUsage = async () => {
    if (!user) return;
    try {
      const ref = doc(db, 'users', user.uid, 'usage', 'daily');
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
        setUsage(docSnap.data());
      } else {
        const defaultUsage = { basic: 0, pro: 0, premium: 0 };
        await setDoc(ref, defaultUsage);
        setUsage(defaultUsage);
      }
    } catch (error) {
      console.error('Load usage error:', error);
    }
  };

  // ===== RESET DAILY USAGE =====
  const resetDailyUsage = async () => {
    if (!user) return;
    try {
      const today = new Date().toDateString();
      const lastReset = localStorage.getItem(`reset_${user.uid}`);
      if (lastReset !== today) {
        const ref = doc(db, 'users', user.uid, 'usage', 'daily');
        await setDoc(ref, { basic: 0, pro: 0, premium: 0 });
        setUsage({ basic: 0, pro: 0, premium: 0 });
        localStorage.setItem(`reset_${user.uid}`, today);
      }
    } catch (error) {
      console.error('Reset usage error:', error);
    }
  };

  // ===== CREATE NEW CHAT =====
  const createNewChat = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập!');
      return;
    }
    try {
      const newChat = {
        title: 'Chat mới',
        messages: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        model: selectedModel,
        hasFiles: false
      };
      const ref = await addDoc(
        collection(db, 'users', user.uid, 'conversations'),
        newChat
      );
      setCurrentChatId(ref.id);
      setMessages([]);
      setUploadedFiles([]);
      await loadConversations();
      toast.success('✅ Tạo chat mới thành công!');
    } catch (error) {
      console.error('Create chat error:', error);
      toast.error('Không thể tạo chat mới!');
    }
  };

  // ===== DELETE CHAT =====
  const deleteChat = async (chatId) => {
    if (!user || !chatId) return;
    if (!window.confirm('Bạn có chắc muốn xóa chat này?')) return;
    
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'conversations', chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
      await loadConversations();
      toast.success('✅ Đã xóa chat!');
    } catch (error) {
      console.error('Delete chat error:', error);
      toast.error('Không thể xóa chat!');
    }
  };

  // ===== PROCESS FILES =====
  const processFiles = async (files) => {
    const processed = [];
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();
      
      const content = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        if (isImage) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      });

      processed.push({
        name: file.name,
        type: isImage ? 'image' : 'document',
        content: content,
        size: file.size,
        mimeType: file.type
      });
    }
    setUploadedFiles(processed);
    return processed;
  };

  // ===== SEND MESSAGE =====
  const sendMessage = async (input) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập!');
      return;
    }

    if (!input.trim() && uploadedFiles.length === 0) return;
    if (loading) return;

    // Check usage limit
    const modelKey = getModelKey(selectedModel);
    const modelInfo = MODELS[selectedModel];
    const used = usage[modelKey] || 0;

    if (modelInfo.limit !== Infinity && used >= modelInfo.limit) {
      toast.error(`❌ Hết lượt ${modelInfo.label} hôm nay! Vui lòng đợi đến ngày mai.`);
      return;
    }

    // Create new chat if none
    if (!currentChatId) {
      await createNewChat();
      setTimeout(() => sendMessage(input), 400);
      return;
    }

    // Build message with files
    let content = input.trim();
    if (uploadedFiles.length > 0) {
      const fileDescriptions = uploadedFiles.map(f => {
        if (f.type === 'image') {
          return `[HÌNH ẢNH: ${f.name}] - Phân tích nội dung hình ảnh này`;
        } else {
          return `[TÀI LIỆU: ${f.name}]\n${f.content}`;
        }
      });
      content = content + '\n\n' + fileDescriptions.join('\n\n');
    }

    // Create user message
    const userMsg = {
      role: 'user',
      content: content,
      files: uploadedFiles.map(f => ({ name: f.name, type: f.type }))
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    const chatRef = doc(db, 'users', user.uid, 'conversations', currentChatId);
    await updateDoc(chatRef, {
      messages: newMessages,
      updatedAt: serverTimestamp(),
      hasFiles: uploadedFiles.length > 0
    });

    try {
      // Call Groq API
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: getSystemPrompt(selectedModel) },
          ...newMessages.map(m => ({ role: m.role, content: m.content }))
        ],
        model: selectedModel,
        temperature: modelInfo.temperature,
        max_tokens: modelInfo.maxTokens
      });

      const aiContent = completion.choices[0]?.message?.content || 
        'Xin lỗi, tôi không thể trả lời câu hỏi này.';

      const aiMsg = { role: 'assistant', content: aiContent };
      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);

      await updateDoc(chatRef, {
        messages: finalMessages,
        updatedAt: serverTimestamp()
      });

      // Update usage
      const usageRef = doc(db, 'users', user.uid, 'usage', 'daily');
      const newCount = (usage[modelKey] || 0) + 1;
      const updated = { ...usage, [modelKey]: newCount };
      await setDoc(usageRef, updated);
      setUsage(updated);

      // Clear uploaded files
      setUploadedFiles([]);

    } catch (error) {
      console.error('Groq API error:', error);
      
      let errorMessage = '⚠️ Lỗi kết nối AI. Vui lòng thử lại.';
      if (error.message?.includes('rate limit')) {
        errorMessage = '⏳ Quá nhiều yêu cầu. Vui lòng đợi 1 phút.';
      } else if (error.message?.includes('invalid')) {
        errorMessage = '🔑 Lỗi API Key. Vui lòng kiểm tra cấu hình.';
      }

      const errorMsg = { role: 'assistant', content: errorMessage };
      const finalMessages = [...newMessages, errorMsg];
      setMessages(finalMessages);
      await updateDoc(chatRef, {
        messages: finalMessages,
        updatedAt: serverTimestamp()
      });
      toast.error('Lỗi kết nối AI!');
    }

    setLoading(false);
  };

  // ===== REAL-TIME LISTENER =====
  useEffect(() => {
    if (!user || !currentChatId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid, 'conversations', currentChatId),
      (docSnap) => {
        if (docSnap.exists()) {
          setMessages(docSnap.data().messages || []);
        }
      },
      (error) => {
        console.error('Real-time error:', error);
      }
    );

    return () => unsubscribe();
  }, [user, currentChatId]);

  // ===== LOAD DATA =====
  useEffect(() => {
    if (user) {
      loadConversations();
      loadUsage();
      resetDailyUsage();
    } else {
      setConversations([]);
      setCurrentChatId(null);
      setMessages([]);
    }
  }, [user]);

  return {
    conversations,
    currentChatId,
    setCurrentChatId,
    messages,
    setMessages,
    selectedModel,
    setSelectedModel,
    usage,
    loading,
    uploadedFiles,
    setUploadedFiles,
    createNewChat,
    deleteChat,
    sendMessage,
    processFiles,
    MODELS,
    getSystemPrompt
  };
};
