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
const MODELS = {
  // ===== BASIC =====
  'llama-3.1-8b-instant': {
    id: 'llama-3.1-8b-instant',
    label: 'Basic',
    emoji: '🌟',
    limit: 10,
    imageSupport: true,
    fileSupport: false,
    maxTokens: 2048,
    temperature: 0.7,
    description: 'Thông minh vừa phải, hỗ trợ ảnh (10 ảnh/ngày)',
    price: 'Miễn phí'
  },
  
  // ===== PRO =====
  'llama-3.3-70b-versatile': {
    id: 'llama-3.3-70b-versatile',
    label: 'Pro',
    emoji: '🚀',
    limit: 15,
    imageSupport: true,
    fileSupport: true,
    maxTokens: 4096,
    temperature: 0.5,
    description: 'Thông minh hơn, hỗ trợ ảnh + tài liệu (15 lượt/ngày)',
    price: 'Cao cấp'
  },
  
  // ===== PREMIUM =====
  'deepseek-r1-distill-llama-70b': {
    id: 'deepseek-r1-distill-llama-70b',
    label: 'Premium',
    emoji: '👑',
    limit: Infinity,
    imageSupport: true,
    fileSupport: true,
    maxTokens: 8192,
    temperature: 0.3,
    description: 'Vô hạn, siêu thông minh, xử lý mọi loại file',
    price: 'VIP'
  }
};

// =============================================
// ===== SYSTEM PROMPTS =====
// =============================================
const SYSTEM_PROMPTS = {
  basic: `Bạn là An Nam AI - trợ lý thông minh với khả năng phân tích ảnh cơ bản.
  - Trả lời bằng tiếng Việt
  - Phân tích ảnh: mô tả chi tiết nội dung, màu sắc, đối tượng
  - Nếu không biết: "Tôi không biết, vui lòng cung cấp rõ hơn!"`,

  pro: `Bạn là An Nam AI Pro - siêu trợ lý đa phương thức.
  - Trả lời bằng tiếng Việt chuyên nghiệp
  - Phân tích ảnh: mô tả chi tiết, nhận diện đối tượng, cảm xúc, bối cảnh
  - Phân tích tài liệu: trích xuất thông tin, tóm tắt, phân tích dữ liệu
  - Hỗ trợ code: Python, Node.js, viết code chuẩn chỉnh`,

  premium: `Bạn là An Nam AI Premium - trợ lý toàn năng.
  - Trả lời bằng tiếng Việt cao cấp, chuyên sâu
  - Phân tích ảnh: chuyên sâu, nhận diện chi tiết, phân tích nghệ thuật
  - Phân tích tài liệu: Excel, Word, PDF, PPT - trích xuất và phân tích toàn diện
  - Code: viết code chuyên nghiệp như Claude, giải thích chi tiết
  - Tư duy: phân tích đa chiều, đưa ra giải pháp tối ưu`
};

// =============================================
// ===== FILE PROCESSING HELPERS =====
// =============================================
const processImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({
        type: 'image',
        name: file.name,
        size: file.size,
        data: e.target.result,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  });
};

const processDocument = async (file) => {
  const text = await extractTextFromFile(file);
  return {
    type: 'document',
    name: file.name,
    size: file.size,
    content: text,
    extension: file.name.split('.').pop().toLowerCase()
  };
};

const extractTextFromFile = async (file) => {
  const extension = file.name.split('.').pop().toLowerCase();
  const text = await file.text();
  
  // Xử lý các loại file khác nhau
  if (extension === 'txt' || extension === 'py' || extension === 'js' || extension === 'json') {
    return text;
  }
  
  if (extension === 'csv') {
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => line.split(','));
    return `📊 FILE CSV: ${file.name}\nHeaders: ${headers.join(', ')}\nDữ liệu: ${data.length} dòng\n\n${text}`;
  }
  
  if (extension === 'pdf') {
    return `📄 FILE PDF: ${file.name}\nNội dung được trích xuất:\n\n${text}`;
  }
  
  if (extension === 'docx' || extension === 'doc') {
    return `📝 FILE WORD: ${file.name}\nNội dung:\n\n${text}`;
  }
  
  if (extension === 'pptx' || extension === 'ppt') {
    return `📊 FILE POWERPOINT: ${file.name}\nNội dung slide:\n\n${text}`;
  }
  
  if (extension === 'xlsx' || extension === 'xls') {
    const lines = text.split('\n');
    return `📊 FILE EXCEL: ${file.name}\nDữ liệu:\n\n${text}`;
  }
  
  return text;
};

