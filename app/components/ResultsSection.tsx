"use client";

import { motion } from "framer-motion";
import MetricCard from "./MetricCard";
import { MetricCardData } from "./MetricCard";

interface ResultsSectionProps {
  aiText: string;
  typingDone: boolean;
  marketCards: MetricCardData[];
  ideaCards: MetricCardData[];
  onCardClick: (card: MetricCardData) => void;
}

export default function ResultsSection({
  aiText,
  typingDone,
  marketCards,
  ideaCards,
  onCardClick,
}: ResultsSectionProps) {
  return (
    <motion.section
      className="relative z-10 px-6 md:px-12 lg:px-20 pb-32"
      style={{ backgroundColor: "#FAF5EE" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.6 }}
    >
      {/* AI Response */}
      <motion.div
        className="max-w-4xl mx-auto pt-4 pb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="6" cy="6" r="2" />
              <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>
          <p className="text-sm leading-relaxed text-gray-700 max-w-2xl">
            {aiText}
            {!typingDone && (
              <motion.span
                className="inline-block w-0.5 h-4 bg-gray-700 ml-0.5 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </p>
        </div>
      </motion.div>

      {/* Cards Grid */}
      {typingDone && (
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Validate Market */}
            <div>
              <motion.h2
                className="text-2xl font-bold text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Validate Market
              </motion.h2>
              <div className="grid grid-cols-2 gap-4 auto-rows-[13rem]">
                {marketCards.map((card, i) => {
                  const spanClass: Record<string, string> = {
                    "cost-per-hire": "col-span-1 row-span-1",
                    "team-image": "col-span-1 row-span-2",
                    "testimonial-sarah": "col-span-1 row-span-2",
                    "response-rate": "col-span-2 row-span-1",
                  };
                  return (
                    <div key={card.id} className={spanClass[card.id] || "col-span-1"}>
                      <div className="h-full">
                        <MetricCard
                          card={card}
                          index={i}
                          onClick={() => onCardClick(card)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Validate Idea */}
            <div>
              <motion.h2
                className="text-2xl font-bold text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Validate Idea
              </motion.h2>
              <div className="grid grid-cols-1 gap-4 auto-rows-[13rem]">
                {ideaCards.map((card, i) => (
                  <div key={card.id}>
                    <div className="h-full">
                      <MetricCard
                        card={card}
                        index={i}
                        onClick={() => onCardClick(card)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}