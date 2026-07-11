import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const ModalContext = createContext(undefined);

function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}

function useOutsideClick(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

function ModalProvider({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <ModalContext.Provider value={{ open, setOpen }}>
      {children}
    </ModalContext.Provider>
  );
}

function Modal({ children }) {
  return <ModalProvider>{children}</ModalProvider>;
}

function ModalTrigger({ children, className }) {
  const { setOpen } = useModal();

  return (
    <button
      className={cn(
        "relative overflow-hidden rounded-md bg-black px-4 py-2 text-white",
        className
      )}
      onClick={() => setOpen(true)}
    >
      {children}
    </button>
  );
}

function Overlay({ onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-black/30"
      onClick={onClick}
    />
  );
}

function CloseIcon({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.5L3.21846 10.9684C2.99391 11.193 2.99391 11.5571 3.21846 11.7816C3.44301 12.0062 3.80708 12.0062 4.03164 11.7816L7.50005 8.31318L10.9685 11.7816C11.193 12.0062 11.5571 12.0062 11.7816 11.7816C12.0062 11.5571 12.0062 11.193 11.7816 10.9684L8.31322 7.5L11.7816 4.03157Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

function ModalBody({ children, className }) {
  const { open, setOpen } = useModal();
  const modalRef = useRef(null);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  useOutsideClick(modalRef, handleClose);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <Overlay onClick={handleClose} />
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "relative z-50 mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-lg",
              className
            )}
          >
            <CloseIcon onClick={handleClose} />
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ModalContent({ children, className }) {
  return <div className={cn("py-4", className)}>{children}</div>;
}

function ModalFooter({ children, className }) {
  return (
    <div className={cn("mt-4 flex items-center justify-end space-x-2", className)}>
      {children}
    </div>
  );
}

export {
  ModalProvider,
  useModal,
  Modal,
  ModalTrigger,
  ModalBody,
  ModalContent,
  ModalFooter,
  Overlay,
  CloseIcon,
  useOutsideClick,
};