// =============================================
// ===== HOOK: useChat =====
// =============================================
export const useChat = (user) => {
  const [conversations, setConversations] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama-3.1-8b-instant');
  const [usage, setUsage] = useState({ basic: 0, pro: 0, premium: 0 });
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // ===== LOAD CONVERSATIONS =====
  const loadConversations = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'users', user.uid, 'conversations'), orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setConversations(convs);
      if (convs.length > 0 && !currentChatId) {
        setCurrentChatId(convs[0].id);
        setMessages(convs[0].messages || []);
      }
    } catch (error) {
      toast.error('Không thể tải lịch sử chat!');
    }
  };

  // ===== LOAD USAGE =====
  const loadUsage = async () => {
    if (!user) return;
    try {
      const ref = doc(db, 'users', user.uid, 'usage', 'daily');
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) setUsage(docSnap.data());
      else {
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
    if (!user) return;
    try {
      const modelKey = getModelKey(selectedModel);
      const newChat = {
        title: 'Chat mới',
        messages: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        model: selectedModel,
        hasFiles: false
      };
      const ref = await addDoc(collection(db, 'users', user.uid, 'conversations'), newChat);
      setCurrentChatId(ref.id);
      setMessages([]);
      setUploadedFiles([]);
      await loadConversations();
      toast.success('Tạo chat mới!');
    } catch (error) {
      toast.error('Không thể tạo chat!');
    }
  };

  // ===== DELETE CHAT =====
  const deleteChat = async (chatId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'conversations', chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
      await loadConversations();
      toast.success('Đã xóa chat!');
    } catch (error) {
      toast.error('Không thể xóa chat!');
    }
  };

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

  // ===== CHECK USAGE LIMIT =====
  const checkUsageLimit = (modelId) => {
    const modelInfo = MODELS[modelId];
    if (modelInfo.limit === Infinity) return true;
    
    const key = getModelKey(modelId);
    const used = usage[key] || 0;
    return used < modelInfo.limit;
  };

  // ===== PROCESS FILES =====
  const processFiles = async (files) => {
    setIsProcessingFile(true);
    const processedFiles = [];
    
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isDocument = [
        'txt', 'py', 'js', 'json', 'csv', 'pdf', 
        'doc', 'docx', 'pptx', 'ppt', 'xlsx', 'xls'
      ].includes(file.name.split('.').pop().toLowerCase());
      
      if (isImage) {
        const processed = await processImage(file);
        processedFiles.push(processed);
      } else if (isDocument) {
        const processed = await processDocument(file);
        processedFiles.push(processed);
      } else {
        toast.error(`Không hỗ trợ file: ${file.name}`);
      }
    }
    
    setUploadedFiles(processedFiles);
    setIsProcessingFile(false);
    return processedFiles;
  };

  // ===== SEND MESSAGE WITH FILES =====
  const sendMessage = async (input) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập!');
      return;
    }

    if (!input.trim() && uploadedFiles.length === 0) return;
    if (loading) return;

    // Check usage limit
    if (!checkUsageLimit(selectedModel)) {
      const modelInfo = MODELS[selectedModel];
      toast.error(`Hết lượt ${modelInfo.label} hôm nay! Vui lòng đợi đến ngày mai.`);
      return;
    }

    // Create new chat if none
    if (!currentChatId) {
      await createNewChat();
      setTimeout(() => sendMessage(input), 300);
      return;
    }

    // Build message content
    let content = input.trim();
    let fileDescriptions = [];

    // Process files
    if (uploadedFiles.length > 0) {
      const modelInfo = MODELS[selectedModel];
      
      // Check if model supports files
      if (!modelInfo.fileSupport && uploadedFiles.some(f => f.type === 'document')) {
        toast.error(`${modelInfo.label} không hỗ trợ tài liệu!`);
        return;
      }
      
      if (!modelInfo.imageSupport && uploadedFiles.some(f => f.type === 'image')) {
        toast.error(`${modelInfo.label} không hỗ trợ ảnh!`);
        return;
      }

      fileDescriptions = uploadedFiles.map(f => {
        if (f.type === 'image') {
          return `[HÌNH ẢNH: ${f.name}] - Phân tích nội dung hình ảnh này`;
        } else {
          return `[TÀI LIỆU: ${f.name}]\n${f.content}`;
        }
      });

      content = content + '\n\n' + fileDescriptions.join('\n\n');
    }

    const userMsg = { 
      role: 'user', 
      content: content,
      files: uploadedFiles.map(f => ({ name: f.name, type: f.type }))
    };
    
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setLoading(true);

    const chatRef = doc(db, 'users', user.uid, 'conversations', currentChatId);
    await updateDoc(chatRef, { 
      messages: newMsgs, 
      updatedAt: serverTimestamp(),
      hasFiles: uploadedFiles.length > 0
    });

    try {
      const modelInfo = MODELS[selectedModel];
      const systemPrompt = getSystemPrompt(selectedModel);

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...newMsgs.map(m => ({ role: m.role, content: m.content }))
        ],
        model: selectedModel,
        temperature: modelInfo.temperature,
        max_tokens: modelInfo.maxTokens
      });

      const aiContent = completion.choices[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời.';
      const aiMsg = { role: 'assistant', content: aiContent };
      const finalMsgs = [...newMsgs, aiMsg];
      setMessages(finalMsgs);
      await updateDoc(chatRef, { messages: finalMsgs, updatedAt: serverTimestamp() });

      // Update usage
      const key = getModelKey(selectedModel);
      const usageRef = doc(db, 'users', user.uid, 'usage', 'daily');
      const newCount = (usage[key] || 0) + 1;
      const updated = { ...usage, [key]: newCount };
      await setDoc(usageRef, updated);
      setUsage(updated);

      // Clear uploaded files after sending
      setUploadedFiles([]);

    } catch (error) {
      console.error('Groq API error:', error);
      let errorMessage = '⚠️ Lỗi kết nối AI. Vui lòng thử lại.';
      
      if (error.message?.includes('rate limit')) {
        errorMessage = '⏳ Quá nhiều yêu cầu. Vui lòng đợi 1 phút.';
      } else if (error.message?.includes('invalid')) {
        errorMessage = '🔑 Lỗi API Key. Vui lòng kiểm tra cấu hình.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = '⏱️ Kết nối quá chậm. Vui lòng thử lại.';
      }

      const errorMsg = { role: 'assistant', content: errorMessage };
      const finalMsgs = [...newMsgs, errorMsg];
      setMessages(finalMsgs);
      await updateDoc(chatRef, { messages: finalMsgs, updatedAt: serverTimestamp() });
      toast.error('Lỗi kết nối AI!');
    }
    setLoading(false);
  };

  // ===== REAL-TIME LISTENER =====
  useEffect(() => {
    if (!user || !currentChatId) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid, 'conversations', currentChatId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setMessages(data.messages || []);
      }
    });
    return () => unsub();
  }, [user, currentChatId]);

  // ===== LOAD DATA =====
  useEffect(() => {
    if (user) {
      loadConversations();
      loadUsage();
      resetDailyUsage();
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
    isProcessingFile,
    uploadedFiles,
    setUploadedFiles,
    createNewChat,
    deleteChat,
    sendMessage,
    processFiles,
    checkUsageLimit,
    MODELS,
    getSystemPrompt
  };
};
