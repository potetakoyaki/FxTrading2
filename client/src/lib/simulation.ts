import type { TradeRecord } from "./csvParser";

export interface MonteCarloResult {
  paths: number[][]; // Array of equity paths (each path is array of equity values)
  avgFinalEquity: number;
  worstFinalEquity: number;
  bestFinalEquity: number;
  maxDrawdown: number;
  avgMaxDrawdown: number;
  bankruptcyRate: number; // percentage of paths that went below 0
  percentile5: number;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  percentile95: number;
}

export interface DrawdownDistribution {
  ranges: string[];
  counts: number[];
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function runMonteCarloSimulation(
  trades: TradeRecord[],
  numSimulations: number = 1000,
  initialCapital: number = 0
): MonteCarloResult {
  const profits = trades.map((t) => t.profit);
  const numTrades = profits.length;

  const paths: number[][] = [];
  const finalEquities: number[] = [];
  const maxDrawdowns: number[] = [];
  let bankruptcyCount = 0;

  for (let sim = 0; sim < numSimulations; sim++) {
    const shuffled = shuffleArray(profits);
    const path: number[] = [initialCapital];
    let equity = initialCapital;
    let peak = initialCapital;
    let maxDD = 0;
    let bankrupt = false;

    for (let i = 0; i < numTrades; i++) {
      equity += shuffled[i];
      path.push(equity);

      if (equity > peak) peak = equity;
      const dd = peak - equity;
      if (dd > maxDD) maxDD = dd;

      if (equity < 0) bankrupt = true;
    }

    // Store only a subset of paths for visualization (every 10th or first 100)
    if (sim < 100 || sim % 10 === 0) {
      paths.push(path);
    }

    finalEquities.push(equity);
    maxDrawdowns.push(maxDD);
    if (bankrupt) bankruptcyCount++;
  }

  finalEquities.sort((a, b) => a - b);

  const getPercentile = (arr: number[], p: number) => {
    const idx = Math.floor((p / 100) * arr.length);
    return arr[Math.min(idx, arr.length - 1)];
  };

  return {
    paths: paths.slice(0, 200), // Limit for performance
    avgFinalEquity: finalEquities.reduce((s, v) => s + v, 0) / finalEquities.length,
    worstFinalEquity: finalEquities[0],
    bestFinalEquity: finalEquities[finalEquities.length - 1],
    maxDrawdown: Math.max(...maxDrawdowns),
    avgMaxDrawdown: maxDrawdowns.reduce((s, v) => s + v, 0) / maxDrawdowns.length,
    bankruptcyRate: (bankruptcyCount / numSimulations) * 100,
    percentile5: getPercentile(finalEquities, 5),
    percentile25: getPercentile(finalEquities, 25),
    percentile50: getPercentile(finalEquities, 50),
    percentile75: getPercentile(finalEquities, 75),
    percentile95: getPercentile(finalEquities, 95),
  };
}

export function calculateDrawdownDistribution(
  trades: TradeRecord[],
  initialBalance: number = 0
): DrawdownDistribution {
  // Calculate drawdown percentage at each point in the equity curve.
  // DD% = (peak - equity) / peak * 100, capped at 100%.
  // initialBalance is added so DD% is relative to the actual account size.
  const drawdowns: number[] = [];
  let equity = initialBalance;
  let peak = initialBalance;

  for (const trade of trades) {
    equity += trade.profit;
    if (equity > peak) peak = equity;
    const rawDD = peak - equity;
    const dd = rawDD > 0
      ? (peak > 0 ? Math.min((rawDD / peak) * 100, 100) : 100)
      : 0;
    drawdowns.push(dd);
  }

  // Create histogram
  const ranges = ["0-5%", "5-10%", "10-15%", "15-20%", "20-30%", "30-50%", "50%+"];
  const thresholds = [0, 5, 10, 15, 20, 30, 50, Infinity];
  const counts = new Array(ranges.length).fill(0);

  for (const dd of drawdowns) {
    for (let i = 0; i < thresholds.length - 1; i++) {
      if (dd >= thresholds[i] && dd < thresholds[i + 1]) {
        counts[i]++;
        break;
      }
    }
  }

  return { ranges, counts };
}
