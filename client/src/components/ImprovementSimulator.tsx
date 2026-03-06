/**
 * ImprovementSimulator.tsx
 * Design: Trading Terminal Dark UI (Bloomberg-inspired)
 * Purpose: Interactive sliders to simulate "what if" improvements
 * - Win rate delta
 * - Stop loss tightening
 * - Take profit widening
 * Shows real-time recalculated PF, expectancy, net profit delta
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Sliders, TrendingUp, TrendingDown, Minus, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { runImprovementSimulation, type PerformanceMetrics, type SimulationResult } from "@/lib/analysis";
import type { TradeRecord } from "@/lib/csvParser";

interface Props {
  metrics: PerformanceMetrics;
  trades: TradeRecord[];
}

export function ImprovementSimulator({ metrics, trades }: Props) {
  const { language } = useLanguage();
  const ja = language === "ja";

  const [winRateDelta, setWinRateDelta] = useState(0);
  const [stopLossDelta, setStopLossDelta] = useState(0);
  const [takeProfitDelta, setTakeProfitDelta] = useState(0);

  const result: SimulationResult = useMemo(() => {
    return runImprovementSimulation(trades, metrics, {
      winRateDelta,
      stopLossDelta,
      takeProfitDelta,
    });
  }, [trades, metrics, winRateDelta, stopLossDelta, takeProfitDelta]);

  const hasChanges = winRateDelta !== 0 || stopLossDelta !== 0 || takeProfitDelta !== 0;

  const reset = () => {
    setWinRateDelta(0);
    setStopLossDelta(0);
    setTakeProfitDelta(0);
  };

  const deltaColor = (val: number) =>
    val > 0 ? "text-[oklch(0.72_0.18_145)]" : val < 0 ? "text-[oklch(0.65_0.2_20)]" : "text-muted-foreground";

  const formatDelta = (val: number, suffix = "") => {
    if (val > 0) return `+${val.toFixed(2)}${suffix}`;
    if (val < 0) return `${val.toFixed(2)}${suffix}`;
    return `0${suffix}`;
  };

  const DeltaIcon = ({ val }: { val: number }) => {
    if (val > 0) return <TrendingUp className="w-3.5 h-3.5 text-[oklch(0.72_0.18_145)]" />;
    if (val < 0) return <TrendingDown className="w-3.5 h-3.5 text-[oklch(0.65_0.2_20)]" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[oklch(0.65_0.18_250)]" />
          {ja ? "改善シミュレーター" : "Improvement Simulator"}
        </h3>
        {hasChanges && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            {ja ? "リセット" : "Reset"}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
        {ja
          ? "スライダーを動かして「もし改善したら？」をシミュレーションできます。現在の取引データをもとにリアルタイムで再計算します。"
          : "Adjust sliders to simulate 'what if' improvements. Recalculated in real-time based on your trade data."}
      </p>

      {/* Sliders */}
      <div className="space-y-6 mb-6">
        {/* Win Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">
              {ja ? "勝率の変化" : "Win Rate Change"}
            </span>
            <span className={`text-xs font-mono font-semibold ${winRateDelta === 0 ? "text-muted-foreground" : winRateDelta > 0 ? "text-[oklch(0.72_0.18_145)]" : "text-[oklch(0.65_0.2_20)]"}`}>
              {formatDelta(winRateDelta, "%")}
              <span className="text-muted-foreground ml-1">
                ({ja ? "現在" : "now"}: {metrics.winRate.toFixed(1)}% → {result.newWinRate.toFixed(1)}%)
              </span>
            </span>
          </div>
          <Slider
            min={-20}
            max={20}
            step={1}
            value={[winRateDelta]}
            onValueChange={([v]) => setWinRateDelta(v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>-20%</span>
            <span>0</span>
            <span>+20%</span>
          </div>
        </div>

        {/* Stop Loss */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">
              {ja ? "損切り幅の変化" : "Stop Loss Change"}
            </span>
            <span className={`text-xs font-mono font-semibold ${stopLossDelta === 0 ? "text-muted-foreground" : stopLossDelta < 0 ? "text-[oklch(0.72_0.18_145)]" : "text-[oklch(0.65_0.2_20)]"}`}>
              {formatDelta(stopLossDelta, "%")}
            </span>
          </div>
          <Slider
            min={-50}
            max={50}
            step={5}
            value={[stopLossDelta]}
            onValueChange={([v]) => setStopLossDelta(v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>{ja ? "-50%（縮小）" : "-50% (tighter)"}</span>
            <span>0</span>
            <span>{ja ? "+50%（拡大）" : "+50% (wider)"}</span>
          </div>
        </div>

        {/* Take Profit */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">
              {ja ? "利確幅の変化" : "Take Profit Change"}
            </span>
            <span className={`text-xs font-mono font-semibold ${takeProfitDelta === 0 ? "text-muted-foreground" : takeProfitDelta > 0 ? "text-[oklch(0.72_0.18_145)]" : "text-[oklch(0.65_0.2_20)]"}`}>
              {formatDelta(takeProfitDelta, "%")}
            </span>
          </div>
          <Slider
            min={-50}
            max={50}
            step={5}
            value={[takeProfitDelta]}
            onValueChange={([v]) => setTakeProfitDelta(v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>{ja ? "-50%（縮小）" : "-50% (tighter)"}</span>
            <span>0</span>
            <span>{ja ? "+50%（拡大）" : "+50% (wider)"}</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
          {ja ? "シミュレーション結果" : "Simulation Results"}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* PF */}
          <div className="bg-[oklch(0.14_0.02_260)] rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-1">
              {ja ? "プロフィットファクター" : "Profit Factor"}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-mono font-bold text-foreground">
                {result.newProfitFactor >= 999 ? "999+" : result.newProfitFactor.toFixed(2)}
              </span>
              <DeltaIcon val={result.newProfitFactor - metrics.profitFactor} />
              <span className={`text-xs font-mono ${deltaColor(result.newProfitFactor - metrics.profitFactor)}`}>
                {formatDelta(result.newProfitFactor - metrics.profitFactor)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {ja ? "現在" : "Now"}: {metrics.profitFactor >= 999 ? "999+" : metrics.profitFactor.toFixed(2)}
            </p>
          </div>

          {/* RR */}
          <div className="bg-[oklch(0.14_0.02_260)] rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-1">
              {ja ? "リスクリワード比" : "Risk/Reward"}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-mono font-bold text-foreground">
                {result.newRiskReward >= 999 ? "999+" : result.newRiskReward.toFixed(2)}
              </span>
              <DeltaIcon val={result.newRiskReward - metrics.riskReward} />
              <span className={`text-xs font-mono ${deltaColor(result.newRiskReward - metrics.riskReward)}`}>
                {formatDelta(result.newRiskReward - metrics.riskReward)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {ja ? "現在" : "Now"}: {metrics.riskReward.toFixed(2)}
            </p>
          </div>

          {/* Expectancy */}
          <div className="bg-[oklch(0.14_0.02_260)] rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-1">
              {ja ? "期待値（1トレード）" : "Expectancy / Trade"}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-mono font-bold text-foreground">
                {result.newExpectancy.toFixed(2)}
              </span>
              <DeltaIcon val={result.newExpectancy - metrics.expectancy} />
              <span className={`text-xs font-mono ${deltaColor(result.newExpectancy - metrics.expectancy)}`}>
                {formatDelta(result.newExpectancy - metrics.expectancy)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {ja ? "現在" : "Now"}: {metrics.expectancy.toFixed(2)}
            </p>
          </div>

          {/* Net Profit Delta */}
          <div className={`rounded-lg p-3 ${result.netProfitDelta >= 0 ? "bg-[oklch(0.15_0.04_145)]" : "bg-[oklch(0.15_0.04_20)]"}`}>
            <p className="text-[10px] text-muted-foreground mb-1">
              {ja ? "損益の変化（推定）" : "Net Profit Change"}
            </p>
            <div className="flex items-center gap-1.5">
              <span className={`text-lg font-mono font-bold ${result.netProfitDelta >= 0 ? "text-[oklch(0.72_0.18_145)]" : "text-[oklch(0.65_0.2_20)]"}`}>
                {formatDelta(result.netProfitDelta)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {result.netProfitDeltaPercent >= 0 ? "+" : ""}{result.netProfitDeltaPercent.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Insight message */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 p-3 rounded-lg border text-xs leading-relaxed ${
              result.netProfitDelta >= 0
                ? "border-[oklch(0.72_0.18_145/0.3)] bg-[oklch(0.15_0.04_145)] text-[oklch(0.72_0.18_145)]"
                : "border-[oklch(0.65_0.2_20/0.3)] bg-[oklch(0.15_0.04_20)] text-[oklch(0.65_0.2_20)]"
            }`}
          >
            {result.netProfitDelta >= 0 ? (
              ja
                ? `この改善により、同じ${trades.length}トレードで約 ${result.netProfitDelta.toFixed(2)} の増益が見込まれます（+${result.netProfitDeltaPercent.toFixed(1)}%）。`
                : `With these improvements, an estimated +${result.netProfitDelta.toFixed(2)} additional profit is expected over ${trades.length} trades (+${result.netProfitDeltaPercent.toFixed(1)}%).`
            ) : (
              ja
                ? `この変更により、同じ${trades.length}トレードで約 ${Math.abs(result.netProfitDelta).toFixed(2)} の減益が予測されます（${result.netProfitDeltaPercent.toFixed(1)}%）。`
                : `These changes would result in approximately ${Math.abs(result.netProfitDelta).toFixed(2)} less profit over ${trades.length} trades (${result.netProfitDeltaPercent.toFixed(1)}%).`
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
