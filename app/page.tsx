'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ChatBox from '@/components/ChatBox';
import LoadingOverlay from '@/components/LoadingOverlay';
import { ChatMessage } from '@/lib/types';

// Dynamic import Avatar to prevent SSR issues with Three.js/WebGL
const Avatar = dynamic(() => import('@/components/Avatar'), {
  ssr: false,
  loading: () => (
    <div className="avatar-container avatar-ssr-loading">
      <div className="avatar-loading">
        <div className="avatar-loading-spinner" />
        <p>Loading 3D engine...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAvatarReady, setIsAvatarReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avatarRef = useRef<any>(null);

  const handleSendMessage = useCallback(
    async (message: string) => {
      // IMPORTANT: Unlock AudioContext at the start of a user gesture
      if (avatarRef.current?.unlockAudio) {
        await avatarRef.current.unlockAudio();
      }

      // Add user message
      const userMsg: ChatMessage = { role: 'user', content: message };
      setMessages((prev) => [...prev, userMsg]);
      setIsProcessing(true);

      try {
        // Build history for the API (last 10 messages)
        const history = messages.slice(-10).map((m) => ({
          role: m.role === 'error' ? 'assistant' : m.role,
          content: m.content,
        }));

        // Call the chat API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, history }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Request failed with status ${response.status}`
          );
        }

        const data = await response.json();
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: data.response,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setIsProcessing(false);

        // Trigger avatar speech using HeadTTS + TalkingHead
        if (avatarRef.current && isAvatarReady) {
          try {
            await avatarRef.current.speakText(data.response);
          } catch (err: unknown) {
            console.error('[Page] Avatar speech failed:', err);
          }
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred';
        setMessages((prev) => [
          ...prev,
          { role: 'error', content: errorMessage },
        ]);
        setIsProcessing(false);
      }
    },
    [messages, isAvatarReady]
  );

  return (
    <main className="app-main">
      {/* Simple loading overlay while avatar 3D model loads */}
      {!isAvatarReady && (
        <LoadingOverlay
          progress={0}
          visible={true}
          message="Loading 3D avatar..."
        />
      )}

      <div className="app-layout">
        <div className="app-avatar-panel">
          <Avatar
            ref={avatarRef}
            onSpeakingChange={setIsSpeaking}
            onStatusChange={(status) => {
              if (status === 'ready') setIsAvatarReady(true);
            }}
          />
        </div>

        <div className="app-chat-panel">
          <ChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            disabled={isProcessing}
            isSpeaking={isSpeaking}
            ttsReady={isAvatarReady}
          />
        </div>
      </div>
    </main>
  );
}
