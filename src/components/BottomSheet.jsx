import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  gestisciFocusTrap,
  trovaElementiFocusabili,
} from "./bottomSheetUtils";

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  altezza = "auto",
  descrizione,
}) {
  const titoloId = useId();
  const descrizioneId = useId();
  const pannelloRef = useRef(null);
  const elementoPrecedenteRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const precedenteOverflow = document.body.style.overflow;
    elementoPrecedenteRef.current = document.activeElement;
    document.body.style.overflow = "hidden";

    const frame = requestAnimationFrame(() => {
      const elementi = trovaElementiFocusabili(pannelloRef.current);
      (elementi[0] || pannelloRef.current)?.focus();
    });

    function gestisciTastiera(evento) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        onClose();
        return;
      }

      gestisciFocusTrap(evento, pannelloRef.current);
    }

    document.addEventListener("keydown", gestisciTastiera);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", gestisciTastiera);
      document.body.style.overflow = precedenteOverflow;

      const precedente = elementoPrecedenteRef.current;
      if (precedente && typeof precedente.focus === "function") {
        precedente.focus();
      }
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center">
          <motion.button
            type="button"
            aria-label="Chiudi finestra"
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            tabIndex={-1}
          />

          <motion.div
            ref={pannelloRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titoloId : undefined}
            aria-describedby={descrizione ? descrizioneId : undefined}
            tabIndex={-1}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-xl bg-[#0d1320] border border-white/10 rounded-t-[24px] shadow-[0_-20px_60px_rgba(0,0,0,0.5)] safe-bottom outline-none"
            style={{ maxHeight: altezza === "auto" ? "88dvh" : altezza }}
          >
            <div
              className="flex justify-center pt-3 pb-1 safe-top"
              aria-hidden="true"
            >
              <span className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {title ? (
              <div className="px-5 pb-3">
                <h2 id={titoloId} className="text-xl font-black">
                  {title}
                </h2>
                {descrizione ? (
                  <p id={descrizioneId} className="text-sm text-slate-400 mt-1">
                    {descrizione}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="px-5 pb-5 overflow-y-auto max-h-[calc(88dvh-5rem)] safe-bottom">
              {children}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
