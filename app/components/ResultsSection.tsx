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

function groupBySubcategory(cards: MetricCardData[]) {
  const groups: { subcategory: string; cards: MetricCardData[] }[] = [];
  for (const card of cards) {
    const sub = card.subcategory || "General";
    const existing = groups.find((g) => g.subcategory === sub);
    if (existing) {
      existing.cards.push(card);
    } else {
      groups.push({ subcategory: sub, cards: [card] });
    }
  }
  return groups;
}

export default function ResultsSection({
  aiText,
  typingDone,
  marketCards,
  ideaCards,
  onCardClick,
}: ResultsSectionProps) {
  const ideaGroups = groupBySubcategory(ideaCards);
  const marketGroups = groupBySubcategory(marketCards);

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
            {/* Idea Validation */}
            <div>
              <motion.h2
                className="text-2xl font-bold text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Idea Validation
              </motion.h2>
              {ideaGroups.map((group) => (
                <div key={group.subcategory} className="mb-6">
                  <motion.h3
                    className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-3"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                  >
                    {group.subcategory}
                  </motion.h3>
                  <div className="grid grid-cols-2 gap-3 auto-rows-[11rem]">
                    {group.cards.map((card, i) => (
                      <div key={card.id} className="col-span-1">
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
              ))}
            </div>

            {/* Market Validation */}
            <div>
              <motion.h2
                className="text-2xl font-bold text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Market Validation
              </motion.h2>
              {marketGroups.map((group) => (
                <div key={group.subcategory} className="mb-6">
                  <motion.h3
                    className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-3"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                  >
                    {group.subcategory}
                  </motion.h3>
                  <div className="grid grid-cols-2 gap-3 auto-rows-[11rem]">
                    {group.cards.map((card, i) => (
                      <div key={card.id} className="col-span-1">
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
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}