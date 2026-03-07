import type { TradeRecord } from "./csvParser";
import type { Language } from "@/contexts/LanguageContext";

// ==================== Day of Week Analysis ====================

export interface DayOfWeekAnalysis {
  day: string;
  dayIndex: number; // 0=Sun, 1=Mon...
  trades: number;
  winRate: number;
  profitFactor: number;
  netProfit: number;
  avgProfit: number;
}

export function analyzeByDayOfWeek(trades: TradeRecord[], lang: Language = "ja"): DayOfWeekAnalysis[] {
  const dayNames = lang === "ja"
    ? ["日", "月", "火", "水", "木", "金", "土"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return dayNames.map((day, dayIndex) => {
    const dayTrades = trades.filter(t => t.time.getDay() === dayIndex);
    if (dayTrades.length === 0) {
      return { day, dayIndex, trades: 0, winRate: 0, profitFactor: 0, netProfit: 0, avgProfit: 0 };
    }
    const wins = dayTrades.filter(t => t.profit > 0);
    const losses = dayTrades.filter(t => t.profit < 0);
    const totalProfit = wins.reduce((s, t) => s + t.profit, 0);
    const totalLoss = Math.abs(losses.reduce((s, t) => s + t.profit, 0));
    const netProfit = dayTrades.reduce((s, t) => s + t.profit, 0);
    return {
      day,
      dayIndex,
      trades: dayTrades.length,
      winRate: (wins.length / dayTrades.length) * 100,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0,
      netProfit,
      avgProfit: netProfit / dayTrades.length,
    };
  }).filter(d => d.trades > 0);
}

// ==================== Lot Size Correlation ====================

export interface LotSizeGroup {
  label: string;
  minLot: number;
  maxLot: number;
  trades: number;
  winRate: number;
  profitFactor: number;
  netProfit: number;
  avgProfit: number;
}

export function analyzeLotSizeCorrelation(trades: TradeRecord[], lang: Language = "ja"): LotSizeGroup[] {
  const lotsWithProfit = trades.filter(t => t.lots > 0);
  if (lotsWithProfit.length === 0) return [];

  const lots = lotsWithProfit.map(t => t.lots);
  const minLot = Math.min(...lots);
  const maxLot = Math.max(...lots);

  if (minLot === maxLot) {
    // All same lot size
    const wins = lotsWithProfit.filter(t => t.profit > 0);
    const losses = lotsWithProfit.filter(t => t.profit < 0);
    const totalProfit = wins.reduce((s, t) => s + t.profit, 0);
    const totalLoss = Math.abs(losses.reduce((s, t) => s + t.profit, 0));
    const netProfit = lotsWithProfit.reduce((s, t) => s + t.profit, 0);
    const label = lang === "ja" ? `${minLot}ロット（全て同一）` : `${minLot} lot (uniform)`;
    return [{
      label, minLot, maxLot,
      trades: lotsWithProfit.length,
      winRate: (wins.length / lotsWithProfit.length) * 100,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0,
      netProfit,
      avgProfit: netProfit / lotsWithProfit.length,
    }];
  }

  // Divide into 3 groups: small, medium, large
  const p33 = minLot + (maxLot - minLot) * 0.33;
  const p67 = minLot + (maxLot - minLot) * 0.67;

  const groups = [
    { label: lang === "ja" ? "小ロット" : "Small Lot", minLot, maxLot: p33 },
    { label: lang === "ja" ? "中ロット" : "Mid Lot", minLot: p33, maxLot: p67 },
    { label: lang === "ja" ? "大ロット" : "Large Lot", minLot: p67, maxLot: maxLot + 0.001 },
  ];

  return groups.map(g => {
    const groupTrades = lotsWithProfit.filter(t => t.lots >= g.minLot && t.lots < g.maxLot);
    if (groupTrades.length === 0) return null;
    const wins = groupTrades.filter(t => t.profit > 0);
    const losses = groupTrades.filter(t => t.profit < 0);
    const totalProfit = wins.reduce((s, t) => s + t.profit, 0);
    const totalLoss = Math.abs(losses.reduce((s, t) => s + t.profit, 0));
    const netProfit = groupTrades.reduce((s, t) => s + t.profit, 0);
    return {
      label: g.label,
      minLot: g.minLot,
      maxLot: g.maxLot,
      trades: groupTrades.length,
      winRate: (wins.length / groupTrades.length) * 100,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0,
      netProfit,
      avgProfit: netProfit / groupTrades.length,
    };
  }).filter((g): g is LotSizeGroup => g !== null);
}

// ==================== Trade Quality Analysis ====================

export interface TradeQualityAnalysis {
  avgWinAmount: number;
  avgLossAmount: number;
  medianWin: number;
  medianLoss: number;
  winStdDev: number;
  lossStdDev: number;
  consistencyScore: number;     // 0-100
  profitConcentration: number;  // % of total profit from top 20% wins
  lossConcentration: number;    // % of total loss from worst 20% losses
  qualityScore: number;         // 0-100
  qualityGrade: string;         // A/B/C/D/F
  isKotsuKotsuDokan: boolean;   // many small wins, few large losses
  isLargeWinDependent: boolean; // over-reliance on rare big wins
  hasLateSL: boolean;           // avg loss >> avg profit
  hasEarlyTP: boolean;          // median win << avg win
}

export interface WinLossDistributionBucket {
  rangeLabel: string;
  rangeMin: number;
  rangeMax: number;
  count: number;
  isWin: boolean;
}

export interface WinLossDistribution {
  buckets: WinLossDistributionBucket[];
  skewness: number;
}

export interface LowQualityTradeImpact {
  removedCount: number;
  originalPF: number;
  newPF: number;
  originalNetProfit: number;
  newNetProfit: number;
  originalWinRate: number;
  newWinRate: number;
  originalExpectancy: number;
  newExpectancy: number;
  removedTrades: { index: number; profit: number; symbol: string; time: Date }[];
}

// Helper: median of an array of numbers
function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Helper: standard deviation (population — we have all trades, not a sample)
function stdDev(arr: number[]): number {
  if (arr.length <= 1) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

export function analyzeTradeQuality(trades: TradeRecord[]): TradeQualityAnalysis {
  const defaultResult: TradeQualityAnalysis = {
    avgWinAmount: 0, avgLossAmount: 0, medianWin: 0, medianLoss: 0,
    winStdDev: 0, lossStdDev: 0, consistencyScore: 50,
    profitConcentration: 0, lossConcentration: 0,
    qualityScore: 50, qualityGrade: "C",
    isKotsuKotsuDokan: false, isLargeWinDependent: false, hasLateSL: false, hasEarlyTP: false,
  };

  if (trades.length === 0) return defaultResult;

  const winAmounts = trades.filter(t => t.profit > 0).map(t => t.profit);
  const lossAmounts = trades.filter(t => t.profit < 0).map(t => Math.abs(t.profit));

  // All wins or all losses — return basic stats without pattern detection
  if (winAmounts.length === 0 || lossAmounts.length === 0) {
    const amounts = winAmounts.length > 0 ? winAmounts : lossAmounts;
    const avg = amounts.length > 0 ? amounts.reduce((s, v) => s + v, 0) / amounts.length : 0;
    return {
      ...defaultResult,
      avgWinAmount: winAmounts.length > 0 ? avg : 0,
      avgLossAmount: lossAmounts.length > 0 ? avg : 0,
      medianWin: winAmounts.length > 0 ? median(amounts) : 0,
      medianLoss: lossAmounts.length > 0 ? median(amounts) : 0,
      winStdDev: winAmounts.length > 0 ? stdDev(amounts) : 0,
      lossStdDev: lossAmounts.length > 0 ? stdDev(amounts) : 0,
    };
  }

  const avgWin = winAmounts.reduce((s, v) => s + v, 0) / winAmounts.length;
  const avgLoss = lossAmounts.reduce((s, v) => s + v, 0) / lossAmounts.length;
  const medWin = median(winAmounts);
  const medLoss = median(lossAmounts);
  const winSD = stdDev(winAmounts);
  const lossSD = stdDev(lossAmounts);

  // Profit concentration: % of total profit from top 20% of wins
  const sortedWins = [...winAmounts].sort((a, b) => b - a);
  const top20Count = Math.max(1, Math.ceil(winAmounts.length * 0.2));
  const top20Profit = sortedWins.slice(0, top20Count).reduce((s, v) => s + v, 0);
  const totalWinProfit = winAmounts.reduce((s, v) => s + v, 0);
  const profitConcentration = totalWinProfit > 0 ? (top20Profit / totalWinProfit) * 100 : 0;

  // Loss concentration: % of total loss from worst 20% of losses
  const sortedLosses = [...lossAmounts].sort((a, b) => b - a);
  const top20LossCount = Math.max(1, Math.ceil(lossAmounts.length * 0.2));
  const top20Loss = sortedLosses.slice(0, top20LossCount).reduce((s, v) => s + v, 0);
  const totalLossAmt = lossAmounts.reduce((s, v) => s + v, 0);
  const lossConcentration = totalLossAmt > 0 ? (top20Loss / totalLossAmt) * 100 : 0;

  // Consistency score (lower CV = more consistent = higher score)
  const winCV = avgWin > 0 ? winSD / avgWin : 0;
  const lossCV = avgLoss > 0 ? lossSD / avgLoss : 0;
  const avgCV = (winCV + lossCV) / 2;
  const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - avgCV * 50)));

  // Pattern detection
  const isKotsuKotsuDokan = medWin < avgLoss * 0.5 && lossConcentration > 50;
  const isLargeWinDependent = profitConcentration > 70;
  const hasLateSL = avgLoss > avgWin * 2 && lossAmounts.length >= 1;
  const hasEarlyTP = winAmounts.length >= 5 && medWin < avgWin * 0.5;

  // Quality score (composite)
  let qualityScore = 50;
  qualityScore += (consistencyScore - 50) * 0.3;
  qualityScore -= Math.max(0, profitConcentration - 50) * 0.2;
  qualityScore -= Math.max(0, lossConcentration - 50) * 0.2;
  if (isKotsuKotsuDokan) qualityScore -= 15;
  if (isLargeWinDependent) qualityScore -= 10;
  if (hasLateSL) qualityScore -= 10;
  if (hasEarlyTP) qualityScore -= 5;
  qualityScore = Math.max(0, Math.min(100, Math.round(qualityScore)));

  const qualityGrade = qualityScore >= 80 ? "A" : qualityScore >= 60 ? "B"
    : qualityScore >= 40 ? "C" : qualityScore >= 20 ? "D" : "F";

  return {
    avgWinAmount: avgWin, avgLossAmount: avgLoss,
    medianWin: medWin, medianLoss: medLoss,
    winStdDev: winSD, lossStdDev: lossSD,
    consistencyScore, profitConcentration, lossConcentration,
    qualityScore, qualityGrade,
    isKotsuKotsuDokan, isLargeWinDependent, hasLateSL, hasEarlyTP,
  };
}

