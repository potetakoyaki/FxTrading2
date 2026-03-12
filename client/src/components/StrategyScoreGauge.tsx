/**
 * Design: Trading Terminal - Circular gauge for strategy score
 * Animated SVG gauge with glow effect
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import type { StrategyScore } from "@/lib/analysis";

interface Props {
  score: StrategyScore;
}

export default function StrategyScoreGauge({ score }: Props) {
  const { language } = useLanguage();
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const start = performance.now();
    let rafId: number;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(Math.round(eased * score.total));
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [score.total]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (animatedValue / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="flex flex-col items-center"
    >
      <div className="relative w-52 h-52">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="oklch(0.2 0.02 260)"
            strokeWidth="12"
          />
          {/* Score arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={score.gradeColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: `drop-shadow(0 0 8px ${score.gradeColor}80)`,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="metric-value text-5xl font-bold"
            style={{ color: score.gradeColor }}
          >
            {animatedValue}
          </span>
          <span className="text-muted-foreground text-sm mt-1">/ 100</span>
        </div>
      </div>

      {/* Grade badge */}
      <div
        className="mt-4 px-5 py-1.5 rounded-full text-lg font-bold tracking-wider"
        style={{
          backgroundColor: `${score.gradeColor}20`,
          color: score.gradeColor,
          boxShadow: `0 0 20px ${score.gradeColor}30`,
        }}
      >
        Grade {score.grade}
      </div>

      {/* Score breakdown */}
      <div className="mt-5 grid grid-cols-2 gap-3 w-full max-w-xs">
        {[
          { label: "Profit Factor", value: score.pfScore, max: 25 },
          { label: "Risk Reward", value: score.rrScore, max: 25 },
          {
            label: language === "ja" ? "期待値" : "Expectancy",
            value: score.expectancyScore,
            max: 25,
          },
          {
            label: language === "ja" ? "ドローダウン" : "Drawdown",
            value: score.ddScore,
            max: 25,
          },
        ].map(item => (
          <div key={item.label} className="text-center">
            <div className="text-xs text-muted-foreground mb-1">
              {item.label}
            </div>
            <div className="h-1.5 bg-[oklch(0.2_0.02_260)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / item.max) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full rounded-full"
                style={{ backgroundColor: score.gradeColor }}
              />
            </div>
            <div className="metric-value text-xs mt-1 text-foreground">
              {item.value}/{item.max}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
