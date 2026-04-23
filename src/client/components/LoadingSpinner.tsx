import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="loading-spinner-wrap">
      <div className="loading-spinner" aria-label="Loading..." role="status">
        <span className="spinner-symbol">✦</span>
      </div>
      <style>{`
        .loading-spinner-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 40vh;
        }
        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .spinner-symbol {
          font-size: 2.5rem;
          color: var(--accent);
          animation: spinPulse 1.5s ease-in-out infinite;
          display: block;
        }
        @keyframes spinPulse {
          0% { transform: rotate(0deg) scale(1); opacity: 1; }
          50% { transform: rotate(180deg) scale(1.2); opacity: 0.6; }
          100% { transform: rotate(360deg) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