export function calculateWinLossDistribution(trades: TradeRecord[]): WinLossDistribution {
  if (trades.length === 0) return { buckets: [], skewness: 0 };

  const profits = trades.map(t => t.profit);
  const minP = Math.min(...profits);
  const maxP = Math.max(...profits);
  const range = maxP - minP;
  if (range <= 0) return { buckets: [], skewness: 0 };

  const numBuckets = Math.min(20, Math.max(8, Math.ceil(Math.sqrt(trades.length))));
  const bucketSize = range / numBuckets;

  const buckets: WinLossDistributionBucket[] = [];
  for (let i = 0; i < numBuckets; i++) {
    const start = minP + i * bucketSize;
    const end = start + bucketSize;
    const count = profits.filter(p => i === numBuckets - 1 ? (p >= start && p <= end) : (p >= start && p < end)).length;
    const midpoint = (start + end) / 2;
    buckets.push({
      rangeLabel: `${start >= 0 ? "+" : ""}${start.toFixed(0)}`,
      rangeMin: start,
      rangeMax: end,
      count,
      isWin: midpoint >= 0,
    });
  }

  // Skewness
  const mean = profits.reduce((s, v) => s + v, 0) / profits.length;
  const sd = stdDev(profits);
  const skewness = sd > 0
    ? profits.reduce((s, v) => s + ((v - mean) / sd) ** 3, 0) / profits.length
    : 0;

  return { buckets, skewness };
}

export function analyzeLowQualityTradeImpact(
  trades: TradeRecord[],
  metrics: PerformanceMetrics
): LowQualityTradeImpact[] {
  if (trades.length < 5) return [];

  const indexed = trades.map((t, i) => ({ ...t, originalIndex: i }));
  const sortedByProfit = [...indexed].sort((a, b) => a.profit - b.profit);

  const maxRemoval = Math.floor(trades.length * 0.2);
  const scenarios = [1, 3, 5, 10].filter(n => n <= maxRemoval && n < trades.length);

  return scenarios.map(n => {
    const worstN = sortedByProfit.slice(0, n);
    const worstSet = new Set(worstN.map(t => t.originalIndex));
    const remaining = trades.filter((_, i) => !worstSet.has(i));

    const newM = calculateMetrics(remaining);

    return {
      removedCount: n,
      originalPF: metrics.profitFactor,
      newPF: newM.profitFactor,
      originalNetProfit: metrics.netProfit,
      newNetProfit: newM.netProfit,
      originalWinRate: metrics.winRate,
      newWinRate: newM.winRate,
      originalExpectancy: metrics.expectancy,
      newExpectancy: newM.expectancy,
      removedTrades: worstN.map(t => ({
        index: t.originalIndex,
        profit: t.profit,
        symbol: t.symbol,
        time: t.time,
      })),
    };
  });
}

// ==================== Improvement Simulation ====================

export interface SimulationParams {
  winRateDelta: number;    // +/- percentage points e.g. +5 means winRate+5%
  stopLossDelta: number;   // +/- percentage e.g. -20 means SL 20% tighter
  takeProfitDelta: number; // +/- percentage e.g. +20 means TP 20% wider
}

export interface SimulationResult {
  params: SimulationParams;
  newWinRate: number;
  newProfitFactor: number;
  newExpectancy: number;
  newNetProfit: number;
  netProfitDelta: number;
  netProfitDeltaPercent: number;
  newRiskReward: number;
}

export function runImprovementSimulation(
  trades: TradeRecord[],
  metrics: PerformanceMetrics,
  params: SimulationParams
): SimulationResult {
  const { winRateDelta, stopLossDelta, takeProfitDelta } = params;

  // Adjust avg profit/loss based on TP/SL changes
  const slMultiplier = 1 + stopLossDelta / 100;   // e.g. -20% → 0.8
  const tpMultiplier = 1 + takeProfitDelta / 100;  // e.g. +20% → 1.2

  const newAvgProfit = metrics.avgProfit * tpMultiplier;
  const newAvgLoss = metrics.avgLoss * slMultiplier;

  // Adjust win rate
  const newWinRate = Math.max(0, Math.min(100, metrics.winRate + winRateDelta));
  const newWinRateFrac = newWinRate / 100;
  const newLossRateFrac = 1 - newWinRateFrac;

  // Calculate new metrics
  const newExpectancy = newWinRateFrac * newAvgProfit - newLossRateFrac * newAvgLoss;
  const newProfitFactor = (newAvgLoss > 0 && newLossRateFrac > 0)
    ? (newWinRateFrac * newAvgProfit) / (newLossRateFrac * newAvgLoss)
    : newAvgProfit > 0 ? 999 : 0;
  const newRiskReward = newAvgLoss > 0 ? newAvgProfit / newAvgLoss : newAvgProfit > 0 ? 999 : 0;
  const newNetProfit = newExpectancy * trades.length;
  const netProfitDelta = newNetProfit - metrics.netProfit;
  const netProfitDeltaPercent = metrics.netProfit !== 0
    ? (netProfitDelta / Math.abs(metrics.netProfit)) * 100
    : 0;

  return {
    params,
    newWinRate,
    newProfitFactor: Math.min(newProfitFactor, 999),
    newExpectancy,
    newNetProfit,
    netProfitDelta,
    netProfitDeltaPercent,
    newRiskReward: Math.min(newRiskReward, 999),
  };
}

// ==================== Types ====================

export interface PerformanceMetrics {
  totalTrades: number;
  winRate: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
  riskReward: number;
  expectancy: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  maxConsecutiveLosses: number;
  totalProfit: number;
  totalLoss: number;
  grossProfit: number;
  netProfit: number;
  winCount: number;
  lossCount: number;
  largestWin: number;
  largestLoss: number;
  avgHoldingPeriod: number;
}

export interface StrategyScore {
  total: number;
  pfScore: number;
  rrScore: number;
  expectancyScore: number;
  ddScore: number;
  grade: string;
  gradeColor: string;
}

export interface SymbolAnalysis {
  symbol: string;
  trades: number;
  winRate: number;
  profitFactor: number;
  riskReward: number;
  netProfit: number;
  avgProfit: number;
}

export interface TimeSlotAnalysis {
  slot: string;
  hour: number;
  trades: number;
  winRate: number;
  profitFactor: number;
  netProfit: number;
}

export interface WeaknessItem {
  category: string;
  target: string;
  issue: string;
  severity: "high" | "medium" | "low";
  metric: string;
  value: number;
}

export interface ImprovementSuggestion {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
}

