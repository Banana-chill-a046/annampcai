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
  processFiles,
  user,
  setShowAuth,
  onSettingsClick,
  theme,
  getRemainingUsage
}) => {
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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
    const remaining = getRemainingUsage(selectedModel);
    if (remaining === '♾️') return '♾️ Không giới hạn';
    return `Còn ${remaining} lượt`;
  };

  const themeStyles = {
    matrix: { borderColor: 'rgba(0,255,65,0.3)', shadowColor: 'rgba(0,255,65,0.1)' },
    light: { borderColor: 'rgba(0,0,0,0.2)', shadowColor: 'rgba(0,0,0,0.05)' },
    dark: { borderColor: 'rgba(255,255,255,0.15)', shadowColor: 'rgba(0,0,0,0.3)' },
    stars: { borderColor: 'rgba(255,107,255,0.3)', shadowColor: 'rgba(255,107,255,0.1)' }
  };

  const currentTheme = themeStyles[theme] || themeStyles.matrix;

  return (
    <div
      style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ===== HEADER ===== */}
      <div style={{
        padding: '12px 24px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
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
            color: 'var(--text-primary)'
          }}>
            An Nam AI
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {Object.entries(MODELS).map(([key, model]) => {
            const isActive = selectedModel === key;
            const isBasic = model.limit === Infinity;
            const usageKey = key === 'llama-3.1-8b-instant' ? 'basic' :
                            key === 'llama-3.3-70b-versatile' ? 'pro' : 'premium';
            const used = usage[usageKey] || 0;
            const isDisabled = !isBasic && used >= model.limit;

            return (
              <button
                key={key}
                onClick={() => {
                  if (isDisabled) {
                    toast.error(`❌ Hết ${model.limit} lượt ${model.label} hôm nay!`);
                    return;
                  }
                  setSelectedModel(key);
                }}
                style={{
                  padding: '6px 14px',
                  background: isActive ? 'var(--text-primary)' : 'var(--input-bg)',
                  color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  border: isActive ? 'none' : '1px solid var(--border-color)',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: isActive ? 'bold' : 'normal',
                  boxShadow: isActive ? `0 0 25px var(--shadow-color)` : 'none',
                  opacity: isDisabled ? 0.4 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {model.emoji} {model.label}
                {!isBasic && (
                  <span style={{
                    marginLeft: '4px',
                    fontSize: '10px',
                    background: isActive ? 'var(--bg-secondary)' : '#2a2a2a',
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}>
                    {used}/{model.limit}
                  </span>
                )}
                {isBasic && (
                  <span style={{
                    marginLeft: '4px',
                    fontSize: '10px',
                    background: isActive ? 'var(--bg-secondary)' : '#2a2a2a',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    color: '#00ff41'
                  }}>
                    ♾️
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={onSettingsClick}
            style={{
              padding: '8px 12px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            ⚙️
          </button>

          {!user && (
            <button
              onClick={() => setShowAuth(true)}
              style={{
                padding: '6px 16px',
                background: 'var(--text-primary)',
                color: 'var(--bg-primary)',
                border: 'none',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: `0 0 20px var(--shadow-color)`
              }}
            >
              🔑 Đăng nhập
            </button>
          )}
        </div>
      </div>

      {/* ===== MESSAGES ===== */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          background: isDragging ? 'var(--hover-bg)' : 'transparent',
          border: isDragging ? `2px dashed var(--text-primary)` : 'none',
          transition: 'all 0.3s'
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            marginTop: '80px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
            <div style={{
              fontSize: '22px',
              color: 'var(--text-primary)',
              textShadow: `0 0 30px var(--shadow-color)`
            }}>
              An Nam AI
            </div>
            <div style={{ fontSize: '14px', marginTop: '12px', color: 'var(--text-muted)' }}>
              📸 Ảnh • 📄 Tài liệu • 💻 Code
            </div>
            <div style={{ fontSize: '13px', marginTop: '8px', color: 'var(--text-muted)' }}>
              {MODELS[selectedModel].description}
            </div>
            <div style={{ fontSize: '12px', marginTop: '16px', color: 'var(--text-muted)' }}>
              💡 Lượt dùng: {getUsageText()}
            </div>
            {!user && (
              <div style={{ fontSize: '13px', marginTop: '20px' }}>
                <button
                  onClick={() => setShowAuth(true)}
                  style={{
                    padding: '8px 20px',
                    background: 'var(--text-primary)',
                    color: 'var(--bg-primary)',
                    border: 'none',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  🔑 Đăng nhập để lưu lịch sử
                </button>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, idx) => (
            <Message key={idx} msg={msg} theme={theme} />
          ))
        )}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-primary)', padding: '10px' }}>
            ⏳ Đang suy nghĩ
            <span className="typing-dots">...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ===== FILE PREVIEW ===== */}
      {uploadedFiles.length > 0 && (
        <div style={{
          padding: '10px 24px',
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
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
              background: 'var(--input-bg)',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '13px'
            }}>
              <span>{file.type === 'image' ? '🖼️' : '📄'}</span>
              <span style={{
                color: 'var(--text-secondary)',
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
        padding: '16px 24px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          background: 'var(--input-bg)',
          borderRadius: '30px',
          padding: '4px 4px 4px 20px',
          border: `1px solid ${currentTheme.borderColor}`,
          boxShadow: `0 0 30px ${currentTheme.shadowColor}`,
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
              color: 'var(--text-primary)',
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
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
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
              background: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              border: 'none',
              borderRadius: '30px',
              fontWeight: 'bold',
              fontSize: '15px',
              boxShadow: `0 0 25px var(--shadow-color)`,
              opacity: loading || (!input.trim() && uploadedFiles.length === 0) ? 0.5 : 1,
              cursor: loading || (!input.trim() && uploadedFiles.length === 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.boxShadow = `0 0 40px var(--shadow-color)`;
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.boxShadow = `0 0 25px var(--shadow-color)`;
              }
            }}
          >
            {uploadedFiles.length > 0 ? `📤 Gửi (${uploadedFiles.length})` : 'Gửi →'}
          </button>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '8px',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          <span>
            {MODELS[selectedModel].emoji} {MODELS[selectedModel].label}
            {MODELS[selectedModel].limit !== Infinity && ` • ${getUsageText()}`}
            {MODELS[selectedModel].limit === Infinity && ' • ♾️ Không giới hạn'}
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
