import { useLanguage } from "../../context/LanguageContext";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { CheckCircle, Info, WarningCircle, X } from "@phosphor-icons/react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [items, setItems] = useState([]);
  const dismiss = useCallback(
    (id) => setItems((current) => current.filter((item) => item.id !== id)),
    [],
  );
  const push = useCallback(
    (message, tone = "info") => {
      const id = crypto.randomUUID();
      setItems((current) => [...current.slice(-3), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );
  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-stack" role="region" aria-live="polite">
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const Icon =
                item.tone === "success"
                  ? CheckCircle
                  : item.tone === "error"
                    ? WarningCircle
                    : Info;
              return (
                <m.div
                  className={`toast toast--${item.tone}`}
                  key={item.id}
                  initial={{ opacity: 0, y: reducedMotion ? 0 : 14, scale: reducedMotion ? 1 : 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: reducedMotion ? 0 : 20, scale: reducedMotion ? 1 : 0.98 }}
                  transition={{ duration: reducedMotion ? 0.01 : 0.22, ease: "easeOut" }}
                >
                  <Icon size={21} weight="bold" />
                  <span>{t(item.message)}</span>
                  <button
                    type="button"
                    onClick={() => dismiss(item.id)}
                    aria-label={t("Close")}
                  >
                    <X size={16} weight="bold" />
                  </button>
                </m.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("ToastProvider is missing.");
  return value;
}
