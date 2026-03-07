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

const emptyMonteCarloResult: MonteCarloResult = {
  paths: [], avgFinalEquity: 0, worstFinalEquity: 0, bestFinalEquity: 0,
  maxDrawdown: 0, avgMaxDrawdown: 0, bankruptcyRate: 0,
  percentile5: 0, percentile25: 0, percentile50: 0, percentile75: 0, percentile95: 0,
};

export function runMonteCarloSimulation(
  trades: TradeRecord[],
  numSimulations: number = 1000,
  initialCapital: number = 0
): MonteCarloResult {
  if (trades.length === 0) return emptyMonteCarloResult;

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
    if (arr.length === 0) return 0;
    const idx = Math.min(Math.ceil((p / 100) * arr.length) - 1, arr.length - 1);
    return arr[Math.max(0, idx)];
  };

  return {
    paths: paths.slice(0, 200),
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
  const emptyResult = { ranges: ["0-5%", "5-10%", "10-15%", "15-20%", "20-30%", "30-50%", "50%+"], counts: new Array(7).fill(0) };
  if (trades.length === 0) return emptyResult;

  const drawdowns: number[] = [];
  let equity = initialBalance;
  let peak = initialBalance;

  for (const trade of trades) {
    equity += trade.profit;
    if (equity > peak) peak = equity;
    const rawDD = peak - equity;
    let dd = 0;
    if (rawDD > 0 && peak > 0) {
      dd = Math.min((rawDD / peak) * 100, 100);
    }
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
