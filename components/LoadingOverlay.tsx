'use client';

import React from 'react';

interface LoadingOverlayProps {
  progress: number;
  message?: string;
  visible: boolean;
}

export default function LoadingOverlay({
  progress,
  message,
  visible,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-overlay-content">
        <div className="loading-logo">
          <div className="loading-logo-ring" />
          <div className="loading-logo-ring loading-logo-ring-2" />
          <div className="loading-logo-ring loading-logo-ring-3" />
          <span className="loading-logo-text">AI</span>
        </div>

        <h2 className="loading-title">Initializing Voice Engine</h2>
        <p className="loading-subtitle">
          {message || 'Loading the Kokoro neural voice model... this may take a moment on first visit.'}
        </p>

        <div className="loading-progress-track">
          <div
            className="loading-progress-bar"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span className="loading-progress-text">
          {progress > 0 ? `${Math.round(progress)}%` : 'Connecting...'}
        </span>
      </div>
    </div>
  );
}