export interface EquityCurvePoint {
  index: number;
  equity: number;
  drawdown: number;     // absolute drawdown from peak
  drawdownPct: number; // drawdown as % of peak (capped at 100%)
  time: Date;
}

// ==================== Calculations ====================

export function calculateMetrics(trades: TradeRecord[], initialBalance: number = 0): PerformanceMetrics {
  if (trades.length === 0) {
    return {
      totalTrades: 0, winRate: 0, avgProfit: 0, avgLoss: 0,
      profitFactor: 0, riskReward: 0, expectancy: 0,
      maxDrawdown: 0, maxDrawdownPercent: 0, maxConsecutiveLosses: 0,
      totalProfit: 0, totalLoss: 0, grossProfit: 0, netProfit: 0,
      winCount: 0, lossCount: 0, largestWin: 0, largestLoss: 0,
      avgHoldingPeriod: 0,
    };
  }

  const wins = trades.filter((t) => t.profit > 0);
  const losses = trades.filter((t) => t.profit < 0);

  const totalProfit = wins.reduce((sum, t) => sum + t.profit, 0);
  const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.profit, 0));
  const netProfit = trades.reduce((sum, t) => sum + t.profit, 0);

  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const avgProfit = wins.length > 0 ? totalProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLoss / losses.length : 0;
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
  const riskReward = avgLoss > 0 ? avgProfit / avgLoss : avgProfit > 0 ? Infinity : 0;
  const expectancy = trades.length > 0 ? netProfit / trades.length : 0;

  // Max drawdown (absolute and percentage)
  // Definition: largest drop from a running equity peak to a subsequent trough.
  // DDPercent = (peak - trough) / peak * 100, where peak includes initialBalance.
  // initialBalance represents the account's starting capital (e.g., 100,000).
  // Without it, DD% is calculated only relative to accumulated P/L, which
  // produces wildly inflated percentages.
  let peak = initialBalance;
  let equity = initialBalance;
  let maxDD = 0;
  let maxDDPercent = 0;
  let peakForMaxDD = initialBalance;

  for (const trade of trades) {
    equity += trade.profit;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDD) {
      maxDD = dd;
      peakForMaxDD = peak;
    }
  }

  if (maxDD > 0) {
    if (peakForMaxDD > 0) {
      maxDDPercent = (maxDD / peakForMaxDD) * 100;
    } else {
      maxDDPercent = 100;
    }
    maxDDPercent = Math.min(maxDDPercent, 100);
  }

  // Max consecutive losses
  let maxConsecLosses = 0;
  let currentConsecLosses = 0;
  for (const trade of trades) {
    if (trade.profit < 0) {
      currentConsecLosses++;
      maxConsecLosses = Math.max(maxConsecLosses, currentConsecLosses);
    } else {
      currentConsecLosses = 0;
    }
  }

  const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => t.profit)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map((t) => t.profit)) : 0;

  return {
    totalTrades: trades.length,
    winRate,
    avgProfit,
    avgLoss,
    profitFactor: profitFactor === Infinity ? 999 : profitFactor,
    riskReward: riskReward === Infinity ? 999 : riskReward,
    expectancy,
    maxDrawdown: maxDD,
    maxDrawdownPercent: maxDDPercent,
    maxConsecutiveLosses: maxConsecLosses,
    totalProfit,
    totalLoss,
    grossProfit: totalProfit,
    netProfit,
    winCount: wins.length,
    lossCount: losses.length,
    largestWin,
    largestLoss,
    avgHoldingPeriod: 0,
  };
}

// ==================== Strategy Score ====================

export function calculateStrategyScore(metrics: PerformanceMetrics): StrategyScore {
  // PF Score (0-25)
  let pfScore = 0;
  if (metrics.profitFactor >= 3) pfScore = 25;
  else if (metrics.profitFactor >= 2) pfScore = 20;
  else if (metrics.profitFactor >= 1.5) pfScore = 15;
  else if (metrics.profitFactor >= 1.2) pfScore = 10;
  else if (metrics.profitFactor >= 1) pfScore = 5;

  // RR Score (0-25)
  let rrScore = 0;
  if (metrics.riskReward >= 3) rrScore = 25;
  else if (metrics.riskReward >= 2) rrScore = 20;
  else if (metrics.riskReward >= 1.5) rrScore = 15;
  else if (metrics.riskReward >= 1) rrScore = 10;
  else if (metrics.riskReward >= 0.5) rrScore = 5;

  // Expectancy Score (0-25)
  let expectancyScore = 0;
  if (metrics.expectancy > 0) {
    const expRatio = metrics.avgLoss > 0 ? metrics.expectancy / metrics.avgLoss : 0;
    if (expRatio >= 0.5) expectancyScore = 25;
    else if (expRatio >= 0.3) expectancyScore = 20;
    else if (expRatio >= 0.15) expectancyScore = 15;
    else if (expRatio >= 0.05) expectancyScore = 10;
    else expectancyScore = 5;
  }

  // DD Score (0-25) - lower DD = higher score
  let ddScore = 0;
  if (metrics.maxDrawdownPercent <= 5) ddScore = 25;
  else if (metrics.maxDrawdownPercent <= 10) ddScore = 20;
  else if (metrics.maxDrawdownPercent <= 20) ddScore = 15;
  else if (metrics.maxDrawdownPercent <= 30) ddScore = 10;
  else if (metrics.maxDrawdownPercent <= 50) ddScore = 5;

  const total = pfScore + rrScore + expectancyScore + ddScore;

  let grade: string;
  let gradeColor: string;
  if (total >= 85) { grade = "S"; gradeColor = "#FFD700"; }
  else if (total >= 70) { grade = "A"; gradeColor = "#00D4AA"; }
  else if (total >= 55) { grade = "B"; gradeColor = "#3B82F6"; }
  else if (total >= 40) { grade = "C"; gradeColor = "#F59E0B"; }
  else if (total >= 25) { grade = "D"; gradeColor = "#EF4444"; }
  else { grade = "F"; gradeColor = "#DC2626"; }

  return { total, pfScore, rrScore, expectancyScore, ddScore, grade, gradeColor };
}

// ==================== Symbol Analysis ====================

export function analyzeBySymbol(trades: TradeRecord[]): SymbolAnalysis[] {
  const groups = new Map<string, TradeRecord[]>();
  for (const t of trades) {
    const arr = groups.get(t.symbol) || [];
    arr.push(t);
    groups.set(t.symbol, arr);
  }

  return Array.from(groups.entries()).map(([symbol, symbolTrades]) => {
    const wins = symbolTrades.filter((t) => t.profit > 0);
    const losses = symbolTrades.filter((t) => t.profit < 0);
    const totalProfit = wins.reduce((s, t) => s + t.profit, 0);
    const totalLoss = Math.abs(losses.reduce((s, t) => s + t.profit, 0));
    const netProfit = symbolTrades.reduce((s, t) => s + t.profit, 0);

    return {
      symbol,
      trades: symbolTrades.length,
      winRate: symbolTrades.length > 0 ? (wins.length / symbolTrades.length) * 100 : 0,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0,
      riskReward: losses.length > 0 && wins.length > 0
        ? (totalProfit / wins.length) / (totalLoss / losses.length)
        : 0,
      netProfit,
      avgProfit: symbolTrades.length > 0 ? netProfit / symbolTrades.length : 0,
    };
  }).sort((a, b) => b.netProfit - a.netProfit);
}

// ==================== Time Slot Analysis ====================

export function analyzeByTimeSlot(trades: TradeRecord[]): TimeSlotAnalysis[] {
  const slots: TimeSlotAnalysis[] = [];

  for (let h = 0; h < 24; h += 3) {
    const slotTrades = trades.filter((t) => {
      const hour = t.time.getHours();
      return hour >= h && hour < h + 3;
    });

    if (slotTrades.length === 0) {
      slots.push({
        slot: `${String(h).padStart(2, "0")}:00-${String(h + 3).padStart(2, "0")}:00`,
        hour: h,
        trades: 0,
        winRate: 0,
        profitFactor: 0,
        netProfit: 0,
      });
      continue;
    }

    const wins = slotTrades.filter((t) => t.profit > 0);
    const losses = slotTrades.filter((t) => t.profit < 0);
    const totalProfit = wins.reduce((s, t) => s + t.profit, 0);
    const totalLoss = Math.abs(losses.reduce((s, t) => s + t.profit, 0));

    slots.push({
      slot: `${String(h).padStart(2, "0")}:00-${String(h + 3).padStart(2, "0")}:00`,
      hour: h,
      trades: slotTrades.length,
      winRate: (wins.length / slotTrades.length) * 100,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0,
      netProfit: slotTrades.reduce((s, t) => s + t.profit, 0),
    });
  }

  return slots;
}

// ==================== Weakness Analysis ====================

