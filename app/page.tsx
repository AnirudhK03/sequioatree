"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform, LayoutGroup } from "framer-motion";
import MetricCard, { MetricCardData } from "./components/MetricCard";
import ExpandedCard from "./components/ExpandedCard";

// ── Hardcoded data ──────────────────────────────────────────────────────────

const AI_RESPONSE =
  "Sure. Here is a Typescript code block for your Analog Clock project. It is built using React, and uses the local time for London, England as standard. Let me know if you would like to make any refinements to the code.";

const CARDS: MetricCardData[] = [
  {
    id: "cost-per-hire",
    label: "Reduction in cost-per-hire",
    value: "83%",
    color: "#C4B5FD",
    type: "metric",
    category: "market",
    detail: {
      title: "Significant cost savings in recruiting",
      summary:
        "AI-driven sourcing dramatically reduces the cost of finding qualified candidates by automating outreach, screening, and initial engagement.",
      points: [
        "Average cost-per-hire dropped from $4,700 to $799 across enterprise clients",
        "Eliminated need for 3rd-party recruiting agencies in 78% of roles",
        "Time-to-fill reduced by 60%, compounding cost savings",
        "ROI positive within first month of deployment",
      ],
      source: "Internal benchmark study, Q3 2024",
    },
  },
  {
    id: "team-image",
    label: "Team collaboration",
    value: "",
    color: "transparent",
    type: "image",
    category: "market",
    detail: {
      title: "Collaborative hiring at scale",
      summary: "Teams using the platform report higher collaboration and faster decision-making.",
      points: [
        "Hiring managers spend 40% less time on admin tasks",
        "Interview panel coordination automated end-to-end",
        "Real-time candidate scoring visible to all stakeholders",
      ],
      source: "Customer interviews, 2024",
    },
  },
  {
    id: "testimonial-sarah",
    label: "Sarah, Direct Sourcing Consultant",
    value: "",
    color: "#DDD6FE",
    type: "testimonial",
    category: "market",
    author: "Sarah, Direct Sourcing Consultant",
    quote:
      "Popp is an easy-to-use AI tool that is making my life a lot easier — it is helping me cut down the number of calls I need to make to fill a booking. You can easily set up a campaign in ten minutes and move on to your next job.",
    detail: {
      title: "Consultant testimonial",
      summary: "Sarah has been using the platform for 8 months and has seen dramatic improvements.",
      points: [
        "Reduced daily outreach calls by 70%",
        "Campaign setup time went from 2 hours to 10 minutes",
        "Candidate quality improved due to better targeting",
        "Now handles 3x more open roles simultaneously",
      ],
      source: "Customer interview, August 2024",
    },
  },
  {
    id: "response-rate",
    label: "Increase in response rate",
    value: "4X",
    color: "#E5E7EB",
    type: "chart-bar",
    category: "market",
    detail: {
      title: "Dramatically higher candidate engagement",
      summary:
        "Personalized AI-crafted outreach messages achieve 4x the response rate compared to traditional templated emails.",
      points: [
        "Average response rate increased from 8% to 32%",
        "Messages are personalized using candidate profile data and role context",
        "A/B testing built in — top performing variants auto-selected",
        "Follow-up sequences optimized by ML model",
      ],
      source: "Platform analytics, 2024",
    },
  },
  {
    id: "satisfaction",
    label: "Candidate satisfaction rating",
    value: "4.8*",
    color: "#FCA5A5",
    type: "chart-ring",
    category: "idea",
    detail: {
      title: "Best-in-class candidate experience",
      summary: "Candidates rate their experience significantly higher when engaged through the platform.",
      points: [
        "4.8 out of 5 average rating across 12,000+ candidates surveyed",
        "92% said the process felt personalized and respectful",
        "Ghosting rate dropped by 65% compared to manual outreach",
        "Candidates are 3x more likely to refer others",
      ],
      source: "Candidate survey, Q2 2024",
    },
  },
  {
    id: "nps",
    label: "Increase in candidate NPS",
    value: "52%",
    color: "#6EE7B7",
    type: "chart-progress",
    category: "idea",
    detail: {
      title: "Net Promoter Score surging",
      summary:
        "Candidate NPS jumped 52 points after implementing AI-powered communication flows.",
      points: [
        "NPS went from +12 to +64 in 6 months",
        "Detractors reduced by 80% through faster response times",
        "Promoters increased as candidates felt more valued",
        "Employer brand perception improved across Glassdoor reviews",
      ],
      source: "NPS tracking dashboard, 2024",
    },
  },
];

// ── Typewriter hook ─────────────────────────────────────────────────────────

