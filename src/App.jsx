import React, { useState, useEffect, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
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
import { auth, db, googleProvider } from './firebase';
import Groq from '@groq/groq-sdk';
import ReactMarkdown from 'react-markdown';

// ===== GROQ CLIENT =====
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

// ===== CONSTANTS =====
const MODELS = {
  'llama-3.1-8b-instant': { label: 'Basic', limit: Infinity, emoji: '⚡' },
  'llama-3.3-70b-versatile': { label: 'Pro Search', limit: 15, emoji: '🎯' },
  'deepseek-r1-distill-llama-70b': { label: 'Dev', limit: 10, emoji: '💻' }
};

const SYSTEM_PROMPT = `Bạn là An Nam PC AI - một trợ lý trí tuệ nhân tạo thông minh. 
Nếu gặp thông tin chưa rõ hoặc không biết, bạn hãy trả lời đúng nguyên văn: 
"Tôi không biết thứ bạn hỏi, vui lòng cung cấp rõ hơn!"`;

// ===== APP =====
export default function App() {
  // Auth
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Chat
  const [conversations, setConversations] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  // Model & Usage
  const [selectedModel, setSelectedModel] = useState('llama-3.1-8b-instant');
  const [usage, setUsage] = useState({ basic: 0, pro: 0, dev: 0 });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ===== AUTH EFFECT =====
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadConversations(u.uid);
        await loadUsage(u.uid);
        const today = new Date().toDateString();
        if (localStorage.getItem(`reset_${u.uid}`) !== today) {
          await setDoc(doc(db, 'users', u.uid, 'usage', 'daily'), { basic: 0, pro: 0, dev: 0 });
          localStorage.setItem(`reset_${u.uid}`, today);
        }
      } else {
        setConversations([]);
        setCurrentChatId(null);
        setMessages([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ===== REAL-TIME CHAT =====
  useEffect(() => {
    if (!user || !currentChatId) return;
    const unsub = onSnapshot(
      doc(db, 'users', user.uid, 'conversations', currentChatId),
      (doc) => {
        if (doc.exists()) setMessages(doc.data().messages || []);
      }
    );
    return () => unsub();
  }, [user, currentChatId]);

  // ===== SCROLL =====
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ===== FIRESTORE FUNCTIONS =====
  const loadConversations = async (uid) => {
    const q = query(collection(db, 'users', uid, 'conversations'), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setConversations(convs);
    if (convs.length && !currentChatId) {
      setCurrentChatId(convs[0].id);
      setMessages(convs[0].messages || []);
    }
  };

  const loadUsage = async (uid) => {
    const ref = doc(db, 'users', uid, 'usage', 'daily');
    const docSnap = await getDoc(ref);
    if (docSnap.exists()) setUsage(docSnap.data());
    else {
      await setDoc(ref, { basic: 0, pro: 0, dev: 0 });
      setUsage({ basic: 0, pro: 0, dev: 0 });
    }
  };

  const createNewChat = async () => {
    if (!user) return;
    const newChat = {
      title: 'Chat mới',
      messages: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      model: selectedModel
    };
    const ref = await addDoc(collection(db, 'users', user.uid, 'conversations'), newChat);
    setCurrentChatId(ref.id);
    setMessages([]);
    await loadConversations(user.uid);
    inputRef.current?.focus();
  };

  const deleteChat = async (chatId) => {
    if (!window.confirm('Xóa chat này?')) return;
    await deleteDoc(doc(db, 'users', user.uid, 'conversations', chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setMessages([]);
    }
    await loadConversations(user.uid);
  };

  // ===== SEND MESSAGE =====
  const sendMessage = async () => {
    if (!input.trim() || loadingAI || !user) return;

    const modelKey = selectedModel;
    const modelInfo = MODELS[modelKey];
    const usageKey = modelKey === 'llama-3.3-70b-versatile' ? 'pro' : 'dev';
    const used = usage[usageKey] || 0;

    if (modelInfo.limit !== Infinity && used >= modelInfo.limit) {
      alert(`Hết lượt ${modelInfo.label}. Chuyển sang Basic.`);
      setSelectedModel('llama-3.1-8b-instant');
      return;
    }

    // Nếu chưa có chat, tạo mới
    if (!currentChatId) {
      await createNewChat();
      setTimeout(() => sendMessage(), 200);
      return;
    }

    const userMsg = { role: 'user', content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoadingAI(true);

    const chatRef = doc(db, 'users', user.uid, 'conversations', currentChatId);
    await updateDoc(chatRef, { messages: newMsgs, updatedAt: serverTimestamp() });

    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...newMsgs],
        model: modelKey,
        temperature: 0.7,
        max_tokens: 2048,
      });

      const aiMsg = {
        role: 'assistant',
        content: completion.choices[0]?.message?.content || 'Xin lỗi, tôi không trả lời được.'
      };
      const finalMsgs = [...newMsgs, aiMsg];
      setMessages(finalMsgs);
      await updateDoc(chatRef, { messages: finalMsgs, updatedAt: serverTimestamp() });

      // Update usage
      const usageRef = doc(db, 'users', user.uid, 'usage', 'daily');
      const newCount = (usage[usageKey] || 0) + 1;
      const updated = { ...usage, [usageKey]: newCount };
      await setDoc(usageRef, updated);
      setUsage(updated);
    } catch (e) {
      console.error(e);
      const errorMsg = { role: 'assistant', content: '⚠️ Lỗi kết nối AI. Thử lại sau.' };
      const finalMsgs = [...newMsgs, errorMsg];
      setMessages(finalMsgs);
      await updateDoc(chatRef, { messages: finalMsgs, updatedAt: serverTimestamp() });
    }
    setLoadingAI(false);
  };

  // ===== AUTH HANDLERS =====
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowAuth(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setAuthError('Mật khẩu không khớp!');
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setShowAuth(false);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setShowAuth(false);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // ===== RENDER =====
  if (loading) {
    return (
      <div style={{ color: '#00ff41', textAlign: 'center', marginTop: 50, fontSize: 20 }}>
        ⏳ Đang tải...
      </div>
    );
  }

  // ===== CHƯA ĐĂNG NHẬP =====
  if (!user) {
    return (
      <div style={{
        height: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <button
          onClick={() => setShowAuth(true)}
          style={{
            position: 'absolute',
            top: 20,
            right: 30,
            background: 'transparent',
            border: '1px solid #00ff41',
            color: '#00ff41',
            padding: '10px 24px',
            borderRadius: 30,
            fontSize: 16,
            boxShadow: '0 0 15px #00ff4133',
            transition: 'all 0.3s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#00ff41';
            e.currentTarget.style.color = '#0a0a0a';
            e.currentTarget.style.boxShadow = '0 0 30px #00ff41';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#00ff41';
            e.currentTarget.style.boxShadow = '0 0 15px #00ff4133';
          }}
        >
          Đăng nhập
        </button>

        <img
          src="/1.png"
          alt="An Nam PC AI"
          style={{
            maxWidth: '70%',
            maxHeight: '55%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 30px #00ff4166)'
          }}
        />

        {/* Auth Popup */}
        {showAuth && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowAuth(false)}
          >
            <div
              style={{
                background: '#0d0d0d',
                padding: 40,
                borderRadius: 16,
                border: '1px solid #00ff41',
                boxShadow: '0 0 60px #00ff4133',
                width: 420,
                maxWidth: '90%',
                maxHeight: '90%',
                overflow: 'auto'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <img src="/2.png" alt="Logo" style={{ height: 50, marginBottom: 10 }} />
                <h2 style={{ color: '#00ff41', textShadow: '0 0 20px #00ff4166' }}>
                  {isLogin ? 'Đăng nhập' : 'Đăng ký'}
                </h2>
              </div>

              <form onSubmit={isLogin ? handleLogin : handleRegister}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: 12,
                    marginBottom: 12,
                    background: '#1a1a1a',
                    border: '1px solid #00ff4133',
                    color: '#00ff41',
                    borderRadius: 8,
                    fontSize: 15
                  }}
                />
                <input
                  type="password"
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: 12,
                    marginBottom: 12,
                    background: '#1a1a1a',
                    border: '1px solid #00ff4133',
                    color: '#00ff41',
                    borderRadius: 8,
                    fontSize: 15
                  }}
                />
                {!isLogin && (
                  <input
                    type="password"
                    placeholder="Xác nhận mật khẩu"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: 12,
                      marginBottom: 12,
                      background: '#1a1a1a',
                      border: '1px solid #00ff4133',
                      color: '#00ff41',
                      borderRadius: 8,
                      fontSize: 15
                    }}
                  />
                )}
                {authError && (
                  <p style={{ color: '#ff4444', marginBottom: 12, fontSize: 14 }}>{authError}</p>
                )}
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: 12,
                    background: '#00ff41',
                    color: '#0a0a0a',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 'bold',
                    fontSize: 16,
                    boxShadow: '0 0 20px #00ff4166',
                    transition: 'all 0.3s'
                  }}
                >
                  {isLogin ? 'Đăng nhập' : 'Đăng ký'}
                </button>
              </form>

              <button
                onClick={handleGoogle}
                style={{
                  width: '100%',
                  padding: 12,
                  marginTop: 10,
                  background: '#1a1a1a',
                  color: '#00ff41',
                  border: '1px solid #00ff41',
                  borderRadius: 8,
                  fontSize: 15,
                  transition: 'all 0.3s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#00ff4122';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#1a1a1a';
                }}
              >
                🚀 Đăng nhập với Google
              </button>

              <p style={{ textAlign: 'center', marginTop: 15, color: '#888' }}>
                {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                <span
                  onClick={() => { setIsLogin(!isLogin); setAuthError(''); }}
                  style={{ color: '#00ff41', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {isLogin ? 'Đăng ký' : 'Đăng nhập'}
                </span>
              </p>

              <button
                onClick={() => setShowAuth(false)}
                style={{
                  width: '100%',
                  marginTop: 10,
                  background: 'transparent',
                  border: 'none',
                  color: '#555',
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                ✕ Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== ĐÃ ĐĂNG NHẬP =====
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0a' }}>
      {/* SIDEBAR */}
      <div style={{
        width: 280,
        background: '#0d0d0d',
        borderRight: '1px solid #00ff4133',
        display: 'flex',
        flexDirection: 'column',
        padding: 20,
        flexShrink: 0,
        overflow: 'hidden'
      }}>
        {/* Header Sidebar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          paddingBottom: 15,
          borderBottom: '1px solid #00ff4133'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/2.png" alt="Logo" style={{ height: 30 }} />
            <span style={{ fontSize: 16, fontWeight: 'bold', color: '#00ff41', textShadow: '0 0 10px #00ff4166' }}>
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
              borderRadius: 20,
              fontWeight: 'bold',
              boxShadow: '0 0 15px #00ff4166',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 30px #00ff41'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 15px #00ff4166'}
          >
            + Mới
          </button>
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ color: '#555', textAlign: 'center', marginTop: 30, fontSize: 14 }}>
              Chưa có chat nào
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => {
                  setCurrentChatId(conv.id);
                  setMessages(conv.messages || []);
                }}
                style={{
                  padding: '10px 12px',
                  marginBottom: 6,
                  background: currentChatId === conv.id ? '#1a2a1a' : '#1a1a1a',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: currentChatId === conv.id ? '1px solid #00ff41' : '1px solid transparent',
                  transition: 'all 0.3s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 180
                }}>
                  {conv.title || 'Chat mới'}
                </span>
                <span
                  onClick={(e) => { e.stopPropagation(); deleteChat(conv.id); }}
                  style={{
                    color: '#ff4444',
                    cursor: 'pointer',
                    fontSize: 14,
                    opacity: 0.5,
                    transition: 'opacity 0.3s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                >
                  ✕
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer Sidebar */}
        <div style={{ paddingTop: 15, borderTop: '1px solid #00ff4133' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#00ff4133',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 'bold',
              color: '#00ff41'
            }}>
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: 13, color: '#aaa', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </span>
          </div>
          <button
            onClick={() => signOut(auth)}
            style={{
              width: '100%',
              padding: 10,
              background: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: 20,
              fontWeight: 'bold',
              boxShadow: '0 0 15px #ff444466',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 0 30px #ff4444';
              e.currentTarget.style.background = '#cc0000';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 0 15px #ff444466';
              e.currentTarget.style.background = '#ff4444';
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header Chat */}
        <div style={{
          padding: '12px 30px',
          background: '#0d0d0d',
          borderBottom: '1px solid #00ff4133',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/1.png" alt="Logo" style={{ height: 35 }} />
            <h2 style={{ fontSize: 20, textShadow: '0 0 10px #00ff4166' }}>
              An Nam PC AI
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(MODELS).map(([key, info]) => {
              const usageKey = key === 'llama-3.3-70b-versatile' ? 'pro' : 'dev';
              const used = usage[usageKey] || 0;
              const isActive = selectedModel === key;
              const isDisabled = info.limit !== Infinity && used >= info.limit;

              return (
                <button
                  key={key}
                  onClick={() => {
                    if (isDisabled) {
                      alert(`Hết lượt ${info.label} hôm nay!`);
                      return;
                    }
                    setSelectedModel(key);
                  }}
                  style={{
                    padding: '6px 14px',
                    background: isActive ? '#00ff41' : '#1a1a1a',
                    color: isActive ? '#0a0a0a' : '#00ff41',
                    border: isActive ? 'none' : '1px solid #00ff4133',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: isActive ? 'bold' : 'normal',
                    boxShadow: isActive ? '0 0 20px #00ff4166' : 'none',
                    opacity: isDisabled ? 0.4 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {info.emoji} {info.label}
                  {info.limit !== Infinity && (
                    <span style={{
                      marginLeft: 4,
                      fontSize: 10,
                      background: isActive ? '#0a0a0a' : '#2a2a2a',
                      padding: '1px 6px',
                      borderRadius: 10
                    }}>
                      {used}/{info.limit}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          {messages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#555',
              marginTop: 50,
              fontSize: 18
            }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>💬</div>
              <div>Bắt đầu cuộc trò chuyện với An Nam PC AI</div>
              <div style={{ fontSize: 14, marginTop: 10, color: '#444' }}>
                Chọn model phù hợp với nhu cầu của bạn
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className="fade-in"
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: msg.role === 'user' ? '#00ff4122' : '#1a1a1a',
                  padding: '12px 18px',
                  borderRadius: 16,
                  border: msg.role === 'user' ? '1px solid #00ff4166' : '1px solid #333',
                  boxShadow: msg.role === 'user' ? '0 0 15px #00ff4133' : 'none'
                }}
              >
                <div style={{
                  fontSize: 12,
                  color: '#00ff41',
                  marginBottom: 4,
                  opacity: 0.7,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  {msg.role === 'user' ? '🧑 Bạn' : '🤖 An Nam AI'}
                </div>
                <div style={{ color: '#eee', lineHeight: 1.6 }}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))
          )}
          {loadingAI && (
            <div style={{ alignSelf: 'flex-start', color: '#00ff41', padding: 10 }}>
              <span>⏳ Đang suy nghĩ</span>
              <span style={{
                display: 'inline-block',
                animation: 'typing 1.5s ease-in-out infinite'
              }}>...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '20px 30px',
          borderTop: '1px solid #00ff4133',
          background: '#0d0d0d',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            gap: 12,
            background: '#1a1a1a',
            borderRadius: 30,
            padding: '4px 4px 4px 20px',
            border: '1px solid #00ff4166',
            boxShadow: '0 0 30px #00ff4122',
            transition: 'all 0.3s'
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 50px #00ff4133'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 30px #00ff4122'}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#00ff41',
                fontSize: 16,
                padding: '12px 0',
                outline: 'none'
              }}
              disabled={loadingAI}
            />
            <button
