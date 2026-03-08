/**
 * AdvancedAnalysisPanels.tsx
 * Design: Trading Terminal Dark UI (Bloomberg-inspired)
 * Purpose: Advanced analysis panels for deep insights
 * - Day of Week analysis with bar chart
 * - Lot size correlation table
 * - Trade Quality analysis (replaces old Losing Streak panel)
 * - Win/Loss distribution histogram
 * - Low-quality trade impact analysis
 */

import { motion } from "framer-motion";
import { Calendar, Layers, AlertTriangle, BarChart3, TrendingDown, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import type {
  DayOfWeekAnalysis,
  LotSizeGroup,
  TradeQualityAnalysis,
  WinLossDistribution,
  LowQualityTradeImpact,
  WorstTradeCommonPattern,
} from "@/lib/analysis";

// ==================== Day of Week Analysis ====================

export function DayOfWeekPanel({ data }: { data: DayOfWeekAnalysis[] }) {
  const { language } = useLanguage();
  const ja = language === "ja";

  if (data.length === 0) return null;

  const bestDay = data.reduce((a, b) => a.winRate > b.winRate ? a : b);
  const worstDay = data.reduce((a, b) => a.winRate < b.winRate ? a : b);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-1 uppercase tracking-wider flex items-center gap-2">
        <Calendar className="w-4 h-4 text-[oklch(0.65_0.18_250)]" />
        {ja ? "曜日別パフォーマンス" : "Day of Week Performance"}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        {ja
          ? `最も成績が良い曜日: ${bestDay.day}曜日（勝率 ${bestDay.winRate.toFixed(1)}%）、最も悪い曜日: ${worstDay.day}曜日（勝率 ${worstDay.winRate.toFixed(1)}%）`
          : `Best day: ${bestDay.day} (win rate ${bestDay.winRate.toFixed(1)}%), Worst day: ${worstDay.day} (win rate ${worstDay.winRate.toFixed(1)}%)`
        }
      </p>

      {/* Bar chart visualization */}
      <div className="space-y-2 mb-4">
        {data.map((d, i) => (
          <motion.div
            key={d.day}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3"
          >
            <span className="text-xs font-mono text-muted-foreground w-6 text-right">{d.day}</span>
            <div className="flex-1 h-5 bg-[oklch(0.14_0.02_260)] rounded overflow-hidden relative">
              {/* Win bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${d.winRate}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className={`absolute left-0 top-0 h-full rounded ${
                  d.winRate >= 55 ? "bg-[oklch(0.55_0.15_145)]" :
                  d.winRate >= 45 ? "bg-[oklch(0.55_0.12_75)]" :
                  "bg-[oklch(0.5_0.15_20)]"
                }`}
              />
              <div className="absolute inset-0 flex items-center px-2">
                <span className="text-[10px] font-mono text-white/80 relative z-10">
                  {d.winRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <span className="text-xs font-mono text-muted-foreground w-8 text-right">{d.trades}</span>
            <span className={`text-xs font-mono w-16 text-right ${d.netProfit >= 0 ? "text-[oklch(0.72_0.18_145)]" : "text-[oklch(0.65_0.2_20)]"}`}>
              {d.netProfit >= 0 ? "+" : ""}{d.netProfit.toFixed(1)}
            </span>
          </motion.div>
        ))}
        <div className="flex items-center gap-3 mt-1">
          <span className="w-6" />
          <div className="flex-1 flex justify-between text-[10px] text-muted-foreground px-1">
            <span>0%</span>
            <span>{ja ? "勝率" : "Win Rate"}</span>
            <span>100%</span>
          </div>
          <span className="text-[10px] text-muted-foreground w-8 text-right">{ja ? "件数" : "Trades"}</span>
          <span className="text-[10px] text-muted-foreground w-16 text-right">{ja ? "損益" : "P/L"}</span>
        </div>
      </div>

      {/* Advice */}
      <div className="border-t border-border pt-3 space-y-2">
        {worstDay.winRate < 45 && worstDay.trades >= 3 && (
          <div className="flex gap-2 p-2.5 rounded-lg bg-[oklch(0.15_0.04_20)] border border-[oklch(0.65_0.2_20/0.2)]">
            <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.65_0.2_20)] shrink-0 mt-0.5" />
            <p className="text-xs text-[oklch(0.65_0.2_20)] leading-relaxed">
              {ja
                ? `${worstDay.day}曜日の勝率は${worstDay.winRate.toFixed(1)}%と低く、${worstDay.trades}件のトレードで損益は${worstDay.netProfit.toFixed(2)}です。この曜日のエントリーを減らすか、ロットを小さくすることを検討してください。`
                : `${worstDay.day} has a low win rate of ${worstDay.winRate.toFixed(1)}% over ${worstDay.trades} trades (P/L: ${worstDay.netProfit.toFixed(2)}). Consider reducing entries or lot size on this day.`
              }
            </p>
          </div>
        )}
        {bestDay.winRate >= 60 && bestDay.trades >= 3 && (
          <div className="flex gap-2 p-2.5 rounded-lg bg-[oklch(0.15_0.04_145)] border border-[oklch(0.72_0.18_145/0.2)]">
            <span className="text-[oklch(0.72_0.18_145)] text-xs shrink-0 mt-0.5">✓</span>
            <p className="text-xs text-[oklch(0.72_0.18_145)] leading-relaxed">
              {ja
                ? `${bestDay.day}曜日の勝率は${bestDay.winRate.toFixed(1)}%と高いです。この曜日のトレードを重点的に行うことで、全体のパフォーマンス向上が期待できます。`
                : `${bestDay.day} has a strong win rate of ${bestDay.winRate.toFixed(1)}%. Focusing more trades on this day could improve overall performance.`
              }
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ==================== Lot Size Correlation ====================

export function LotSizeCorrelationPanel({ data }: { data: LotSizeGroup[] }) {
  const { language } = useLanguage();
  const ja = language === "ja";

  if (data.length === 0) return null;

  // Comprehensive lot size analysis
  const hasMultipleGroups = data.length >= 2;
  const smallLot = data[0];
  const largeLot = data[data.length - 1];

  // Calculate overall metrics across all groups
  const totalTrades = data.reduce((s, g) => s + g.trades, 0);
  const totalNetProfit = data.reduce((s, g) => s + g.netProfit, 0);
  const weightedWinRate = totalTrades > 0
    ? data.reduce((s, g) => s + g.winRate * g.trades, 0) / totalTrades
    : 0;
  const avgPF = data.reduce((s, g) => s + Math.min(g.profitFactor, 10) * g.trades, 0) / (totalTrades || 1);

  // Detect specific problems
  const allGroupsLosing = data.every(g => g.netProfit < 0);
  const allGroupsLowWR = data.filter(g => g.trades >= 3).every(g => g.winRate < 50);
  const allGroupsLowPF = data.filter(g => g.trades >= 3).every(g => g.profitFactor < 1);
  const largeLotWorse = hasMultipleGroups && largeLot.winRate < smallLot.winRate - 10;
  const largeLotMuchWorsePF = hasMultipleGroups && largeLot.trades >= 3 && smallLot.trades >= 3
    && largeLot.profitFactor < smallLot.profitFactor * 0.7;
  const largeLotBiggerLoss = hasMultipleGroups && largeLot.netProfit < 0 && smallLot.netProfit < 0
    && Math.abs(largeLot.netProfit / (largeLot.trades || 1)) > Math.abs(smallLot.netProfit / (smallLot.trades || 1)) * 1.5;

  // Find worst and best performing groups
  const worstGroup = data.filter(g => g.trades >= 3).reduce((a, b) => a.profitFactor < b.profitFactor ? a : b, data[0]);
  const bestGroup = data.filter(g => g.trades >= 3).reduce((a, b) => a.profitFactor > b.profitFactor ? a : b, data[0]);

  // Determine advice type
  type AdviceType = "all_losing" | "large_lot_emotional" | "large_lot_pf_drop" | "inconsistent" | "specific_group_bad" | "stable_good" | "stable_mediocre";

  let adviceType: AdviceType = "stable_good";
  if (allGroupsLosing || allGroupsLowPF) {
    adviceType = "all_losing";
  } else if (largeLotWorse && largeLotBiggerLoss) {
    adviceType = "large_lot_emotional";
  } else if (largeLotMuchWorsePF) {
    adviceType = "large_lot_pf_drop";
  } else if (hasMultipleGroups && bestGroup.profitFactor > 1 && worstGroup.profitFactor < 0.8 && worstGroup.trades >= 3) {
    adviceType = "inconsistent";
  } else if (worstGroup.trades >= 3 && worstGroup.profitFactor < 1) {
    adviceType = "specific_group_bad";
  } else if (avgPF < 1.2 || weightedWinRate < 55) {
    adviceType = "stable_mediocre";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-1 uppercase tracking-wider flex items-center gap-2">
        <Layers className="w-4 h-4 text-[oklch(0.65_0.18_250)]" />
        {ja ? "ロットサイズ別パフォーマンス" : "Lot Size Performance"}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        {ja
          ? "ロットサイズと勝率・損益の相関を分析します。大ロット時に成績が悪化している場合は感情的なトレードの可能性があります。"
          : "Analyzes correlation between lot size and win rate/P&L. Poor performance at large lots may indicate emotional trading."
        }
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">
                {ja ? "ロット区分" : "Lot Group"}
              </th>
              <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">
                {ja ? "件数" : "Trades"}
              </th>
              <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">
                {ja ? "勝率" : "Win Rate"}
              </th>
              <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">PF</th>
              <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">
                {ja ? "損益" : "P/L"}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <motion.tr
                key={row.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-[oklch(0.2_0.02_260)] hover:bg-[oklch(0.16_0.02_260)]"
              >
                <td className="py-2.5 px-2 font-medium text-foreground text-xs">{row.label}</td>
                <td className="py-2.5 px-2 text-right text-muted-foreground text-xs">{row.trades}</td>
                <td className="py-2.5 px-2 text-right text-xs">
                  <span className={row.winRate >= 50 ? "text-[oklch(0.72_0.18_145)]" : "text-[oklch(0.65_0.2_20)]"}>
                    {row.winRate.toFixed(1)}%
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right text-xs">
                  <span className={row.profitFactor >= 1 ? "text-[oklch(0.72_0.18_145)]" : "text-[oklch(0.65_0.2_20)]"}>
                    {row.profitFactor >= 999 ? "999+" : row.profitFactor.toFixed(2)}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-xs">
                  <span className={row.netProfit >= 0 ? "text-[oklch(0.72_0.18_145)]" : "text-[oklch(0.65_0.2_20)]"}>
                    {row.netProfit >= 0 ? "+" : ""}{row.netProfit.toFixed(2)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Advice - data-driven analysis */}
      <div className="mt-3 space-y-2">
        {adviceType === "all_losing" && (
          <div className="flex gap-2 p-2.5 rounded-lg bg-[oklch(0.15_0.04_20)] border border-[oklch(0.65_0.2_20/0.2)]">
            <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.65_0.2_20)] shrink-0 mt-0.5" />
            <p className="text-xs text-[oklch(0.65_0.2_20)] leading-relaxed">
              {ja
                ? `全てのロットサイズで損失が発生しています（合計損益: ${totalNetProfit.toFixed(2)}、平均PF: ${avgPF.toFixed(2)}）。ロットサイズの問題以前に、エントリー・エグジット戦略自体の見直しが必要です。まずは最小ロットに固定してルールの検証を行い、勝てるロジックを確立してからロットサイズを調整してください。`
                : `All lot sizes are losing money (total P/L: ${totalNetProfit.toFixed(2)}, avg PF: ${avgPF.toFixed(2)}). Before adjusting lot sizes, review entry/exit strategy fundamentals. Fix position sizing at minimum lots, validate your rules, then scale up.`
              }
            </p>
          </div>
        )}
        {adviceType === "large_lot_emotional" && (
          <div className="flex gap-2 p-2.5 rounded-lg bg-[oklch(0.15_0.04_20)] border border-[oklch(0.65_0.2_20/0.2)]">
            <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.65_0.2_20)] shrink-0 mt-0.5" />
            <p className="text-xs text-[oklch(0.65_0.2_20)] leading-relaxed">
              {ja
                ? `大ロット（${largeLot.label}）の勝率${largeLot.winRate.toFixed(1)}%・1トレード平均損益${(largeLot.netProfit / largeLot.trades).toFixed(2)}に対し、小ロット（${smallLot.label}）は勝率${smallLot.winRate.toFixed(1)}%・1トレード平均損益${(smallLot.netProfit / smallLot.trades).toFixed(2)}です。ロットを増やした際にプレッシャーから判断が悪化している可能性が高いです。大ロット時の損切り・利確ルールを再確認し、感情に左右されない固定ルールを設けてください。`
                : `Large lots (${largeLot.label}): ${largeLot.winRate.toFixed(1)}% win rate, avg P/L per trade ${(largeLot.netProfit / largeLot.trades).toFixed(2)}. Small lots (${smallLot.label}): ${smallLot.winRate.toFixed(1)}% win rate, avg P/L per trade ${(smallLot.netProfit / smallLot.trades).toFixed(2)}. Performance degrades significantly at larger positions, indicating emotional pressure. Use fixed rules for SL/TP regardless of position size.`
              }
            </p>
          </div>
        )}
        {adviceType === "large_lot_pf_drop" && (
          <div className="flex gap-2 p-2.5 rounded-lg bg-[oklch(0.15_0.04_20)] border border-[oklch(0.65_0.2_20/0.2)]">
            <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.65_0.2_20)] shrink-0 mt-0.5" />
            <p className="text-xs text-[oklch(0.65_0.2_20)] leading-relaxed">
              {ja
                ? `大ロット（${largeLot.label}）のPF${largeLot.profitFactor >= 999 ? "999+" : largeLot.profitFactor.toFixed(2)}が小ロット（${smallLot.label}）のPF${smallLot.profitFactor >= 999 ? "999+" : smallLot.profitFactor.toFixed(2)}から大幅に悪化しています。大ロット時は損切りが遅れるか、利確が早まる傾向があります。ロットサイズを段階的に上げ、各サイズで安定した成績を確認してからスケールアップしてください。`
                : `Large lot (${largeLot.label}) PF ${largeLot.profitFactor >= 999 ? "999+" : largeLot.profitFactor.toFixed(2)} drops significantly from small lot (${smallLot.label}) PF ${smallLot.profitFactor >= 999 ? "999+" : smallLot.profitFactor.toFixed(2)}. Gradually scale up lot size and confirm stable performance at each level before increasing.`
              }
            </p>
          </div>
        )}
        {adviceType === "inconsistent" && (
          <div className="flex gap-2 p-2.5 rounded-lg bg-[oklch(0.15_0.04_50)] border border-[oklch(0.78_0.15_75/0.2)]">
            <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.78_0.15_75)] shrink-0 mt-0.5" />
            <p className="text-xs text-[oklch(0.78_0.15_75)] leading-relaxed">
              {ja
                ? `ロットサイズによってパフォーマンスに大きな差があります。${bestGroup.label}（PF: ${bestGroup.profitFactor >= 999 ? "999+" : bestGroup.profitFactor.toFixed(2)}、勝率: ${bestGroup.winRate.toFixed(1)}%）が最も良く、${worstGroup.label}（PF: ${worstGroup.profitFactor >= 999 ? "999+" : worstGroup.profitFactor.toFixed(2)}、勝率: ${worstGroup.winRate.toFixed(1)}%）が最も悪い結果です。成績の良い${bestGroup.label}に集中し、${worstGroup.label}でのエントリーを減らすか、同一ルールが適用されているか確認してください。`
                : `Performance varies significantly by lot size. Best: ${bestGroup.label} (PF: ${bestGroup.profitFactor >= 999 ? "999+" : bestGroup.profitFactor.toFixed(2)}, WR: ${bestGroup.winRate.toFixed(1)}%). Worst: ${worstGroup.label} (PF: ${worstGroup.profitFactor >= 999 ? "999+" : worstGroup.profitFactor.toFixed(2)}, WR: ${worstGroup.winRate.toFixed(1)}%). Focus on ${bestGroup.label} and reduce ${worstGroup.label} entries.`
              }
            </p>
          </div>
        )}
        {adviceType === "specific_group_bad" && (
          <div className="flex gap-2 p-2.5 rounded-lg bg-[oklch(0.15_0.04_50)] border border-[oklch(0.78_0.15_75/0.2)]">
            <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.78_0.15_75)] shrink-0 mt-0.5" />
            <p className="text-xs text-[oklch(0.78_0.15_75)] leading-relaxed">
              {ja
                ? `${worstGroup.label}（${worstGroup.trades}件）のPFが${worstGroup.profitFactor.toFixed(2)}と低く、損益は${worstGroup.netProfit.toFixed(2)}です。このサイズでのトレードを見直すか、成績が安定するまでロットを落としてください。`
                : `${worstGroup.label} (${worstGroup.trades} trades) has a low PF of ${worstGroup.profitFactor.toFixed(2)} with P/L of ${worstGroup.netProfit.toFixed(2)}. Review trades at this size or reduce lot until performance stabilizes.`
              }
            </p>
          </div>
        )}
        {adviceType === "stable_mediocre" && hasMultipleGroups && (
          <div className="flex gap-2 p-2.5 rounded-lg bg-[oklch(0.15_0.04_50)] border border-[oklch(0.78_0.15_75/0.2)]">
            <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.78_0.15_75)] shrink-0 mt-0.5" />
            <p className="text-xs text-[oklch(0.78_0.15_75)] leading-relaxed">
              {ja
                ? `ロットサイズ間で大きな差はありませんが、全体的にパフォーマンスが低調です（加重平均勝率: ${weightedWinRate.toFixed(1)}%、平均PF: ${avgPF.toFixed(2)}）。ロットサイズの調整よりも先に、エントリー精度の改善や損切りルールの最適化に取り組むことを推奨します。`
                : `No significant difference across lot sizes, but overall performance is below target (weighted WR: ${weightedWinRate.toFixed(1)}%, avg PF: ${avgPF.toFixed(2)}). Focus on improving entry accuracy and SL/TP rules before adjusting lot sizes.`
              }
            </p>
          </div>
        )}
        {adviceType === "stable_good" && hasMultipleGroups && (
          <div className="flex gap-2 p-2.5 rounded-lg bg-[oklch(0.15_0.04_145)] border border-[oklch(0.72_0.18_145/0.2)]">
            <span className="text-[oklch(0.72_0.18_145)] text-xs shrink-0 mt-0.5">✓</span>
            <p className="text-xs text-[oklch(0.72_0.18_145)] leading-relaxed">
              {ja
                ? `ロットサイズに関わらず安定した成績を維持しています（加重平均勝率: ${weightedWinRate.toFixed(1)}%、平均PF: ${avgPF.toFixed(2)}）。感情的なトレードの影響は少なく、ポジションサイズ管理が適切です。`
                : `Performance is consistent across lot sizes (weighted WR: ${weightedWinRate.toFixed(1)}%, avg PF: ${avgPF.toFixed(2)}). Position sizing is well-managed with minimal emotional impact.`
              }
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ==================== Trade Quality Analysis ====================

export function TradeQualityPanel({ data }: { data: TradeQualityAnalysis }) {
  const { language } = useLanguage();
  const ja = language === "ja";

  const gradeColors: Record<string, string> = {
    A: "oklch(0.72 0.18 145)",
    B: "oklch(0.72 0.15 200)",
    C: "oklch(0.78 0.15 75)",
    D: "oklch(0.65 0.15 50)",
    F: "oklch(0.65 0.2 20)",
  };
  const gradeColor = gradeColors[data.qualityGrade] || "oklch(0.78 0.15 75)";

  const patterns = [
    { detected: data.isKotsuKotsuDokan, label: ja ? "コツコツドカン" : "Small wins / Large losses", severity: "high" as const },
    { detected: data.isLargeWinDependent, label: ja ? "大勝ち依存" : "Large win dependency", severity: "high" as const },
    { detected: data.hasLateSL, label: ja ? "損切り遅れ" : "Late stop-loss", severity: "high" as const },
    { detected: data.hasEarlyTP, label: ja ? "利確が早すぎ" : "Early take-profit", severity: "medium" as const },
  ];
  const detectedPatterns = patterns.filter(p => p.detected);
  const noPatterns = detectedPatterns.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[oklch(0.78_0.15_75)]" />
          {ja ? "トレード品質分析" : "Trade Quality Analysis"}
        </h3>
        <div
          className="text-xs font-bold px-2.5 py-0.5 rounded"
          style={{ backgroundColor: `${gradeColor}20`, color: gradeColor }}
        >
          {ja ? "グレード" : "Grade"} {data.qualityGrade}
        </div>
      </div>

      {/* Quality Score Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">
            {ja ? "品質スコア" : "Quality Score"}
          </span>
          <span className="text-sm font-mono font-bold" style={{ color: gradeColor }}>
            {data.qualityScore}/100
          </span>
        </div>
        <div className="h-2 bg-[oklch(0.2_0.02_260)] rounded overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.qualityScore}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded"
            style={{ backgroundColor: gradeColor }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[oklch(0.14_0.02_260)] rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase mb-2">
            {ja ? "勝ちトレード特性" : "Win Characteristics"}
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-foreground">{ja ? "平均" : "Avg"}</span>
              <span className="text-xs font-mono text-[oklch(0.72_0.18_145)]">+{data.avgWinAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-foreground">{ja ? "中央値" : "Median"}</span>
              <span className="text-xs font-mono text-[oklch(0.72_0.18_145)]">+{data.medianWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-foreground">{ja ? "標準偏差" : "Std Dev"}</span>
              <span className="text-xs font-mono text-muted-foreground">{data.winStdDev.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="bg-[oklch(0.14_0.02_260)] rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase mb-2">
            {ja ? "負けトレード特性" : "Loss Characteristics"}
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-foreground">{ja ? "平均" : "Avg"}</span>
              <span className="text-xs font-mono text-[oklch(0.65_0.2_20)]">-{data.avgLossAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-foreground">{ja ? "中央値" : "Median"}</span>
              <span className="text-xs font-mono text-[oklch(0.65_0.2_20)]">-{data.medianLoss.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-foreground">{ja ? "標準偏差" : "Std Dev"}</span>
              <span className="text-xs font-mono text-muted-foreground">{data.lossStdDev.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Concentration Bars */}
      <div className="space-y-2 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">
              {ja ? "利益集中率（上位20%）" : "Profit concentration (top 20%)"}
            </span>
            <span className={`text-xs font-mono ${data.profitConcentration > 70 ? "text-[oklch(0.65_0.2_20)]" : "text-muted-foreground"}`}>
              {data.profitConcentration.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 bg-[oklch(0.2_0.02_260)] rounded overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.profitConcentration}%` }}
              transition={{ duration: 0.6 }}
              className={`h-full rounded ${data.profitConcentration > 70 ? "bg-[oklch(0.5_0.15_20)]" : "bg-[oklch(0.55_0.15_145)]"}`}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">
              {ja ? "損失集中率（上位20%）" : "Loss concentration (top 20%)"}
            </span>
            <span className={`text-xs font-mono ${data.lossConcentration > 60 ? "text-[oklch(0.65_0.2_20)]" : "text-muted-foreground"}`}>
              {data.lossConcentration.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 bg-[oklch(0.2_0.02_260)] rounded overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.lossConcentration}%` }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`h-full rounded ${data.lossConcentration > 60 ? "bg-[oklch(0.5_0.15_20)]" : "bg-[oklch(0.55_0.12_75)]"}`}
            />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/70">
          {ja ? "一貫性スコア" : "Consistency Score"}: {data.consistencyScore}/100
        </p>
      </div>

      {/* Pattern Alerts */}
      {detectedPatterns.length > 0 && (
        <div className="space-y-2">
          {detectedPatterns.map(p => (
            <div
              key={p.label}
              className={`flex gap-2 p-2.5 rounded-lg border ${
                p.severity === "high"
                  ? "bg-[oklch(0.15_0.04_20)] border-[oklch(0.65_0.2_20/0.2)]"
                  : "bg-[oklch(0.15_0.04_50)] border-[oklch(0.78_0.15_75/0.2)]"
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                p.severity === "high" ? "text-[oklch(0.65_0.2_20)]" : "text-[oklch(0.78_0.15_75)]"
              }`} />
              <p className={`text-xs leading-relaxed ${
                p.severity === "high" ? "text-[oklch(0.65_0.2_20)]" : "text-[oklch(0.78_0.15_75)]"
              }`}>
                {ja ? "検出: " : "Detected: "}<span className="font-semibold">{p.label}</span>
              </p>
            </div>
          ))}
        </div>
      )}
      {noPatterns && (
        <div className="flex gap-2 p-2.5 rounded-lg bg-[oklch(0.15_0.04_145)] border border-[oklch(0.72_0.18_145/0.2)]">
          <span className="text-[oklch(0.72_0.18_145)] text-xs shrink-0 mt-0.5">✓</span>
          <p className="text-xs text-[oklch(0.72_0.18_145)] leading-relaxed">
            {ja
              ? "問題のあるトレードパターンは検出されませんでした。安定したトレード品質を維持しています。"
              : "No problematic trade patterns detected. Trade quality is stable."
            }
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ==================== Win/Loss Distribution ====================

export function WinLossDistributionPanel({ data }: { data: WinLossDistribution }) {
  const { language } = useLanguage();
  const ja = language === "ja";

  if (data.buckets.length === 0) return null;

  const chartData = data.buckets.map(b => ({
    label: b.rangeLabel,
    count: b.count,
    isWin: b.isWin,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-1 uppercase tracking-wider flex items-center gap-2">
        <TrendingDown className="w-4 h-4 text-[oklch(0.65_0.18_250)]" />
        {ja ? "損益分布" : "Profit/Loss Distribution"}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        {ja
          ? `トレード損益の分布を表示します。歪度: ${data.skewness.toFixed(2)}（正の値=右寄り=良好、負の値=左寄り=注意）`
          : `Distribution of trade P/L. Skewness: ${data.skewness.toFixed(2)} (positive=right-skewed=good, negative=left-skewed=caution)`
        }
      </p>

      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.02 260)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "oklch(0.5 0.02 260)", fontSize: 9 }}
              interval="preserveStartEnd"
              axisLine={{ stroke: "oklch(0.2 0.02 260)" }}
            />
            <YAxis
              tick={{ fill: "oklch(0.5 0.02 260)", fontSize: 10 }}
              axisLine={{ stroke: "oklch(0.2 0.02 260)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.15 0.02 260)",
                border: "1px solid oklch(0.25 0.02 260)",
                borderRadius: "6px",
                fontSize: "12px",
                color: "oklch(0.9 0 0)",
              }}
              formatter={(value: number) => [value, ja ? "件数" : "Count"]}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isWin ? "oklch(0.55 0.15 145)" : "oklch(0.5 0.15 20)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Skewness Indicator */}
      <div className="mt-3 flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground">{ja ? "歪度" : "Skewness"}:</span>
        <div className="flex-1 h-1.5 bg-[oklch(0.2_0.02_260)] rounded relative">
          <div
            className="absolute top-0 h-full w-1.5 rounded"
            style={{
              left: `${Math.max(0, Math.min(100, 50 + data.skewness * 15))}%`,
              backgroundColor: data.skewness >= 0 ? "oklch(0.55 0.15 145)" : "oklch(0.5 0.15 20)",
            }}
          />
          <div className="absolute top-0 left-1/2 h-full w-px bg-[oklch(0.3_0.02_260)]" />
        </div>
        <span className={`text-xs font-mono ${data.skewness >= 0 ? "text-[oklch(0.72_0.18_145)]" : "text-[oklch(0.65_0.2_20)]"}`}>
          {data.skewness >= 0 ? "+" : ""}{data.skewness.toFixed(2)}
        </span>
      </div>

      {data.skewness < -0.5 && (
        <div className="mt-3 flex gap-2 p-2.5 rounded-lg bg-[oklch(0.15_0.04_20)] border border-[oklch(0.65_0.2_20/0.2)]">
          <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.65_0.2_20)] shrink-0 mt-0.5" />
          <p className="text-xs text-[oklch(0.65_0.2_20)] leading-relaxed">
            {ja
              ? "損益分布が左に偏っています。大きな損失がリターンを圧迫している可能性があります。損切りルールの厳格化を検討してください。"
              : "P/L distribution is left-skewed. Large losses may be dragging returns. Consider tightening stop-loss rules."
            }
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ==================== Low Quality Trade Impact ====================

export function LowQualityTradeImpactPanel({ data }: { data: LowQualityTradeImpact[] }) {
  const { language } = useLanguage();
  const ja = language === "ja";

  if (data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-1 uppercase tracking-wider flex items-center gap-2">
        <Trash2 className="w-4 h-4 text-[oklch(0.65_0.18_250)]" />
        {ja ? "低品質トレード影響分析" : "Low-Quality Trade Impact"}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        {ja
          ? "損益額が最も悪い（大きなマイナスの）トレードを除外した場合のメトリクス改善をシミュレーションします。「最悪」＝損益額の降順で最も損失が大きいトレードです。"
          : "Simulates metric improvement if the trades with the largest losses (most negative P&L) were removed. \"Worst\" = trades sorted by P&L ascending."
        }
      </p>

      {/* Scenario cards */}
      <div className="space-y-2 mb-4">
        {data.map((scenario, i) => {
          const pfChange = scenario.originalPF > 0
            ? ((scenario.newPF - scenario.originalPF) / scenario.originalPF * 100)
            : 0;
          const netChange = scenario.newNetProfit - scenario.originalNetProfit;

          return (
            <motion.div
              key={scenario.removedCount}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-[oklch(0.14_0.02_260)] rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground">
                  {ja
                    ? `最悪${scenario.removedCount}件を除外`
                    : `Remove worst ${scenario.removedCount} trades`
                  }
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  pfChange > 20 ? "bg-[oklch(0.72_0.18_145/0.15)] text-[oklch(0.72_0.18_145)]" : "bg-[oklch(0.3_0.02_260)] text-muted-foreground"
                }`}>
                  PF {pfChange >= 0 ? "+" : ""}{pfChange.toFixed(0)}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">PF</p>
                  <p className="text-xs font-mono">
                    <span className="text-muted-foreground">{scenario.originalPF >= 999 ? "999+" : scenario.originalPF.toFixed(2)}</span>
                    <span className="text-muted-foreground/50 mx-0.5">→</span>
                    <span className="text-[oklch(0.72_0.18_145)]">{scenario.newPF >= 999 ? "999+" : scenario.newPF.toFixed(2)}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{ja ? "期待値" : "Exp."}</p>
                  <p className="text-xs font-mono">
                    <span className="text-muted-foreground">{scenario.originalExpectancy.toFixed(1)}</span>
                    <span className="text-muted-foreground/50 mx-0.5">→</span>
                    <span className="text-[oklch(0.72_0.18_145)]">{scenario.newExpectancy.toFixed(1)}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{ja ? "純損益差" : "Net Δ"}</p>
                  <p className={`text-xs font-mono ${netChange >= 0 ? "text-[oklch(0.72_0.18_145)]" : "text-[oklch(0.65_0.2_20)]"}`}>
                    {netChange >= 0 ? "+" : ""}{netChange.toFixed(1)}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Worst trades detail */}
      {data.length > 0 && data[0].removedTrades.length > 0 && (() => {
        const lastScenario = data[data.length - 1];
        const worstTrades = lastScenario.removedTrades.slice(0, 5);
        const dayNames = ja
          ? ["日", "月", "火", "水", "木", "金", "土"]
          : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        return (
          <div className="border-t border-border pt-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-2">
              {ja ? "最悪トレード一覧（損益額が最も大きいマイナス順）" : "Worst Trades (sorted by largest loss)"}
            </p>
            <div className="space-y-1">
              {worstTrades.map((t, i) => (
                <div key={i} className="flex items-center text-xs gap-2">
                  <span className="text-muted-foreground font-mono text-[10px] w-16 shrink-0">
                    {t.time.toLocaleDateString(ja ? "ja-JP" : "en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="text-muted-foreground/60 font-mono text-[10px] w-5 shrink-0">
                    {dayNames[t.time.getDay()]}
                  </span>
                  <span className="text-muted-foreground/60 font-mono text-[10px] w-10 shrink-0">
                    {t.time.getHours().toString().padStart(2, "0")}:{t.time.getMinutes().toString().padStart(2, "0")}
                  </span>
                  <span className="text-muted-foreground text-[10px] flex-1">{t.symbol}</span>
                  <span className="text-muted-foreground/60 font-mono text-[10px] w-10 text-right shrink-0">
                    {t.lots.toFixed(2)}
                  </span>
                  <span className="text-[oklch(0.65_0.2_20)] font-mono text-[10px] w-20 text-right shrink-0">{t.profit.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Common pattern analysis & actionable advice */}
      {data.some(s => s.originalPF > 0 && s.newPF > s.originalPF * 1.3) && (() => {
        const bestScenario = data.find(s => s.originalPF > 0 && s.newPF > s.originalPF * 1.3)!;
        const p = bestScenario.commonPattern;
        const patternParts: string[] = [];
        if (ja) {
          if (p.dominantSymbol) patternParts.push(`通貨ペア「${p.dominantSymbol.symbol}」が${p.dominantSymbol.count}/${p.dominantSymbol.total}件`);
          if (p.dominantDay) patternParts.push(`${p.dominantDay.day}曜日が${p.dominantDay.count}/${p.dominantDay.total}件`);
          if (p.dominantHour) patternParts.push(`${p.dominantHour.hour}時台が${p.dominantHour.count}/${p.dominantHour.total}件`);
        } else {
          if (p.dominantSymbol) patternParts.push(`${p.dominantSymbol.symbol}: ${p.dominantSymbol.count}/${p.dominantSymbol.total}`);
          if (p.dominantDay) patternParts.push(`${p.dominantDay.day}: ${p.dominantDay.count}/${p.dominantDay.total}`);
          if (p.dominantHour) patternParts.push(`${p.dominantHour.hour}:00 hour: ${p.dominantHour.count}/${p.dominantHour.total}`);
        }

        return (
          <div className="mt-3 flex gap-2 p-2.5 rounded-lg bg-[oklch(0.15_0.04_75)] border border-[oklch(0.78_0.15_75/0.2)]">
            <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.78_0.15_75)] shrink-0 mt-0.5" />
            <div className="text-xs text-[oklch(0.78_0.15_75)] leading-relaxed space-y-1">
              <p>
                {ja
                  ? `最悪${bestScenario.removedCount}件を除外するとPFが${bestScenario.originalPF.toFixed(2)}→${bestScenario.newPF.toFixed(2)}に改善されます。`
                  : `Removing the worst ${bestScenario.removedCount} trades would improve PF from ${bestScenario.originalPF.toFixed(2)} to ${bestScenario.newPF.toFixed(2)}.`
                }
              </p>
              {patternParts.length > 0 && (
                <p className="font-semibold">
                  {ja ? "共通パターン: " : "Common patterns: "}
                  {patternParts.join(ja ? "、" : ", ")}
                </p>
              )}
              {patternParts.length > 0 ? (
                <p>
                  {ja
                    ? `これらの条件でのエントリーを避けるか、ロットを下げることで損失を軽減できます。下部の「改善提案」セクションにも具体的なフィルター案が記載されています。`
                    : `Avoid entries under these conditions or reduce lot size. See the "Improvement Suggestions" section below for specific filter recommendations.`
                  }
                </p>
              ) : (
                <p>
                  {ja
                    ? "共通パターンが明確ではありません。最悪トレード一覧の日時・通貨ペアを個別に確認し、エントリー時の判断基準を見直してください。下部の「改善提案」セクションも参照してください。"
                    : "No clear common pattern. Review each worst trade's date/symbol individually. See the \"Improvement Suggestions\" section for actionable recommendations."
                  }
                </p>
              )}
            </div>
          </div>
        );
      })()}
    </motion.div>
  );
}
