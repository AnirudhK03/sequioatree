"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

interface HeroSectionProps {
  prompt: string;
  setPrompt: (value: string) => void;
  submitted: boolean;
  onSubmit: () => void;
}

export default function HeroSection({ prompt, setPrompt, submitted, onSubmit }: HeroSectionProps) {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 200]);
  const bgScale = useTransform(scrollY, [0, 600], [1, 1.15]);

  return (
    <motion.section
      className="relative flex flex-col overflow-hidden"
      animate={{ height: submitted ? "40vh" : "100vh" }}
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
      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
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
              onChange={(e) => !submitted && setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit();
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
                    onClick={onSubmit}
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
    </motion.section>
  );
}