export function findWeaknesses(
  symbolAnalysis: SymbolAnalysis[],
  timeSlotAnalysis: TimeSlotAnalysis[],
  lang: Language = "ja"
): WeaknessItem[] {
  const weaknesses: WeaknessItem[] = [];
  const catSymbol = lang === "ja" ? "通貨ペア" : "Symbol";
  const catTime = lang === "ja" ? "時間帯" : "Time Slot";
  const metricWR = lang === "ja" ? "勝率" : "Win Rate";
  const lowLabel = lang === "ja" ? "と低い" : " is low";
  const wrLabel = lang === "ja" ? "勝率が" : "Win Rate ";

  for (const sa of symbolAnalysis) {
    if (sa.trades < 3) continue;
    if (sa.profitFactor < 0.9) {
      weaknesses.push({
        category: catSymbol,
        target: sa.symbol,
        issue: lang === "ja" ? `PFが${sa.profitFactor.toFixed(2)}${lowLabel}` : `PF is ${sa.profitFactor.toFixed(2)} (low)`,
        severity: sa.profitFactor < 0.5 ? "high" : "medium",
        metric: "PF",
        value: sa.profitFactor,
      });
    }
    if (sa.riskReward < 1) {
      weaknesses.push({
        category: catSymbol,
        target: sa.symbol,
        issue: lang === "ja" ? `RRが${sa.riskReward.toFixed(2)}${lowLabel}` : `RR is ${sa.riskReward.toFixed(2)} (low)`,
        severity: sa.riskReward < 0.5 ? "high" : "medium",
        metric: "RR",
        value: sa.riskReward,
      });
    }
    if (sa.winRate < 35) {
      weaknesses.push({
        category: catSymbol,
        target: sa.symbol,
        issue: lang === "ja" ? `${wrLabel}${sa.winRate.toFixed(1)}%${lowLabel}` : `${wrLabel}${sa.winRate.toFixed(1)}% (low)`,
        severity: sa.winRate < 25 ? "high" : "medium",
        metric: metricWR,
        value: sa.winRate,
      });
    }
  }

  for (const ts of timeSlotAnalysis) {
    if (ts.trades < 3) continue;
    if (ts.profitFactor < 0.9 && ts.profitFactor > 0) {
      weaknesses.push({
        category: catTime,
        target: ts.slot,
        issue: lang === "ja" ? `PFが${ts.profitFactor.toFixed(2)}${lowLabel}` : `PF is ${ts.profitFactor.toFixed(2)} (low)`,
        severity: ts.profitFactor < 0.5 ? "high" : "medium",
        metric: "PF",
        value: ts.profitFactor,
      });
    }
    if (ts.winRate < 35) {
      weaknesses.push({
        category: catTime,
        target: ts.slot,
        issue: lang === "ja" ? `${wrLabel}${ts.winRate.toFixed(1)}%${lowLabel}` : `${wrLabel}${ts.winRate.toFixed(1)}% (low)`,
        severity: ts.winRate < 25 ? "high" : "medium",
        metric: metricWR,
        value: ts.winRate,
      });
    }
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };
  weaknesses.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return weaknesses.slice(0, 10);
}

// ==================== Improvement Suggestions ====================

