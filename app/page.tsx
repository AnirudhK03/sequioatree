"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { MetricCardData } from "./components/MetricCard";
import ExpandedCard from "./components/ExpandedCard";
import HeroSection from "./components/HeroSection";
import ResultsSection from "./components/ResultsSection";
import SequoiaLogo from "./components/SequoiaLogo";
import { usePhasedText } from "./hooks/usePhasedText";
import { MOCK_API_RESPONSE, apiResponseToCards } from "./data/cards";
import { useNotes } from "./components/NotesContext";

export default function Home() {
  const { notesText, annotations, setButtonVisible } = useNotes();

  const [prompt, setPrompt] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [runId, setRunId] = useState(0);
  const [runMode, setRunMode] = useState<"submit" | "refine">("submit");
  const [expandedCard, setExpandedCard] = useState<MetricCardData | null>(null);

  // When the real API is wired up, replace MOCK_API_RESPONSE with the
  // actual response. The rest of the pipeline stays the same.
  const { aiText: aiResponse, cards } = useMemo(
    () => apiResponseToCards(MOCK_API_RESPONSE),
    [],
  );

  // Status text that cycles while "thinking".
  const { text: aiText, done: typingDone } = usePhasedText(
    submitted,
    [
      "Aggregating data resources....",
      "Assessing idea viability...",
      "Assessing market viability...",
      "Consolidated results",
    ],
    { stepMs: 2000, finalHoldMs: 2000, resetKey: runId },
  );

  const handleSubmit = useCallback(() => {
    if (!prompt.trim()) return;
    setRunMode("submit");
    setSubmitted(true);
    setExpandedCard(null);
    setRunId((id) => id + 1);
  }, [prompt]);

  const handleRefine = useCallback(() => {
    if (!prompt.trim()) return;
    setRunMode("refine");
    setSubmitted(true);
    setExpandedCard(null);
    setRunId((id) => id + 1);
  }, [prompt]);

  const refining = runMode === "refine" && submitted && !typingDone;
  const thinking = submitted && !typingDone;

  const hasNotesOrAnnotations = notesText.trim().length > 0 || annotations.length > 0;
  const showRefine = submitted && typingDone && hasNotesOrAnnotations;

  useEffect(() => {
    // Hide Notes button on the first landing screen, but surface it once
    // results exist or if the user already has saved notes/annotations.
    setButtonVisible(submitted || hasNotesOrAnnotations);
  }, [hasNotesOrAnnotations, setButtonVisible, submitted]);

  const marketCards = cards.filter((c) => c.category === "market");
  const ideaCards = cards.filter((c) => c.category === "idea");

  return (
    <LayoutGroup>
      <main className="relative min-h-screen">
        {/* Fixed logo - always visible */}
        <motion.div
          className="fixed top-0 left-0 z-50 p-6 md:p-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div
            className="inline-flex items-center px-4 py-2 rounded-xl"
            animate={{
              backgroundColor: submitted ? "rgba(255,255,255,0)" : "rgba(255,255,255,0.9)",
            }}
            transition={{ duration: 0.5 }}
          >
            <SequoiaLogo />
          </motion.div>
        </motion.div>

        <HeroSection
          prompt={prompt}
          setPrompt={setPrompt}
          submitted={submitted}
          onSubmit={handleSubmit}
          onRefine={handleRefine}
          refining={refining}
          showRefine={showRefine}
          thinking={thinking}
        />

        <AnimatePresence>
          {submitted && (
            <ResultsSection
              aiText={aiText}
              typingDone={typingDone}
              marketCards={marketCards}
              ideaCards={ideaCards}
              onCardClick={setExpandedCard}
            />
          )}
        </AnimatePresence>

        <ExpandedCard card={expandedCard} onClose={() => setExpandedCard(null)} />
      </main>
    </LayoutGroup>
  );
}