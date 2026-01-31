"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MetricCardData } from "./MetricCard";

export default function ExpandedCard({
  card,
  onClose,
}: {
  card: MetricCardData | null;
  onClose: () => void;
}) {
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
              <div className="p-8">
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