export function generateSuggestions(
  metrics: PerformanceMetrics,
  weaknesses: WeaknessItem[],
  lang: Language = "ja",
  tradeQuality?: TradeQualityAnalysis,
  lotSizeAnalysis?: LotSizeGroup[],
  dayOfWeekAnalysis?: DayOfWeekAnalysis[],
  timeSlotAnalysis?: TimeSlotAnalysis[],
  lowQualityImpact?: LowQualityTradeImpact[],
  trades?: TradeRecord[],
): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = [];

  if (metrics.profitFactor < 1.2) {
    suggestions.push({
      title: lang === "ja" ? "損切りルールの見直し" : "Review Stop-Loss Rules",
      description: lang === "ja"
        ? "Profit Factorが低いため、損切りラインを厳格化し、損失の拡大を防ぐことを検討してください。"
        : "Profit Factor is low. Consider tightening stop-loss levels to prevent losses from expanding.",
      priority: "high",
      category: lang === "ja" ? "リスク管理" : "Risk Management",
    });
  }

  if (metrics.riskReward < 1) {
    suggestions.push({
      title: lang === "ja" ? "利確ターゲットの拡大" : "Widen Take-Profit Targets",
      description: lang === "ja"
        ? "Risk Rewardが1未満のため、利確ポイントを広げるか、トレーリングストップの導入を検討してください。"
        : "Risk Reward is below 1. Consider widening take-profit points or introducing trailing stops.",
      priority: "high",
      category: lang === "ja" ? "エントリー/イグジット" : "Entry/Exit",
    });
  }

  if (metrics.winRate < 40) {
    suggestions.push({
      title: lang === "ja" ? "エントリー条件の精査" : "Refine Entry Conditions",
      description: lang === "ja"
        ? "勝率が低いため、エントリー条件にフィルターを追加し、より確度の高いセットアップに絞ることを推奨します。"
        : "Win rate is low. Add filters to entry conditions and focus on higher-probability setups.",
      priority: "high",
      category: lang === "ja" ? "エントリー/イグジット" : "Entry/Exit",
    });
  }

  if (metrics.maxDrawdownPercent > 30) {
    suggestions.push({
      title: lang === "ja" ? "ポジションサイズの縮小" : "Reduce Position Size",
      description: lang === "ja"
        ? "最大ドローダウンが大きいため、1トレードあたりのリスクを資金の1-2%に制限することを推奨します。"
        : "Max drawdown is large. Limit risk per trade to 1-2% of capital.",
      priority: "high",
      category: lang === "ja" ? "リスク管理" : "Risk Management",
    });
  }

  if (metrics.maxConsecutiveLosses >= 5) {
    suggestions.push({
      title: lang === "ja" ? "連敗時のルール設定" : "Set Losing Streak Rules",
      description: lang === "ja"
        ? `最大${metrics.maxConsecutiveLosses}連敗が発生しています。連敗時にロットを下げる、または一時休止するルールの導入を検討してください。`
        : `Max ${metrics.maxConsecutiveLosses} consecutive losses occurred. Consider reducing lot size or pausing during losing streaks.`,
      priority: "medium",
      category: lang === "ja" ? "メンタル管理" : "Mental Management",
    });
  }

  const catSymbol = lang === "ja" ? "通貨ペア" : "Symbol";
  const catTime = lang === "ja" ? "時間帯" : "Time Slot";
  const weakSymbols = weaknesses.filter((w) => w.category === catSymbol && w.severity === "high");
  if (weakSymbols.length > 0) {
    const symbols = Array.from(new Set(weakSymbols.map((w) => w.target)));
    suggestions.push({
      title: lang === "ja" ? "弱点通貨ペアの除外検討" : "Consider Excluding Weak Pairs",
      description: lang === "ja"
        ? `${symbols.join(", ")}のパフォーマンスが著しく低いため、これらの通貨ペアでのトレードを一時停止し、デモ口座で検証することを推奨します。`
        : `${symbols.join(", ")} show significantly low performance. Consider pausing trades on these pairs and testing on a demo account.`,
      priority: "medium",
      category: lang === "ja" ? "通貨ペア選定" : "Pair Selection",
    });
  }

  const weakTimes = weaknesses.filter((w) => w.category === catTime && w.severity === "high");
  if (weakTimes.length > 0) {
    const times = Array.from(new Set(weakTimes.map((w) => w.target)));
    suggestions.push({
      title: lang === "ja" ? "トレード時間帯の最適化" : "Optimize Trading Hours",
      description: lang === "ja"
        ? `${times.join(", ")}の時間帯でパフォーマンスが低下しています。この時間帯のトレードを避けるか、ロットを減らすことを検討してください。`
        : `Performance drops during ${times.join(", ")}. Consider avoiding trades during these hours or reducing lot size.`,
      priority: "medium",
      category: lang === "ja" ? "時間管理" : "Time Management",
    });
  }

  if (metrics.expectancy <= 0) {
    suggestions.push({
      title: lang === "ja" ? "戦略の根本的な見直し" : "Fundamental Strategy Review",
      description: lang === "ja"
        ? "期待値がマイナスのため、現在の戦略では長期的に資金が減少します。バックテストを含めた戦略の再構築を強く推奨します。"
        : "Expectancy is negative. The current strategy will lose capital over time. A full strategy rebuild including backtesting is strongly recommended.",
      priority: "high",
      category: lang === "ja" ? "戦略全体" : "Overall Strategy",
    });
  }

  // ========== Pattern 9: Kotsukotsu-Dokan Warning ==========
  if (tradeQuality?.isKotsuKotsuDokan) {
    suggestions.push({
      title: lang === "ja" ? "コツコツドカン警告" : "Small Wins / Large Losses Pattern",
      description: lang === "ja"
        ? `勝ちの中央値(${tradeQuality.medianWin.toFixed(2)})に対し平均損失(${tradeQuality.avgLossAmount.toFixed(2)})が大きく、少数の大きな負けがコツコツ積み上げた利益を帳消しにするパターンが検出されました。損切りラインを厳格化し、1回の損失額を制限してください。`
        : `Median win (${tradeQuality.medianWin.toFixed(2)}) vs avg loss (${tradeQuality.avgLossAmount.toFixed(2)}) shows a pattern where few large losses wipe out many small gains. Tighten stop-loss levels to limit per-trade loss.`,
      priority: "high",
      category: lang === "ja" ? "リスク管理" : "Risk Management",
    });
  }

  // ========== Pattern 10: Large Win Dependency ==========
  if (tradeQuality?.isLargeWinDependent) {
    suggestions.push({
      title: lang === "ja" ? "大勝ち依存の警告" : "Large Win Dependency Warning",
      description: lang === "ja"
        ? `利益の${tradeQuality.profitConcentration.toFixed(0)}%が上位20%のトレードに集中しています。大勝ちが来なくなった場合、戦略全体が赤字になるリスクがあります。利益の安定性を高める工夫が必要です。`
        : `${tradeQuality.profitConcentration.toFixed(0)}% of total profit comes from only the top 20% of winning trades. If these large wins stop occurring, the strategy becomes unprofitable.`,
      priority: "high",
      category: lang === "ja" ? "戦略全体" : "Overall Strategy",
    });
  }

  // ========== Pattern 11: Late Stop-Loss ==========
  if (tradeQuality?.hasLateSL) {
    suggestions.push({
      title: lang === "ja" ? "損切り遅れの検出" : "Late Stop-Loss Detected",
      description: lang === "ja"
        ? `平均損失(${metrics.avgLoss.toFixed(2)})が平均利益(${metrics.avgProfit.toFixed(2)})の2倍以上です。損切りが遅れている可能性があります。ストップロスを事前に設定し、計画通りに執行する規律を持ちましょう。`
        : `Average loss (${metrics.avgLoss.toFixed(2)}) is more than 2x average profit (${metrics.avgProfit.toFixed(2)}). Stop-losses may be set too wide or not executed in time.`,
      priority: "high",
      category: lang === "ja" ? "エントリー/イグジット" : "Entry/Exit",
    });
  }

  // ========== Pattern 12: Early Take-Profit ==========
  if (tradeQuality?.hasEarlyTP) {
    suggestions.push({
      title: lang === "ja" ? "勝ちトレードの利確が早い" : "Taking Profits Too Early",
      description: lang === "ja"
        ? `勝ちの中央値(${tradeQuality.medianWin.toFixed(2)})が平均値(${tradeQuality.avgWinAmount.toFixed(2)})を大きく下回っています。多くの勝ちトレードで利益を十分に伸ばせていない可能性があります。トレーリングストップの導入を検討してください。`
        : `Median win (${tradeQuality.medianWin.toFixed(2)}) is much lower than average (${tradeQuality.avgWinAmount.toFixed(2)}). Many winning trades may be closed too early. Consider implementing trailing stops.`,
      priority: "medium",
      category: lang === "ja" ? "エントリー/イグジット" : "Entry/Exit",
    });
  }

  // ========== Pattern 13: Time Slot Concentration ==========
  if (timeSlotAnalysis) {
    const activeSlots = timeSlotAnalysis.filter(s => s.trades > 0);
    const totalSlotTrades = activeSlots.reduce((s, t) => s + t.trades, 0);
    const maxSlot = activeSlots.length > 0 ? activeSlots.reduce((a, b) => a.trades > b.trades ? a : b) : null;
    if (maxSlot && totalSlotTrades > 0 && (maxSlot.trades / totalSlotTrades) > 0.5) {
      suggestions.push({
        title: lang === "ja" ? "特定時間帯への偏り" : "Time Slot Concentration",
        description: lang === "ja"
          ? `トレードの${((maxSlot.trades / totalSlotTrades) * 100).toFixed(0)}%が${maxSlot.slot}に集中しています。市場環境が変化した場合のリスクを軽減するため、複数の時間帯に分散することを検討してください。`
          : `${((maxSlot.trades / totalSlotTrades) * 100).toFixed(0)}% of trades are concentrated in ${maxSlot.slot}. Consider diversifying across time slots to reduce risk.`,
        priority: "low",
        category: lang === "ja" ? "時間管理" : "Time Management",
      });
    }
  }

  // ========== Pattern 14: Inconsistent Lot Sizing ==========
  if (lotSizeAnalysis && lotSizeAnalysis.length >= 2) {
    const worstLot = lotSizeAnalysis.reduce((a, b) => a.winRate < b.winRate ? a : b);
    const bestLot = lotSizeAnalysis.reduce((a, b) => a.winRate > b.winRate ? a : b);
    if (bestLot.winRate - worstLot.winRate > 15) {
      suggestions.push({
        title: lang === "ja" ? "ロットサイズの不統一" : "Inconsistent Position Sizing",
        description: lang === "ja"
          ? `ロットサイズによって勝率に${(bestLot.winRate - worstLot.winRate).toFixed(1)}%の差があります（${bestLot.label}: ${bestLot.winRate.toFixed(1)}% vs ${worstLot.label}: ${worstLot.winRate.toFixed(1)}%）。ポジションサイズのルールを統一することで安定性が向上します。`
          : `Win rate varies by ${(bestLot.winRate - worstLot.winRate).toFixed(1)}% across lot sizes (${bestLot.label}: ${bestLot.winRate.toFixed(1)}% vs ${worstLot.label}: ${worstLot.winRate.toFixed(1)}%). Standardize position sizing rules.`,
        priority: "medium",
        category: lang === "ja" ? "リスク管理" : "Risk Management",
      });
    }
  }

  // ========== Pattern 15: Low-Quality Trade Removal ==========
  if (lowQualityImpact && lowQualityImpact.length > 0) {
    const best = lowQualityImpact.find(s => s.originalPF > 0 && s.newPF > s.originalPF * 1.3);
    if (best) {
      suggestions.push({
        title: lang === "ja" ? "低品質トレード排除の提案" : "Remove Low-Quality Trades",
        description: lang === "ja"
          ? `最も悪い${best.removedCount}件のトレードを除外した場合、PFが${best.originalPF.toFixed(2)}→${best.newPF.toFixed(2)}に改善されます。これらのトレードに共通するパターン（特定通貨・時間帯・ロット等）を特定し、エントリーフィルターとして活用してください。`
          : `Removing the worst ${best.removedCount} trades would improve PF from ${best.originalPF.toFixed(2)} to ${best.newPF.toFixed(2)}. Identify common patterns in these trades to create entry filters.`,
        priority: "medium",
        category: lang === "ja" ? "戦略全体" : "Overall Strategy",
      });
    }
  }

  // ========== Pattern 16: Post-Win-Streak Overconfidence ==========
  if (trades && trades.length > 20) {
    let winStreak = 0;
    let postStreakWins = 0;
    let postStreakTotal = 0;
    for (let i = 0; i < trades.length; i++) {
      if (trades[i].profit > 0) {
        winStreak++;
      } else {
        if (winStreak >= 3 && i + 1 < trades.length) {
          // Count only the trade AFTER the streak-breaking loss
          postStreakTotal++;
          if (trades[i + 1].profit > 0) postStreakWins++;
        }
        winStreak = 0;
      }
    }
    const overallWinRate = metrics.winRate;
    const postStreakWinRate = postStreakTotal > 0 ? (postStreakWins / postStreakTotal) * 100 : overallWinRate;
    if (postStreakTotal >= 5 && postStreakWinRate < overallWinRate - 10) {
      suggestions.push({
        title: lang === "ja" ? "連勝後の過信警告" : "Post-Win-Streak Overconfidence",
        description: lang === "ja"
          ? `3連勝以上の後の勝率(${postStreakWinRate.toFixed(1)}%)が通常時(${overallWinRate.toFixed(1)}%)より低下しています。連勝後にロットを増やす、またはルールを逸脱している可能性があります。連勝後も同じルールを徹底しましょう。`
          : `Win rate after 3+ win streaks (${postStreakWinRate.toFixed(1)}%) drops below overall (${overallWinRate.toFixed(1)}%). You may be over-trading or increasing risk after winning streaks.`,
        priority: "medium",
        category: lang === "ja" ? "メンタル管理" : "Mental Management",
      });
    }
  }

  // ========== Pattern 17: Day-of-Week Avoidance ==========
  if (dayOfWeekAnalysis) {
    const unprofitableDays = dayOfWeekAnalysis.filter(d => d.trades >= 5 && d.profitFactor < 0.8);
    if (unprofitableDays.length > 0) {
      const dayNames = unprofitableDays.map(d => d.day).join(", ");
      suggestions.push({
        title: lang === "ja" ? "特定曜日の回避" : "Avoid Specific Days",
        description: lang === "ja"
          ? `${dayNames}曜日のPFが0.8未満です。これらの曜日のトレードを控えるか、ロットを減らすことで全体の収益性を改善できる可能性があります。`
          : `PF is below 0.8 on ${dayNames}. Consider avoiding or reducing position size on these days to improve overall profitability.`,
        priority: "low",
        category: lang === "ja" ? "時間管理" : "Time Management",
      });
    }
  }

  // ========== Pattern 18: Recovery After Losses ==========
  if (trades && trades.length > 10) {
    let afterLossWins = 0;
    let afterLossTrades = 0;
    let afterLossLotIncrease = 0;
    for (let i = 1; i < trades.length; i++) {
      if (trades[i - 1].profit < 0) {
        afterLossTrades++;
        if (trades[i].profit > 0) afterLossWins++;
        if (trades[i].lots > trades[i - 1].lots * 1.2) afterLossLotIncrease++;
      }
    }
    const afterLossWinRate = afterLossTrades > 0 ? (afterLossWins / afterLossTrades) * 100 : 0;
    if (afterLossTrades >= 5 && afterLossLotIncrease > afterLossTrades * 0.3) {
      suggestions.push({
        title: lang === "ja" ? "損失後のロット増加（リベンジトレード）" : "Post-Loss Lot Increase (Revenge Trading)",
        description: lang === "ja"
          ? `負けトレードの後、${((afterLossLotIncrease / afterLossTrades) * 100).toFixed(0)}%の確率でロットサイズを増加させています。損失を取り戻そうとする「リベンジトレード」の兆候です。負けた後こそ冷静にルール通りのロットを維持してください。`
          : `After losing trades, lot size increases ${((afterLossLotIncrease / afterLossTrades) * 100).toFixed(0)}% of the time. This suggests "revenge trading". Maintain consistent lot sizing especially after losses.`,
        priority: "high",
        category: lang === "ja" ? "メンタル管理" : "Mental Management",
      });
    }
    if (afterLossTrades >= 10 && afterLossWinRate < metrics.winRate - 10) {
      suggestions.push({
        title: lang === "ja" ? "損失後の勝率低下" : "Lower Win Rate After Losses",
        description: lang === "ja"
          ? `負けた直後のトレードの勝率（${afterLossWinRate.toFixed(1)}%）が通常時（${metrics.winRate.toFixed(1)}%）より${(metrics.winRate - afterLossWinRate).toFixed(1)}%低下しています。負けた後は1〜2トレード休むか、ロットを小さくして冷静さを取り戻してからエントリーしてください。`
          : `Win rate immediately after a loss (${afterLossWinRate.toFixed(1)}%) drops ${(metrics.winRate - afterLossWinRate).toFixed(1)}% below overall (${metrics.winRate.toFixed(1)}%). Consider pausing 1-2 trades or reducing lot size after a loss to regain composure.`,
        priority: "medium",
        category: lang === "ja" ? "メンタル管理" : "Mental Management",
      });
    }
  }

  // ========== Pattern 19: Lot Size All Losing ==========
  if (lotSizeAnalysis && lotSizeAnalysis.length >= 2) {
    const allLotGroupsLosing = lotSizeAnalysis.every(g => g.netProfit < 0);
    const allLotGroupsLowPF = lotSizeAnalysis.filter(g => g.trades >= 3).every(g => g.profitFactor < 1);
    if (allLotGroupsLosing || allLotGroupsLowPF) {
      const totalLotLoss = lotSizeAnalysis.reduce((s, g) => s + g.netProfit, 0);
      suggestions.push({
        title: lang === "ja" ? "全ロットサイズで損失発生" : "All Lot Sizes Losing",
        description: lang === "ja"
          ? `小ロットから大ロットまで全てのサイズ区分で損失が発生しています（合計: ${totalLotLoss.toFixed(2)}）。ロットサイズの調整では解決できない根本的な戦略の問題があります。まず最小ロットに固定して勝てるルールを確立し、その後にサイズを拡大してください。`
          : `All lot size groups are losing (total: ${totalLotLoss.toFixed(2)}). This indicates a fundamental strategy issue that lot size adjustment cannot fix. Fix rules at minimum lot first, then scale up.`,
        priority: "high",
        category: lang === "ja" ? "戦略全体" : "Overall Strategy",
      });
    }
  }

  // ========== Pattern 20: Win Rate vs Risk Reward Imbalance ==========
  if (metrics.winRate > 0 && metrics.riskReward > 0) {
    // Required RR for break-even given the win rate: RR_be = (1 - WR) / WR
    const requiredRR = (100 - metrics.winRate) / metrics.winRate;
    if (metrics.riskReward < requiredRR * 0.8) {
      suggestions.push({
        title: lang === "ja" ? "勝率とリスクリワードのバランス不良" : "Win Rate / Risk Reward Imbalance",
        description: lang === "ja"
          ? `現在の勝率${metrics.winRate.toFixed(1)}%では、損益分岐点のリスクリワード比は約${requiredRR.toFixed(2)}ですが、実際は${metrics.riskReward.toFixed(2)}しかありません。勝率を上げるか、1回あたりの利益幅を損失幅に対して大きくする必要があります。具体的には、損切り幅を現在の${(100 / (requiredRR / metrics.riskReward)).toFixed(0)}%に縮小するか、利確幅を${((requiredRR / metrics.riskReward) * 100).toFixed(0)}%に拡大してください。`
          : `At ${metrics.winRate.toFixed(1)}% win rate, break-even RR is ~${requiredRR.toFixed(2)}, but actual RR is only ${metrics.riskReward.toFixed(2)}. Either improve win rate or widen the gap between avg win and avg loss.`,
        priority: "high",
        category: lang === "ja" ? "戦略全体" : "Overall Strategy",
      });
    }
  }

  // ========== Pattern 21: First Half vs Second Half Performance Trend ==========
  if (trades && trades.length >= 20) {
    const mid = Math.floor(trades.length / 2);
    const firstHalf = trades.slice(0, mid);
    const secondHalf = trades.slice(mid);
    const firstWR = (firstHalf.filter(t => t.profit > 0).length / firstHalf.length) * 100;
    const secondWR = (secondHalf.filter(t => t.profit > 0).length / secondHalf.length) * 100;
    const firstAvgPL = firstHalf.reduce((s, t) => s + t.profit, 0) / firstHalf.length;
    const secondAvgPL = secondHalf.reduce((s, t) => s + t.profit, 0) / secondHalf.length;

    if (secondWR < firstWR - 10 && secondAvgPL < firstAvgPL) {
      suggestions.push({
        title: lang === "ja" ? "後半にかけて成績が悪化" : "Performance Declining Over Time",
        description: lang === "ja"
          ? `前半${firstHalf.length}件（勝率${firstWR.toFixed(1)}%、平均損益${firstAvgPL.toFixed(2)}）に対し、後半${secondHalf.length}件（勝率${secondWR.toFixed(1)}%、平均損益${secondAvgPL.toFixed(2)}）と成績が悪化しています。市場環境の変化にルールが適応できていない、またはルールの逸脱が進んでいる可能性があります。直近のトレードを重点的に見直してください。`
          : `First ${firstHalf.length} trades: WR ${firstWR.toFixed(1)}%, avg P/L ${firstAvgPL.toFixed(2)}. Last ${secondHalf.length}: WR ${secondWR.toFixed(1)}%, avg P/L ${secondAvgPL.toFixed(2)}. Performance is declining. Review recent trades for rule deviations or market environment changes.`,
        priority: "medium",
        category: lang === "ja" ? "戦略全体" : "Overall Strategy",
      });
    } else if (secondWR > firstWR + 10 && secondAvgPL > firstAvgPL) {
      suggestions.push({
        title: lang === "ja" ? "後半にかけて成績が改善" : "Performance Improving Over Time",
        description: lang === "ja"
          ? `前半${firstHalf.length}件（勝率${firstWR.toFixed(1)}%）に対し後半${secondHalf.length}件（勝率${secondWR.toFixed(1)}%）と改善傾向です。直近のトレードルールが機能しているため、最近の判断基準を言語化してルール化することで、さらなる安定が期待できます。`
          : `Performance improved from ${firstWR.toFixed(1)}% to ${secondWR.toFixed(1)}% win rate. Recent rules are working. Document and formalize your recent decision criteria.`,
        priority: "low",
        category: lang === "ja" ? "戦略全体" : "Overall Strategy",
      });
    }
  }

  // ========== Pattern 22: Profit Giving Back (Win → Loss Sequence) ==========
  if (trades && trades.length >= 20) {
    let giveBackCount = 0;
    let giveBackAmount = 0;
    for (let i = 1; i < trades.length; i++) {
      if (trades[i - 1].profit > 0 && trades[i].profit < 0 && Math.abs(trades[i].profit) > trades[i - 1].profit) {
        giveBackCount++;
        giveBackAmount += Math.abs(trades[i].profit) - trades[i - 1].profit;
      }
    }
    const giveBackRate = giveBackCount / (trades.length - 1) * 100;
    if (giveBackCount >= 5 && giveBackRate > 15) {
      suggestions.push({
        title: lang === "ja" ? "利益の吐き出しパターン" : "Profit Give-Back Pattern",
        description: lang === "ja"
          ? `勝ちトレードの直後に、前回の利益を超える損失を出すパターンが${giveBackCount}回（${giveBackRate.toFixed(1)}%）発生し、合計${giveBackAmount.toFixed(2)}の余分な損失が生じています。勝った後に気が緩んでエントリー精度が落ちている可能性があります。勝った後も同じ基準でエントリーし、勝ち分を守る意識を持ちましょう。`
          : `${giveBackCount} times (${giveBackRate.toFixed(1)}%) a losing trade immediately after a win exceeded the prior win, giving back ${giveBackAmount.toFixed(2)} extra. Maintain the same entry criteria after winning to protect gains.`,
        priority: "medium",
        category: lang === "ja" ? "メンタル管理" : "Mental Management",
      });
    }
  }

  // ========== Pattern 23: Symbol Diversification ==========
  if (trades && trades.length >= 10) {
    const symbolCounts = new Map<string, number>();
    for (const t of trades) {
      symbolCounts.set(t.symbol, (symbolCounts.get(t.symbol) || 0) + 1);
    }
    if (symbolCounts.size === 1) {
      const symbol = Array.from(symbolCounts.keys())[0];
      suggestions.push({
        title: lang === "ja" ? "単一通貨ペアへの集中" : "Single Pair Concentration",
        description: lang === "ja"
          ? `全トレードが${symbol}に集中しています。この通貨ペアの特性が変わった場合、戦略全体が機能しなくなるリスクがあります。相関の低い通貨ペアを1〜2つ追加してリスク分散を検討してください。`
          : `All trades are on ${symbol}. If this pair's characteristics change, the entire strategy may fail. Consider adding 1-2 uncorrelated pairs for diversification.`,
        priority: "low",
        category: lang === "ja" ? "通貨ペア選定" : "Pair Selection",
      });
    } else if (symbolCounts.size >= 2) {
      const sorted = Array.from(symbolCounts.entries()).sort((a, b) => b[1] - a[1]);
      const topPairShare = sorted[0][1] / trades.length * 100;
      if (topPairShare > 80) {
        suggestions.push({
          title: lang === "ja" ? "通貨ペアの偏り" : "Pair Concentration",
          description: lang === "ja"
            ? `トレードの${topPairShare.toFixed(0)}%が${sorted[0][0]}に集中しています。この通貨ペアへの依存度が高いため、他の通貨ペアでの検証も行い、リスクの分散を図ることを推奨します。`
            : `${topPairShare.toFixed(0)}% of trades are on ${sorted[0][0]}. High dependence on a single pair increases risk. Consider diversifying.`,
          priority: "low",
          category: lang === "ja" ? "通貨ペア選定" : "Pair Selection",
        });
      }
    }
  }

  return suggestions.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}

