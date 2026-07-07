'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '@/lib/types';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  disabled: boolean;
  isSpeaking: boolean;
  ttsReady: boolean;
}

export default function ChatBox({
  messages,
  onSendMessage,
  disabled,
  isSpeaking,
  ttsReady,
}: ChatBoxProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || disabled || isSpeaking) return;

    onSendMessage(trimmed);
    setInputValue('');
    inputRef.current?.focus();
  }, [inputValue, disabled, isSpeaking, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getDisabledReason = (): string | null => {
    if (!ttsReady) return 'Voice engine loading...';
    if (isSpeaking) return 'Avatar is speaking...';
    if (disabled) return 'Processing...';
    return null;
  };

  const disabledReason = getDisabledReason();
  const isInputDisabled = !!disabledReason;

  return (
    <div className="chatbox">
      <div className="chatbox-header">
        <div className="chatbox-header-dot" />
        <span className="chatbox-header-title">Chat</span>
        {isSpeaking && (
          <span className="chatbox-speaking-indicator">
            <span className="chatbox-speaking-dot" />
            Speaking
          </span>
        )}
      </div>

      <div className="chatbox-messages">
        {messages.length === 0 && (
          <div className="chatbox-empty">
            <p>👋 Say hello to your AI avatar!</p>
            <p className="chatbox-empty-sub">
              Type a message below and the avatar will respond with voice and lip-sync.
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chatbox-message chatbox-message-${msg.role}`}
          >
            <div className="chatbox-message-avatar">
              {msg.role === 'user' ? '👤' : msg.role === 'error' ? '⚠️' : '🤖'}
            </div>
            <div className="chatbox-message-content">
              <span className="chatbox-message-role">
                {msg.role === 'user' ? 'You' : msg.role === 'error' ? 'Error' : 'AI'}
              </span>
              <p className="chatbox-message-text">{msg.content}</p>
            </div>
          </div>
        ))}

        {disabled && !isSpeaking && messages[messages.length - 1]?.role === 'user' && (
          <div className="chatbox-message chatbox-message-assistant">
            <div className="chatbox-message-avatar">🤖</div>
            <div className="chatbox-message-content">
              <span className="chatbox-message-role">AI</span>
              <div className="chatbox-thinking">
                <span className="chatbox-thinking-dot" />
                <span className="chatbox-thinking-dot" />
                <span className="chatbox-thinking-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chatbox-input-area">
        {disabledReason && (
          <div className="chatbox-disabled-hint">{disabledReason}</div>
        )}
        <div className="chatbox-input-row">
          <input
            ref={inputRef}
            type="text"
            className="chatbox-input"
            placeholder={isInputDisabled ? disabledReason! : 'Type your message...'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isInputDisabled}
            autoFocus
          />
          <button
            className="chatbox-send-btn"
            onClick={handleSend}
            disabled={isInputDisabled || !inputValue.trim()}
            title="Send message"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
