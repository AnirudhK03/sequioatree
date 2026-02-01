"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

interface HeroSectionProps {
  prompt: string;
  setPrompt: (value: string) => void;
  submitted: boolean;
  onSubmit: () => void;
  onRefine: () => void;
  refining: boolean;
  showRefine: boolean;
}

export default function HeroSection({
  prompt,
  setPrompt,
  submitted,
  onSubmit,
  onRefine,
  refining,
  showRefine,
}: HeroSectionProps) {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 200]);
  const bgScale = useTransform(scrollY, [0, 600], [1, 1.15]);

  return (
    <motion.section
      className="relative flex flex-col overflow-hidden"
      animate={{ height: submitted ? "28vh" : "100vh" }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
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

      {/* Prompt area */}
      <div
        className={`relative z-10 flex-1 flex justify-center px-6 ${submitted ? "items-end pb-4 md:pb-6" : "items-center"
          }`}
      >
        <motion.div
          className="w-full max-w-3xl"
          animate={
            submitted
              ? { y: 0, scale: 0.85 }
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
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
            />
            <AnimatePresence>
              {prompt.trim() && (
                <motion.div
                  className="flex justify-end px-4 pb-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {!submitted ? (
                    <button
                      onClick={onSubmit}
                      className="px-5 py-2 bg-black text-white text-sm rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      Submit
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={onSubmit}
                        className="px-5 py-2 bg-black text-white text-sm rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                      >
                        Submit
                      </button>

                      {showRefine && (
                        <motion.button
                          type="button"
                          onClick={onRefine}
                          disabled={refining}
                          className="relative px-5 py-2 text-sm rounded-full border border-black/20 bg-white text-black overflow-hidden hover:bg-black/5 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <motion.span
                            className="absolute inset-0"
                            style={{
                              background:
                                "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)",
                            }}
                            initial={{ x: "-120%" }}
                            animate={{ x: refining ? "120%" : "-120%" }}
                            transition={
                              refining
                                ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
                                : { duration: 0 }
                            }
                            aria-hidden="true"
                          />

                          <span className="relative inline-flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M12 2c-2.8 2.2-4.5 5-4.5 7.6 0 3.1 2.2 5.4 4.5 5.4s4.5-2.3 4.5-5.4C16.5 7 14.8 4.2 12 2Z" />
                              <path d="M12 15v7" />
                              <path d="M8 22h8" />
                            </svg>

                            <span>Refine</span>

                            <span className="inline-flex items-center gap-0.5" aria-hidden="true">
                              <motion.span
                                className="w-1 h-1 rounded-full bg-current"
                                animate={{ opacity: refining ? [0.2, 1, 0.2] : 0 }}
                                transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
                              />
                              <motion.span
                                className="w-1 h-1 rounded-full bg-current"
                                animate={{ opacity: refining ? [0.2, 1, 0.2] : 0 }}
                                transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
                              />
                              <motion.span
                                className="w-1 h-1 rounded-full bg-current"
                                animate={{ opacity: refining ? [0.2, 1, 0.2] : 0 }}
                                transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                              />
                            </span>
                          </span>
                        </motion.button>
                      )}
                    </div>
                  )}
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
    </motion.section>
  );
}