import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { trapFocus } from "../../utils/dom";

export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  overlayClassName = "",
  panelClassName = "",
  overlayStyle,
  panelStyle,
  backdrop,
}) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    return trapFocus(panelRef.current, () => onCloseRef.current?.());
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className={["modal-overlay", overlayClassName].filter(Boolean).join(" ")}
      style={overlayStyle}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {backdrop}
      <div
        className={["modal-panel", panelClassName].filter(Boolean).join(" ")}
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        ref={panelRef}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