// ==================== Equity Curve ====================

export function calculateEquityCurve(trades: TradeRecord[], initialBalance: number = 0): EquityCurvePoint[] {
  if (trades.length === 0) return [];
  const points: EquityCurvePoint[] = [{ index: 0, equity: initialBalance, drawdown: 0, drawdownPct: 0, time: trades[0].time }];
  let equity = initialBalance;
  let peak = initialBalance;

  for (let i = 0; i < trades.length; i++) {
    equity += trades[i].profit;
    if (equity > peak) peak = equity;
    const drawdown = peak - equity;
    const drawdownPct = drawdown > 0
      ? (peak > 0 ? Math.min((drawdown / peak) * 100, 100) : 100)
      : 0;
    points.push({ index: i + 1, equity, drawdown, drawdownPct, time: trades[i].time });
  }

  return points;
}

// ==================== Risk Diagnosis ====================

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type FactorStatus = "ok" | "caution" | "danger";

export interface RiskFactor {
  label: string;
  status: FactorStatus;
  statusLabel: string;
  description: string;
  action: string;
  value: string;
}

export interface RiskDiagnosis {
  level: RiskLevel;
  color: string;
  factors: RiskFactor[];
}

export function diagnoseRisk(metrics: PerformanceMetrics, lang: Language = "ja"): RiskDiagnosis {
  let riskScore = 0;
  const factors: RiskFactor[] = [];

  // --- Max Drawdown ---
  const ddVal = `${metrics.maxDrawdownPercent.toFixed(1)}%`;
  if (metrics.maxDrawdownPercent > 30) {
    riskScore += 3;
    factors.push({
      label: lang === "ja" ? "最大ドローダウン" : "Max Drawdown",
      status: "danger",
      statusLabel: lang === "ja" ? "危険" : "Danger",
      value: ddVal,
      description: lang === "ja"
        ? `最大ドローダウンが${ddVal}に達しており、資金の大幅な毀損リスクがあります。一般的に30%を超えると回復が困難になります。`
        : `Max drawdown reached ${ddVal}, posing significant capital erosion risk. Recovery becomes difficult beyond 30%.`,
      action: lang === "ja"
        ? "1トレードあたりのリスクを資金の1%以下に制限し、ポジションサイズを縮小してください。ストップロスの見直しも必要です。"
        : "Limit risk per trade to 1% of capital, reduce position sizes, and review stop-loss placement.",
    });
  } else if (metrics.maxDrawdownPercent > 15) {
    riskScore += 1;
    factors.push({
      label: lang === "ja" ? "最大ドローダウン" : "Max Drawdown",
      status: "caution",
      statusLabel: lang === "ja" ? "注意が必要" : "Caution",
      value: ddVal,
      description: lang === "ja"
        ? `最大ドローダウンが${ddVal}です。15%を超えているため、リスク管理の強化を検討すべき水準です。ただし、戦略次第では許容範囲内の場合もあります。`
        : `Max drawdown is ${ddVal}. Exceeding 15% suggests risk management should be tightened, though it may be acceptable depending on strategy.`,
      action: lang === "ja"
        ? "ストップロスの幅を見直し、1トレードあたりのリスクを資金の2%以内に抑えることを推奨します。連敗時のロット縮小ルールも有効です。"
        : "Review stop-loss width, keep risk per trade under 2% of capital. Consider reducing lot size during losing streaks.",
    });
  } else {
    factors.push({
      label: lang === "ja" ? "最大ドローダウン" : "Max Drawdown",
      status: "ok",
      statusLabel: lang === "ja" ? "問題なし" : "OK",
      value: ddVal,
      description: lang === "ja"
        ? `最大ドローダウンが${ddVal}で、15%以内に収まっています。リスク管理が適切に機能しています。`
        : `Max drawdown is ${ddVal}, within the 15% threshold. Risk management is functioning well.`,
      action: lang === "ja"
        ? "現在のリスク管理を維持してください。今後もドローダウンが拡大しないか定期的にモニタリングしましょう。"
        : "Maintain current risk management. Continue monitoring to ensure drawdown doesn't expand.",
    });
  }

  // --- Profit Factor ---
  const pfVal = metrics.profitFactor >= 999 ? "999+" : metrics.profitFactor.toFixed(2);
  if (metrics.profitFactor < 1) {
    riskScore += 3;
    factors.push({
      label: "Profit Factor",
      status: "danger",
      statusLabel: lang === "ja" ? "危険" : "Danger",
      value: pfVal,
      description: lang === "ja"
        ? `PFが${pfVal}で1未満のため、総損失が総利益を上回っています。このまま続けると資金が減少し続けます。`
        : `PF is ${pfVal} (below 1), meaning total losses exceed total profits. Continuing will erode capital.`,
      action: lang === "ja"
        ? "トレード戦略の根本的な見直しが必要です。エントリー条件の精査、損切りルールの厳格化、利確ポイントの最適化を行ってください。"
        : "A fundamental strategy review is needed. Refine entry conditions, tighten stop-losses, and optimize take-profit levels.",
    });
  } else if (metrics.profitFactor < 1.2) {
    riskScore += 1;
    factors.push({
      label: "Profit Factor",
      status: "caution",
      statusLabel: lang === "ja" ? "注意が必要" : "Caution",
      value: pfVal,
      description: lang === "ja"
        ? `PFが${pfVal}で、利益は出ていますがマージンが薄いです。スプレッドやスリッページの影響で容易にマイナスに転じる可能性があります。`
        : `PF is ${pfVal}. Profitable but with thin margins. Spread and slippage could easily turn it negative.`,
      action: lang === "ja"
        ? "勝率の改善またはリスクリワード比の向上を目指してください。負けトレードの損失を小さくするか、勝ちトレードの利益を伸ばす工夫が必要です。"
        : "Aim to improve win rate or risk-reward ratio. Either reduce losses on losing trades or extend profits on winners.",
    });
  } else {
    factors.push({
      label: "Profit Factor",
      status: "ok",
      statusLabel: lang === "ja" ? "問題なし" : "OK",
      value: pfVal,
      description: lang === "ja"
        ? `PFが${pfVal}で、十分な利益マージンがあります。安定した収益性を示しています。`
        : `PF is ${pfVal}, showing sufficient profit margin and stable profitability.`,
      action: lang === "ja"
        ? "現在の戦略を維持しつつ、さらなる最適化の余地がないか定期的に検証しましょう。"
        : "Maintain current strategy while periodically reviewing for further optimization opportunities.",
    });
  }

  // --- Consecutive Losses ---
  const clVal = `${metrics.maxConsecutiveLosses}`;
  if (metrics.maxConsecutiveLosses >= 8) {
    riskScore += 2;
    factors.push({
      label: lang === "ja" ? "最大連敗数" : "Max Consecutive Losses",
      status: "danger",
      statusLabel: lang === "ja" ? "危険" : "Danger",
      value: `${clVal}${lang === "ja" ? "連敗" : " in a row"}`,
      description: lang === "ja"
        ? `最大${clVal}連敗が発生しています。メンタル面への影響が大きく、感情的なトレードに陥るリスクが高いです。`
        : `${clVal} consecutive losses occurred. This significantly impacts mental state and increases risk of emotional trading.`,
      action: lang === "ja"
        ? "3連敗でロットを半分に、5連敗でトレードを一時停止するルールを設けてください。連敗後は必ずチャート分析を見直してからエントリーしましょう。"
        : "Set rules: halve lot size after 3 losses, pause trading after 5. Always review chart analysis before re-entering after a streak.",
    });
  } else if (metrics.maxConsecutiveLosses >= 5) {
    riskScore += 1;
    factors.push({
      label: lang === "ja" ? "最大連敗数" : "Max Consecutive Losses",
      status: "caution",
      statusLabel: lang === "ja" ? "注意が必要" : "Caution",
      value: `${clVal}${lang === "ja" ? "連敗" : " in a row"}`,
      description: lang === "ja"
        ? `最大${clVal}連敗が発生しています。連敗はどの戦略でも起こり得ますが、メンタル管理のルールがあると安心です。`
        : `${clVal} consecutive losses occurred. Losing streaks happen in any strategy, but having mental management rules helps.`,
      action: lang === "ja"
        ? "連敗時にロットを下げるルールの導入を検討してください。また、連敗後にトレード日誌を振り返り、パターンがないか確認しましょう。"
        : "Consider rules to reduce lot size during losing streaks. Review your trading journal after streaks to identify patterns.",
    });
  } else {
    factors.push({
      label: lang === "ja" ? "最大連敗数" : "Max Consecutive Losses",
      status: "ok",
      statusLabel: lang === "ja" ? "問題なし" : "OK",
      value: `${clVal}${lang === "ja" ? "連敗" : " in a row"}`,
      description: lang === "ja"
        ? `最大連敗数は${clVal}回で、安定したトレードができています。`
        : `Max consecutive losses is ${clVal}, indicating stable trading.`,
      action: lang === "ja"
        ? "良好な状態です。引き続き規律あるトレードを心がけましょう。"
        : "Good condition. Continue disciplined trading.",
    });
  }

  // --- Expectancy ---
  const expVal = `${metrics.expectancy >= 0 ? "+" : ""}${metrics.expectancy.toFixed(2)}`;
  if (metrics.expectancy < 0) {
    riskScore += 3;
    factors.push({
      label: lang === "ja" ? "期待値" : "Expectancy",
      status: "danger",
      statusLabel: lang === "ja" ? "危険" : "Danger",
      value: expVal,
      description: lang === "ja"
        ? `1トレードあたりの期待値が${expVal}でマイナスです。トレードを重ねるほど資金が減少する状態です。`
        : `Expectancy per trade is ${expVal} (negative). The more you trade, the more capital you lose.`,
      action: lang === "ja"
        ? "戦略の根本的な見直しが急務です。バックテストで検証し、エントリー条件・損切り・利確のすべてを再設計してください。デモ口座での検証を強く推奨します。"
        : "Urgent strategy overhaul needed. Backtest and redesign entry conditions, stop-loss, and take-profit. Strongly recommend demo account testing.",
    });
  } else if (metrics.expectancy < metrics.avgLoss * 0.1 && metrics.avgLoss > 0) {
    factors.push({
      label: lang === "ja" ? "期待値" : "Expectancy",
      status: "caution",
      statusLabel: lang === "ja" ? "注意が必要" : "Caution",
      value: expVal,
      description: lang === "ja"
        ? `期待値は${expVal}でプラスですが、平均損失に対して小さいため、わずかな環境変化で赤字に転じる可能性があります。`
        : `Expectancy is ${expVal} (positive) but small relative to average loss. Minor market changes could turn it negative.`,
      action: lang === "ja"
        ? "利確幅の拡大や損切り幅の縮小を検討し、期待値のバッファを確保してください。"
        : "Consider widening take-profit or tightening stop-loss to build a larger expectancy buffer.",
    });
  } else {
    factors.push({
      label: lang === "ja" ? "期待値" : "Expectancy",
      status: "ok",
      statusLabel: lang === "ja" ? "問題なし" : "OK",
      value: expVal,
      description: lang === "ja"
        ? `期待値が${expVal}で、トレードを重ねるほど資金が増加する見込みです。`
        : `Expectancy is ${expVal}. Capital is expected to grow with more trades.`,
      action: lang === "ja"
        ? "良好な期待値です。ロットサイズの最適化でさらなる収益向上を目指せます。"
        : "Good expectancy. Optimizing lot size could further improve returns.",
    });
  }

  // --- Win Rate ---
  const wrVal = `${metrics.winRate.toFixed(1)}%`;
  if (metrics.winRate < 30) {
    riskScore += 2;
    factors.push({
      label: lang === "ja" ? "勝率" : "Win Rate",
      status: "danger",
      statusLabel: lang === "ja" ? "危険" : "Danger",
      value: wrVal,
      description: lang === "ja"
        ? `勝率が${wrVal}で非常に低いです。高いリスクリワード比でカバーできていない場合、資金が急速に減少します。`
        : `Win rate is ${wrVal}, very low. Without a high risk-reward ratio to compensate, capital will decline rapidly.`,
      action: lang === "ja"
        ? "エントリーの精度を上げるか、リスクリワード比を3:1以上に設定してください。勝率30%未満でも利益を出すにはRR3以上が必要です。"
        : "Improve entry accuracy or set risk-reward ratio to 3:1 or higher. RR of 3+ is needed to profit with sub-30% win rate.",
    });
  } else if (metrics.winRate < 45) {
    factors.push({
      label: lang === "ja" ? "勝率" : "Win Rate",
      status: "caution",
      statusLabel: lang === "ja" ? "注意が必要" : "Caution",
      value: wrVal,
      description: lang === "ja"
        ? `勝率が${wrVal}でやや低めです。リスクリワード比が十分に高ければ問題ありませんが、PFと合わせて確認が必要です。`
        : `Win rate is ${wrVal}, somewhat low. Not a problem if risk-reward ratio is high enough, but check alongside PF.`,
      action: lang === "ja"
        ? "エントリー条件のフィルターを追加するか、トレンド方向のみにエントリーを限定することで勝率改善が期待できます。"
        : "Adding entry filters or limiting entries to trend direction could improve win rate.",
    });
  } else {
    factors.push({
      label: lang === "ja" ? "勝率" : "Win Rate",
      status: "ok",
      statusLabel: lang === "ja" ? "問題なし" : "OK",
      value: wrVal,
      description: lang === "ja"
        ? `勝率が${wrVal}で安定しています。`
        : `Win rate is ${wrVal}, stable and healthy.`,
      action: lang === "ja"
        ? "良好な勝率です。利確の最適化でさらに収益性を高められる可能性があります。"
        : "Good win rate. Optimizing take-profit could further enhance profitability.",
    });
  }

  // --- Overall Risk Level ---
  let level: RiskLevel;
  let color: string;
  if (riskScore >= 5) {
    level = "HIGH";
    color = "#EF4444";
  } else if (riskScore >= 2) {
    level = "MEDIUM";
    color = "#F59E0B";
  } else {
    level = "LOW";
    color = "#00D4AA";
  }

  return { level, color, factors };
}
