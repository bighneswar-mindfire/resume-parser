import { useEffect } from 'react';

interface ErrorAlertProps {
  messages: string[];
  onDismiss: (index: number) => void;
  autoDismissMs?: number;
}

export default function ErrorAlert({ messages, onDismiss, autoDismissMs = 5000 }: ErrorAlertProps) {
  useEffect(() => {
    if (messages.length === 0) return;
    const timers = messages.map((_, index) => setTimeout(() => onDismiss(index), autoDismissMs));
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col space-y-3 max-w-sm">
      {messages.map((message, index) => (
        <div
          key={index}
          role="alert"
          className="flex items-start justify-between gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg shadow-lg animate-slide-in"
        >
          <div className="flex items-start gap-2">
            <span className="text-lg leading-none">⚠️</span>
            <div className="text-sm font-medium">{message}</div>
          </div>
          <button
            onClick={() => onDismiss(index)}
            className="text-red-500 hover:text-red-700 transition-colors font-bold text-sm leading-none"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
