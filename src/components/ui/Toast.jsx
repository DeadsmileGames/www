import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, Info, WarningCircle, X } from '@phosphor-icons/react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const dismiss = useCallback((id) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const push = useCallback((message, tone = 'info') => {
    const id = crypto.randomUUID();
    setItems((current) => [...current.slice(-3), { id, message, tone }]);
    window.setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);
  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-stack" role="region" aria-live="polite">
          {items.map((item) => {
            const Icon = item.tone === 'success' ? CheckCircle : item.tone === 'error' ? WarningCircle : Info;
            return (
              <div className={`toast toast--${item.tone}`} key={item.id}>
                <Icon size={21} weight="bold" />
                <span>{item.message}</span>
                <button type="button" onClick={() => dismiss(item.id)} aria-label="Close"><X size={16} weight="bold" /></button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('ToastProvider is missing.');
  return value;
}
