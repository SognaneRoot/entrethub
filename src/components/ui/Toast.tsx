'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, type?: ToastType, duration?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertCircle,
  info:    Info,
};

const COLORS: Record<ToastType, { border: string; icon: string; bg: string }> = {
  success: { border: 'var(--teal)',  icon: 'var(--teal)',  bg: 'rgba(0,212,177,0.08)'   },
  error:   { border: '#F87171',      icon: '#F87171',      bg: 'rgba(248,113,113,0.08)' },
  warning: { border: '#FBBF24',      icon: '#FBBF24',      bg: 'rgba(251,191,36,0.08)'  },
  info:    { border: '#60A5FA',      icon: '#60A5FA',      bg: 'rgba(96,165,250,0.08)'  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon   = ICONS[toast.type];
  const colors = COLORS[toast.type];

  useEffect(() => {
    const t = setTimeout(onDismiss, toast.duration ?? 4000);
    return () => clearTimeout(t);
  }, [toast.duration, onDismiss]);

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl pointer-events-auto max-w-sm w-full animate-fade-up"
      style={{
        backgroundColor: 'var(--surface)',
        border: `1px solid ${colors.border}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.3)`,
      }}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: colors.icon }} />
      <p className="text-sm text-app flex-1 leading-snug">{toast.message}</p>
      <button onClick={onDismiss} className="text-app-muted hover:text-app transition-colors shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
