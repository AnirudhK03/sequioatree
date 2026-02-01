"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MetricCardData } from "./MetricCard";
import { useNotes } from "./NotesContext";

const MAX_SELECTION_CHARS = 240;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function ExpandedCard({
  card,
  onClose,
}: {
  card: MetricCardData | null;
  onClose: () => void;
}) {
  const { addAnnotation, openForAnnotation } = useNotes();
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [selection, setSelection] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const cardMeta = useMemo(() => {
    if (!card) return null;
    return { cardId: card.id, cardLabel: card.label, cardValue: card.value };
  }, [card]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    const sel = window.getSelection();
    try {
      sel?.removeAllRanges();
    } catch {
      // ignore
    }
  }, []);

  const updateSelection = useCallback(() => {
    const root = contentRef.current;
    if (!root) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setSelection(null);
      return;
    }

    const rawText = sel.toString();
    const trimmed = rawText.trim();
    if (!trimmed) {
      setSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    if (!root.contains(ancestor)) {
      setSelection(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setSelection(null);
      return;
    }

    const safeText =
      trimmed.length > MAX_SELECTION_CHARS
        ? `${trimmed.slice(0, MAX_SELECTION_CHARS)}…`
        : trimmed;

    const x = clamp(rect.left + rect.width / 2, 12, window.innerWidth - 12);
    const y = clamp(rect.top, 12, window.innerHeight - 12);

    setSelection({ text: safeText, x, y });
  }, []);

  const annotate = useCallback(() => {
    if (!cardMeta || !selection?.text) return;
    const id = addAnnotation({
      cardId: cardMeta.cardId,
      cardLabel: cardMeta.cardLabel,
      cardValue: cardMeta.cardValue,
      selectedText: selection.text,
    });
    openForAnnotation(id);
    clearSelection();
  }, [addAnnotation, cardMeta, clearSelection, openForAnnotation, selection?.text]);

  useEffect(() => {
    if (!card) {
      setSelection(null);
      return;
    }
    // If user scrolls while selecting, just hide the popover.
    const onScroll = () => setSelection(null);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [card]);

  return (
    <AnimatePresence>
      {card && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
            <motion.div
              layoutId={`card-${card.id}`}
              className="rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: card.color, color: card.textColor || "#171717" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                ref={contentRef}
                className="p-8"
                onMouseUp={updateSelection}
                onKeyUp={updateSelection}
              >
                <AnimatePresence>
                  {selection && (
                    <motion.div
                      className="fixed z-[80]"
                      style={{ left: selection.x, top: selection.y }}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: -12 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className="-translate-x-1/2 -translate-y-full"
                        style={{ pointerEvents: "auto" }}
                      >
                        <div className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/95 backdrop-blur px-2 py-1 shadow-sm">
                          <button
                            type="button"
                            onClick={annotate}
                            className="text-xs px-2.5 py-1 rounded-lg bg-black text-white hover:bg-black/90 transition-colors"
                          >
                            Annotate
                          </button>
                          <button
                            type="button"
                            onClick={clearSelection}
                            className="text-xs px-2.5 py-1 rounded-lg border border-black/10 hover:bg-black/5 transition-colors"
                            aria-label="Dismiss annotation prompt"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-mono px-3 py-1 rounded-full border border-current/20 bg-white/30">
                    {card.label}
                  </span>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 1l12 12M13 1L1 13" />
                    </svg>
                  </button>
                </div>

                <h2 className="text-4xl font-bold tracking-tight mb-2">
                  {card.value}
                </h2>
                <h3 className="text-xl font-semibold mb-4">
                  {card.detail.title}
                </h3>

                <motion.p
                  className="text-sm leading-relaxed opacity-80 mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {card.detail.summary}
                </motion.p>

                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {card.detail.points.map((point, i) => (
                    <motion.div
                      key={i}
                      className="flex items-start gap-3 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.05 }}
                    >
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                      <span>{point}</span>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.p
                  className="text-xs opacity-50 mt-8 font-mono"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.5 }}
                >
                  Source: {card.detail.source}
                </motion.p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
