import React, { useRef, useEffect, useState } from 'react';
import Message from './Message';
import toast from 'react-hot-toast';

const ChatArea = ({
  messages,
  selectedModel,
  setSelectedModel,
  usage,
  loading,
  input,
  setInput,
  sendMessage,
  messagesEndRef,
  MODELS,
  uploadedFiles,
  setUploadedFiles,
  processFiles
}) => {
  // ===== REFS =====
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // ===== STATE =====
  const [isDragging, setIsDragging] = useState(false);

  // ===== EFFECTS =====
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ===== HANDLERS =====
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const modelInfo = MODELS[selectedModel];
    const hasDocument = files.some(f => !f.type.startsWith('image/'));
    const hasImage = files.some(f => f.type.startsWith('image/'));

    if (hasDocument && !modelInfo.supportFile) {
      toast.error(`${modelInfo.label} không hỗ trợ tài liệu!`);
      return;
    }

    if (hasImage && !modelInfo.supportImage) {
      toast.error(`${modelInfo.label} không hỗ trợ ảnh!`);
      return;
    }

    await processFiles(files);
    toast.success(`📎 Đã tải lên ${files.length} file!`);
    fileInputRef.current.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const modelInfo = MODELS[selectedModel];
    const hasDocument = files.some(f => !f.type.startsWith('image/'));
    const hasImage = files.some(f => f.type.startsWith('image/'));

    if (hasDocument && !modelInfo.supportFile) {
      toast.error(`${modelInfo.label} không hỗ trợ tài liệu!`);
      return;
    }

    if (hasImage && !modelInfo.supportImage) {
      toast.error(`${modelInfo.label} không hỗ trợ ảnh!`);
      return;
    }

    await processFiles(files);
    toast.success(`📎 Đã tải lên ${files.length} file!`);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getUsageText = () => {
    const key = selectedModel === 'llama-3.1-8b-instant' ? 'basic' :
                selectedModel === 'llama-3.3-70b-versatile' ? 'pro' : 'premium';
    const used = usage[key] || 0;
    const limit = MODELS[selectedModel].limit;
    return limit === Infinity ? '♾️' : `${used}/${limit}`;
  };

  // ===== RENDER =====
  return (
    <div
      style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ===== HEADER ===== */}
      <div style={{
        padding: '12px 30px',
        background: '#0d0d0d',
        borderBottom: '1px solid rgba(0,255,65,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/1.png" alt="Logo" style={{ height: '35px' }} />
          <h2 style={{
            fontSize: '20px',
            textShadow: '0 0 20px rgba(0,255,65,0.1)'
          }}>
            An Nam AI
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(MODELS).map(([key, model]) => {
            const isActive = selectedModel === key;
            const usageKey = key === 'llama-3.1-8b-instant' ? 'basic' :
                            key === 'llama-3.3-70b-versatile' ? 'pro' : 'premium';
            const used = usage[usageKey] || 0;
            const isDisabled = model.limit !== Infinity && used >= model.limit;

            return (
              <button
                key={key}
                onClick={() => {
                  if (isDisabled) {
                    toast.error(`❌ Hết lượt ${model.label} hôm nay!`);
                    return;
                  }
                  setSelectedModel(key);
                }}
                style={{
                  padding: '6px 14px',
                  background: isActive ? '#00ff41' : '#1a1a1a',
                  color: isActive ? '#0a0a0a' : '#00ff41',
                  border: isActive ? 'none' : '1px solid rgba(0,255,65,0.2)',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: isActive ? 'bold' : 'normal',
                  boxShadow: isActive ? '0 0 25px rgba(0,255,65,0.2)' : 'none',
                  opacity: isDisabled ? 0.4 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {model.emoji} {model.label}
                {model.limit !== Infinity && (
                  <span style={{
                    marginLeft: '4px',
                    fontSize: '10px',
                    background: isActive ? '#0a0a0a' : '#2a2a2a',
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}>
                    {used}/{model.limit}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== MESSAGES ===== */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 30px',
          display: 'flex',
          flexDirection: 'column',
          background: isDragging ? 'rgba(0,255,65,0.03)' : 'transparent',
          border: isDragging ? '2px dashed rgba(0,255,65,0.3)' : 'none',
          transition: 'all 0.3s'
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#555',
            marginTop: '100px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
            <div style={{
              fontSize: '22px',
              color: '#00ff41',
              textShadow: '0 0 30px rgba(0,255,65,0.1)'
            }}>
              An Nam AI
            </div>
            <div style={{ fontSize: '14px', marginTop: '12px', color: '#444' }}>
              📸 Ảnh • 📄 Tài liệu • 💻 Code
            </div>
            <div style={{ fontSize: '13px', marginTop: '8px', color: '#333' }}>
              {MODELS[selectedModel].description}
            </div>
            <div style={{ fontSize: '12px', marginTop: '16px', color: '#2a2a2a' }}>
              Kéo thả file vào đây để tải lên
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <Message key={idx} msg={msg} />
          ))
        )}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: '#00ff41', padding: '10px' }}>
            ⏳ Đang suy nghĩ
            <span className="typing-dots">...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ===== FILE PREVIEW ===== */}
      {uploadedFiles.length > 0 && (
        <div style={{
          padding: '10px 30px',
          background: '#0d0d0d',
          borderTop: '1px solid rgba(0,255,65,0.05)',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {uploadedFiles.map((file, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#1a1a1a',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(0,255,65,0.15)',
              fontSize: '13px'
            }}>
              <span>{file.type === 'image' ? '🖼️' : '📄'}</span>
              <span style={{
                color: '#ccc',
                maxWidth: '150px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {file.name}
              </span>
              <span
                onClick={() => removeFile(index)}
                style={{
                  color: '#ff4444',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ✕
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ===== INPUT ===== */}
      <div style={{
        padding: '20px 30px',
        borderTop: '1px solid rgba(0,255,65,0.1)',
        background: '#0d0d0d',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          background: '#1a1a1a',
          borderRadius: '30px',
          padding: '4px 4px 4px 20px',
          border: '1px solid rgba(0,255,65,0.2)',
          boxShadow: '0 0 30px rgba(0,255,65,0.03)',
          transition: 'all 0.3s'
        }}>
          <input
            ref={inputRef}
            type="text"
            placeholder={`${MODELS[selectedModel].emoji} Nhập câu hỏi... (${getUsageText()})`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#00ff41',
              fontSize: '15px',
              padding: '12px 0',
              outline: 'none'
            }}
            disabled={loading}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 12px',
              background: 'transparent',
              color: '#00ff41',
              border: '1px solid rgba(0,255,65,0.15)',
              borderRadius: '20px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,255,65,0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.txt,.py,.js,.json,.csv,.pdf,.doc,.docx,.pptx,.ppt,.xlsx,.xls"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          <button
            onClick={() => sendMessage(input)}
            disabled={loading || (!input.trim() && uploadedFiles.length === 0)}
            style={{
              padding: '12px 24px',
              background: '#00ff41',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '30px',
              fontWeight: 'bold',
              fontSize: '15px',
              boxShadow: '0 0 25px rgba(0,255,65,0.15)',
              opacity: loading || (!input.trim() && uploadedFiles.length === 0) ? 0.5 : 1,
              cursor: loading || (!input.trim() && uploadedFiles.length === 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.boxShadow = '0 0 40px rgba(0,255,65,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.boxShadow = '0 0 25px rgba(0,255,65,0.15)';
              }
            }}
          >
            {uploadedFiles.length > 0 ? `📤 Gửi (${uploadedFiles.length})` : 'Gửi →'}
          </button>
        </div>

        {/* ===== INFO ===== */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '8px',
          fontSize: '11px',
          color: '#444'
        }}>
          <span>
            {MODELS[selectedModel].emoji} {MODELS[selectedModel].label}
            {MODELS[selectedModel].limit !== Infinity && ` • ${getUsageText()}`}
          </span>
          <span>
            {MODELS[selectedModel].supportImage && '📸 '}
            {MODELS[selectedModel].supportFile && '📄 '}
            {!MODELS[selectedModel].supportImage && !MODELS[selectedModel].supportFile && '💬'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
