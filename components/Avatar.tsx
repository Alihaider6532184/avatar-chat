'use client';

import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
} from 'react';
import { initTalkingHead, loadAvatar, speakWithAudio, getTalkingHead } from '@/lib/talkinghead';
import { synthesizeSpeech, getHeadTTS, initHeadTTS } from '@/lib/headtts';
import { AvatarStatus } from '@/lib/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AvatarHandle {
  speakText: (text: string) => Promise<void>;
  unlockAudio: () => Promise<void>;
}

interface AvatarProps {
  onStatusChange?: (status: AvatarStatus) => void;
  onSpeakingChange?: (speaking: boolean) => void;
  avatarUrl?: string;
}

const DEFAULT_AVATAR_URL =
  'https://met4citizen.github.io/TalkingHead/avatars/brunette.glb';

const Avatar = forwardRef<AvatarHandle, AvatarProps>(
  ({ onStatusChange, onSpeakingChange, avatarUrl }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<AvatarStatus>('loading');
    const [error, setError] = useState<string | null>(null);
    const speakingRef = useRef(false);
    const initRef = useRef(false);
    const audioUnlockedRef = useRef(false);

    const updateStatus = useCallback(
      (newStatus: AvatarStatus) => {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      },
      [onStatusChange]
    );

    const unlockAudio = useCallback(async () => {
      if (audioUnlockedRef.current) return;
      try {
        const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        await tempCtx.resume();
        await tempCtx.close();

        const th = getTalkingHead();
        if (th?.audioCtx?.state === 'suspended') {
          await th.audioCtx.resume();
        }

        audioUnlockedRef.current = true;
        console.log('[Avatar] AudioContext unlocked');
      } catch (e) {
        console.error('[Avatar] Failed to unlock AudioContext:', e);
      }
    }, []);

    useEffect(() => {
      if (initRef.current || !containerRef.current) return;
      initRef.current = true;

      const init = async () => {
        try {
          updateStatus('loading');
          await initTalkingHead(containerRef.current!);
          const url = avatarUrl || DEFAULT_AVATAR_URL;
          await loadAvatar(url);
          
          // Pre-initialize HeadTTS so the model starts downloading
          await initHeadTTS();

          updateStatus('ready');
          console.log('[Avatar] Ready');
        } catch (err: any) {
          const msg = err?.message || 'Failed to load avatar';
          console.error('[Avatar] Init error:', msg);
          setError(msg);
          updateStatus('error');
        }
      };

      init();
    }, [avatarUrl, updateStatus]);

    useImperativeHandle(ref, () => ({
      unlockAudio,
      speakText: async (text: string) => {
        if (speakingRef.current) {
          console.warn('[Avatar] Already speaking, skipping');
          return;
        }

        await unlockAudio();
        speakingRef.current = true;
        onSpeakingChange?.(true);

        try {
          console.log('[Avatar] Synthesizing speech for:', text.substring(0, 50));
          await synthesizeSpeech(
            text,
            (audioData: any) => {
              console.log('[Avatar] Received audio block from HeadTTS');
              speakWithAudio(audioData, (word: string) => {
                console.log('[Avatar] Word:', word);
              });
            }
          );
        } catch (err: any) {
          console.error('[Avatar] Speech error:', err?.message);
        } finally {
          speakingRef.current = false;
          onSpeakingChange?.(false);
        }
      },
    }));

    if (status === 'error') {
      return (
        <div className="avatar-container avatar-error">
          <div className="avatar-error-content">
            <div className="avatar-error-icon">⚠️</div>
            <h3>Avatar Failed to Load</h3>
            <p>{error || 'An unknown error occurred while loading the 3D avatar.'}</p>
            <button
              onClick={() => {
                initRef.current = false;
                setError(null);
                updateStatus('loading');
                window.location.reload();
              }}
              className="avatar-retry-btn"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="avatar-container">
        {status === 'loading' && (
          <div className="avatar-loading">
            <div className="avatar-loading-spinner" />
            <p>Loading 3D avatar...</p>
          </div>
        )}
        <div
          ref={containerRef}
          className="avatar-canvas"
          style={{
            width: '100%',
            height: '100%',
            opacity: status === 'ready' ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        />
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar;
