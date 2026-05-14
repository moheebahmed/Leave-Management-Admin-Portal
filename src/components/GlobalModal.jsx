import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const GlobalModalContext = createContext(null);

export const useGlobalModal = () => {
  const ctx = useContext(GlobalModalContext);
  if (!ctx) {
    throw new Error("useGlobalModal must be used within <GlobalModalProvider />");
  }
  return ctx;
};

export const GlobalModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(null);
  const [onClose, setOnClose] = useState(null);

  const close = useCallback(() => {
    try {
      onClose?.();
    } finally {
      setOnClose(null);
      setIsOpen(false);
      setContent(null);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
  }, [onClose]);

  const open = useCallback((node, options) => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    setContent(node ?? null);
    setOnClose(() => options?.onClose ?? null);
    setIsOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
    }),
    [isOpen, open, close],
  );

  return (
    <GlobalModalContext.Provider value={value}>
      {children}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={close}
            role="dialog"
            aria-modal="true"
          >
            <div onClick={(e) => e.stopPropagation()}>{content}</div>
          </div>,
          document.body,
        )}
    </GlobalModalContext.Provider>
  );
};