function useTypewriter(text: string, active: boolean, speed = 20) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setDisplayed("");
      setDone(false);
      return;
    }
    let i = 0;
    setDisplayed("");
    setDone(false);
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, active, speed]);

  return { displayed, done };
}

// ── Sequoia Logo SVG ────────────────────────────────────────────────────────

function SequoiaLogo() {
  return (
    <div className="flex items-center gap-2 font-bold tracking-widest text-lg select-none">
      <span>SEQUOIA</span>
      <svg width="24" height="20" viewBox="0 0 24 20" fill="currentColor">
        <rect x="2" y="0" width="2" height="20" rx="1" />
        <rect x="6" y="4" width="2" height="16" rx="1" />
        <rect x="10" y="2" width="2" height="18" rx="1" />
        <rect x="14" y="6" width="2" height="14" rx="1" />
        <rect x="18" y="1" width="2" height="19" rx="1" />
      </svg>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [expandedCard, setExpandedCard] = useState<MetricCardData | null>(null);

  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 200]);
  const bgScale = useTransform(scrollY, [0, 600], [1, 1.15]);

  const { displayed: aiText, done: typingDone } = useTypewriter(AI_RESPONSE, submitted);

  const handleSubmit = useCallback(() => {
    if (!prompt.trim()) return;
    setSubmitted(true);
  }, [prompt]);

  const marketCards = CARDS.filter((c) => c.category === "market");
  const ideaCards = CARDS.filter((c) => c.category === "idea");

  return (
    <LayoutGroup>
      <main className="relative min-h-screen">
        {/* ── Hero Section ──────────────────────────────────────────── */}
        <section className="relative h-screen flex flex-col overflow-hidden">
          {/* Parallax background */}
          <AnimatePresence>
            {!submitted && (
              <motion.div
                className="absolute inset-0 z-0"
                exit={{ opacity: 0, transition: { duration: 0.8 } }}
              >
                <motion.div
                  className="absolute inset-[-10%] bg-cover bg-center"
                  style={{
                    backgroundImage: `url(https://images.unsplash.com/photo-1604713442455-7a14f46f7e07?w=1920&q=80)`,
                    y: bgY,
                    scale: bgScale,
                  }}
                />
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Background color for results state */}
          <motion.div
            className="absolute inset-0 z-0"
            style={{ backgroundColor: "#FAF5EE" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: submitted ? 1 : 0 }}
            transition={{ duration: 0.8 }}
          />

          {/* Logo */}
          <motion.div
            className="relative z-10 p-6 md:p-8"
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

          {/* Prompt area */}
          <div className="relative z-10 flex-1 flex items-center justify-center px-6">
            <motion.div
              className="w-full max-w-3xl"
              animate={
                submitted
                  ? { y: -180, scale: 0.8 }
                  : { y: 0, scale: 1 }
              }
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.div
                className="bg-white rounded-2xl overflow-hidden"
                animate={{
                  boxShadow: submitted
                    ? "0 1px 4px rgba(0,0,0,0.06)"
                    : "0 8px 40px rgba(0,0,0,0.12)",
                }}
                transition={{ duration: 0.5 }}
              >
                <textarea
                  className="w-full p-5 text-base resize-none outline-none bg-transparent placeholder:text-gray-400"
                  placeholder="Enter your idea, context, experience, ..."
                  rows={submitted ? 1 : 3}
                  value={prompt}
                  onChange={(e) => !submitted && setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  readOnly={submitted}
                />
                <AnimatePresence>
                  {!submitted && prompt.trim() && (
                    <motion.div
                      className="flex justify-end px-4 pb-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <button
                        onClick={handleSubmit}
                        className="px-5 py-2 bg-black text-white text-sm rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                      >
                        Submit
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <AnimatePresence>
            {!submitted && (
              <motion.div
                className="relative z-10 flex justify-center pb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 1.5, duration: 0.6 }}
              >
                <motion.div
                  className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center pt-2"
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className="w-1 h-2 bg-white/60 rounded-full" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── Results Section ───────────────────────────────────────── */}
        <AnimatePresence>
          {submitted && (
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
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
                            "testimonial-sarah": "col-span-1 row-span-1",
                            "response-rate": "col-span-2 row-span-1",
                          };
                          return (
                            <div key={card.id} className={spanClass[card.id] || "col-span-1"}>
                              <div className="h-full">
                                <MetricCard
                                  card={card}
                                  index={i}
                                  onClick={() => setExpandedCard(card)}
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
                                onClick={() => setExpandedCard(card)}
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
          )}
        </AnimatePresence>

        {/* ── Expanded Card Overlay ─────────────────────────────────── */}
        <ExpandedCard card={expandedCard} onClose={() => setExpandedCard(null)} />
      </main>
    </LayoutGroup>
  );
}
