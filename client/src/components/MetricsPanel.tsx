/**
 * Design: Trading Terminal - Glowing metric cards
 * Key performance indicators displayed in a grid
 */
import { motion } from "framer-motion";
import type { PerformanceMetrics } from "@/lib/analysis";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  TrendingUp, TrendingDown, Target, BarChart3,
  Activity, Percent, DollarSign, AlertTriangle,
} from "lucide-react";

interface Props {
  metrics: PerformanceMetrics;
}

function safe(n: number): number {
  if (!isFinite(n) || isNaN(n)) return 0;
  return n;
}

function formatNumber(n: number, decimals = 2): string {
  const v = safe(n);
  if (Math.abs(v) >= 999) return "999+";
  return v.toFixed(decimals);
}

function formatCurrency(n: number): string {
  const v = safe(n);
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}`;
}

export default function MetricsPanel({ metrics }: Props) {
  const { t } = useLanguage();

  const cards = [
    {
      label: t("metric.totalTrades"),
      value: metrics.totalTrades.toString(),
      icon: BarChart3,
      color: "oklch(0.65 0.18 250)",
      sub: `${t("metric.winCount")}: ${metrics.winCount} / ${t("metric.lossCount")}: ${metrics.lossCount}`,
    },
    {
      label: t("metric.winRate"),
      value: `${safe(metrics.winRate).toFixed(1)}%`,
      icon: Percent,
      color: metrics.winRate >= 50 ? "oklch(0.82 0.18 165)" : "oklch(0.65 0.2 20)",
      sub: `${metrics.winCount}W / ${metrics.lossCount}L`,
    },
    {
      label: t("metric.pf"),
      value: formatNumber(metrics.profitFactor),
      icon: TrendingUp,
      color: metrics.profitFactor >= 1.5 ? "oklch(0.82 0.18 165)" : metrics.profitFactor >= 1 ? "oklch(0.78 0.15 75)" : "oklch(0.65 0.2 20)",
      sub: t("metric.grossProfit"),
    },
    {
      label: t("metric.rr"),
      value: formatNumber(metrics.riskReward),
      icon: Target,
      color: metrics.riskReward >= 1.5 ? "oklch(0.82 0.18 165)" : metrics.riskReward >= 1 ? "oklch(0.78 0.15 75)" : "oklch(0.65 0.2 20)",
      sub: t("metric.avgProfit"),
    },
    {
      label: t("metric.expectancy"),
      value: formatCurrency(metrics.expectancy),
      icon: DollarSign,
      color: metrics.expectancy > 0 ? "oklch(0.82 0.18 165)" : "oklch(0.65 0.2 20)",
      sub: t("metric.perTrade"),
    },
    {
      label: t("metric.netProfit"),
      value: formatCurrency(metrics.netProfit),
      icon: metrics.netProfit >= 0 ? TrendingUp : TrendingDown,
      color: metrics.netProfit >= 0 ? "oklch(0.82 0.18 165)" : "oklch(0.65 0.2 20)",
      sub: `${t("metric.profit")}: ${safe(metrics.totalProfit).toFixed(2)} / ${t("metric.loss")}: ${safe(metrics.totalLoss).toFixed(2)}`,
    },
    {
      label: t("metric.maxDD"),
      value: `${safe(metrics.maxDrawdown).toFixed(2)}`,
      icon: AlertTriangle,
      color: metrics.maxDrawdownPercent > 20 ? "oklch(0.65 0.2 20)" : "oklch(0.78 0.15 75)",
      sub: `${safe(metrics.maxDrawdownPercent).toFixed(1)}%`,
    },
    {
      label: t("metric.largestWinLoss"),
      value: `+${safe(metrics.largestWin).toFixed(0)} / -${Math.abs(safe(metrics.largestLoss)).toFixed(0)}`,
      icon: Activity,
      color: "oklch(0.78 0.15 75)",
      sub: t("metric.largestWinLossSub"),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className="glow-card bg-card rounded-lg p-4 border border-border"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {card.label}
            </span>
            <card.icon className="w-4 h-4" style={{ color: card.color }} />
          </div>
          <div
            className="metric-value text-2xl font-bold"
            style={{ color: card.color }}
          >
            {card.value}
          </div>
          <div className="text-xs text-muted-foreground mt-1.5">{card.sub}</div>
        </motion.div>
      ))}
    </div>
  );
}
