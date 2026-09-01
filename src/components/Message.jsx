import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Message = ({ msg }) => {
  const isUser = msg.role === 'user';

  return (
    <div
      className="fade-in-up"
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        background: isUser ? 'rgba(0,255,65,0.06)' : '#1a1a1a',
        padding: '14px 20px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        border: isUser ? '1px solid rgba(0,255,65,0.15)' : '1px solid rgba(255,255,255,0.05)',
        marginBottom: '12px'
      }}
    >
      <div style={{
        fontSize: '12px',
        color: isUser ? '#00ff41' : '#888',
        marginBottom: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>{isUser ? '🧑 Bạn' : '🤖 An Nam AI'}</span>
        {msg.files && msg.files.length > 0 && (
          <span style={{ fontSize: '11px', color: '#555' }}>
            📎 {msg.files.map(f => f.name).join(', ')}
          </span>
        )}
      </div>
      <div style={{ color: '#eee', lineHeight: '1.7', fontSize: '15px', wordBreak: 'break-word' }}>
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>{children}</code>
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
