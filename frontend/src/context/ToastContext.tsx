import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  durationMs?: number;
};

type ToastContextValue = {
  toasts: Toast[];
  show: (toast: Omit<Toast, 'id'>) => string;
  success: (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => string;
  error: (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => string;
  info: (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultDurationMs(type: ToastType) {
  if (type === 'error') return 6000;
  return 3500;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeouts = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timeoutId = timeouts.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeouts.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = makeId();
      const durationMs = toast.durationMs ?? defaultDurationMs(toast.type);

      setToasts((prev) => [{ ...toast, id, durationMs }, ...prev].slice(0, 3));

      if (durationMs > 0) {
        const timeoutId = window.setTimeout(() => dismiss(id), durationMs);
        timeouts.current.set(id, timeoutId);
      }

      return id;
    },
    [dismiss]
  );

  const clear = useCallback(() => {
    timeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeouts.current.clear();
    setToasts([]);
  }, []);

  const success = useCallback<ToastContextValue['success']>(
    (message, options) => show({ type: 'success', message, ...options }),
    [show]
  );
  const error = useCallback<ToastContextValue['error']>(
    (message, options) => show({ type: 'error', message, ...options }),
    [show]
  );
  const info = useCallback<ToastContextValue['info']>(
    (message, options) => show({ type: 'info', message, ...options }),
    [show]
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, show, success, error, info, dismiss, clear }),
    [toasts, show, success, error, info, dismiss, clear]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions removals">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          role={t.type === 'error' ? 'alert' : 'status'}
        >
          <div className="toast-body">
            {t.title ? <div className="toast-title">{t.title}</div> : null}
            <div className="toast-message">{t.message}</div>
          </div>
          <Button
            className="toast-close"
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
          >
            ×
          </Button>
        </div>
      ))}
    </div>
  );
}
