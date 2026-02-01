"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export type MetricCardData = {
  id: string;
  label: string;
  value: string;
  color: string;
  textColor?: string;
  type: "metric" | "image" | "testimonial" | "chart-bar" | "chart-ring" | "chart-progress";
  category: "market" | "idea";
  subcategory?: string;
  detail: {
    title: string;
    summary: string;
    points: string[];
    source: string;
  };
  // For testimonial
  author?: string;
  quote?: string;
  // For image
  imageUrl?: string;
};

function BarChart() {
  const bars = [0.3, 0.5, 0.4, 0.7, 0.6, 0.85, 0.75, 0.9];
  return (
    <div className="flex items-end gap-1.5 h-14 md:h-16 mt-2">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-3 bg-black rounded-sm origin-bottom"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
          style={{ height: `${h * 100}%` }}
        />
      ))}
    </div>
  );
}

function RingChart({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (value / 5) * circumference;
  return (
    <svg viewBox="0 0 100 100" className="w-32 h-32">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#00000020" strokeWidth="6" />
      <motion.circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="#171717"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        whileInView={{ strokeDashoffset: offset }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
}

function ProgressBars() {
  const bars = [0.52, 0.78, 0.45];
  return (
    <div className="flex flex-col gap-2 mt-2 w-full">
      {bars.map((w, i) => (
        <div key={i} className="h-4 bg-black/10 rounded-sm overflow-hidden">
          <motion.div
            className="h-full bg-black rounded-sm origin-left"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
            style={{ width: `${w * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function CountUp({ value, suffix = "" }: { value: string; suffix?: string }) {
  // Extract numeric part
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  const prefix = value.replace(/[0-9.]+/, "").replace(suffix, "");

  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      {prefix}
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {value}
      </motion.span>
      {suffix}
    </motion.span>
  );
}

function valueTextClass(value: string) {
  const len = value.trim().length;
  if (len >= 14) return "text-xl md:text-2xl";
  if (len >= 10) return "text-2xl md:text-3xl";
  if (len >= 8) return "text-3xl md:text-4xl";
  return "text-4xl md:text-5xl";
}

export default function MetricCard({
  card,
  index,
  onClick,
}: {
  card: MetricCardData;
  index: number;
  onClick: () => void;
}) {
  const valueClass = `${valueTextClass(card.value)} font-bold tracking-tighter leading-[0.95] break-words min-w-0`;

  const cardContent: Record<string, ReactNode> = {
    metric: (
      <div className="flex flex-col justify-between h-full min-h-0 p-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded-full border border-current/20 bg-white/30">
            {card.label}
          </span>
          <span className="text-xs opacity-50">+</span>
        </div>
        <span className={`${valueClass} mt-auto`}>
          {card.value}
        </span>
      </div>
    ),
    image: (
      <div
        className="w-full h-full bg-cover bg-center rounded-2xl"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80)`,
        }}
      />
    ),
    testimonial: (
      <div className="flex flex-col justify-between h-full min-h-0 p-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded-full border border-current/20 bg-white/30">
            {card.author}
          </span>
          <span className="text-xs opacity-50">+</span>
        </div>
        <p className="text-sm leading-relaxed mt-4 font-medium overflow-hidden">
          &ldquo;{card.quote}&rdquo;
        </p>
      </div>
    ),
    "chart-bar": (
      <div className="flex flex-col justify-between h-full min-h-0 p-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded-full border border-current/20 bg-white/30">
            {card.label}
          </span>
          <span className="text-xs opacity-50">+</span>
        </div>
        <div className="mt-auto">
          <span className={valueClass}>{card.value}</span>
          <BarChart />
        </div>
      </div>
    ),
    "chart-ring": (
      <div className="flex flex-col items-center justify-between h-full min-h-0 p-5">
        <div className="flex items-center gap-2 self-start">
          <span className="text-xs font-mono px-3 py-1 rounded-full border border-current/20 bg-white/30">
            {card.label}
          </span>
          <span className="text-xs opacity-50">+</span>
        </div>
        <div className="relative flex items-center justify-center mt-2">
          <RingChart value={4.8} />
          <span className="absolute text-3xl font-bold">{card.value}</span>
        </div>
      </div>
    ),
    "chart-progress": (
      <div className="flex flex-col justify-between h-full min-h-0 p-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded-full border border-current/20 bg-white/30">
            {card.label}
          </span>
          <span className="text-xs opacity-50">+</span>
        </div>
        <div className="mt-auto">
          <ProgressBars />
          <span className={`${valueClass} mt-2 block`}>
            {card.value}
          </span>
        </div>
      </div>
    ),
  };

  return (
    <motion.div
      layoutId={`card-${card.id}`}
      className="rounded-2xl cursor-pointer overflow-hidden h-full min-w-0"
      style={{ backgroundColor: card.color, color: card.textColor || "#171717" }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {cardContent[card.type]}
    </motion.div>
  );
}
