import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Message = ({ msg, theme }) => {
  const isUser = msg.role === 'user';

  const getBgColor = () => {
    if (isUser) {
      if (theme === 'stars') return 'rgba(255,107,255,0.08)';
      if (theme === 'light') return 'rgba(0,0,0,0.05)';
      return 'rgba(0,255,65,0.06)';
    }
    return 'var(--bg-card)';
  };

  const getBorderColor = () => {
    if (isUser) {
      if (theme === 'stars') return 'rgba(255,107,255,0.2)';
      if (theme === 'light') return 'rgba(0,0,0,0.1)';
      return 'rgba(0,255,65,0.15)';
    }
    return 'var(--border-color)';
  };

  return (
    <div
      className="fade-in-up"
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        background: getBgColor(),
        padding: '14px 20px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        border: `1px solid ${getBorderColor()}`,
        marginBottom: '12px'
      }}
    >
      <div style={{
        fontSize: '12px',
        color: isUser ? 'var(--text-primary)' : 'var(--text-muted)',
        marginBottom: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>{isUser ? ' Bạn' : ' An Nam AI'}</span>
        {msg.files && msg.files.length > 0 && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            📎 {msg.files.map(f => f.name).join(', ')}
          </span>
        )}
      </div>
      <div style={{
        color: 'var(--text-primary)',
        lineHeight: '1.7',
        fontSize: '15px',
        wordBreak: 'break-word'
      }}>
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {msg.content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default Message;
