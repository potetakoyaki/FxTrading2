import {
  runMonteCarloSimulation,
  calculateDrawdownDistribution,
} from "./simulation";
import type { TradeRecord } from "./csvParser";

/**
 * Helper to create a TradeRecord with sensible defaults.
 * Only `profit` varies between test cases; the rest is filler.
 */
function makeTrade(profit: number, time?: Date): TradeRecord {
  return {
    ticket: "1000",
    openTime: time ?? new Date("2024-01-15T10:00:00"),
    time: time ?? new Date("2024-01-15T14:00:00"),
    type: "buy",
    volume: 0.1,
    lots: 0.1,
    symbol: "EURUSD",
    openPrice: 1.085,
    closePrice: 1.086,
    price: 1.085,
    commission: 0,
    swap: 0,
    profit,
  } as TradeRecord;
}

// ---------------------------------------------------------------------------
// 1. Determinism
// ---------------------------------------------------------------------------
describe("runMonteCarloSimulation - Determinism", () => {
  it("produces identical results for the same trades", () => {
    const trades = [makeTrade(100), makeTrade(-50), makeTrade(30)];
    const result1 = runMonteCarloSimulation(trades, 100);
    const result2 = runMonteCarloSimulation(trades, 100);

    expect(result1.avgFinalEquity).toBe(result2.avgFinalEquity);
    expect(result1.worstFinalEquity).toBe(result2.worstFinalEquity);
    expect(result1.bestFinalEquity).toBe(result2.bestFinalEquity);
    expect(result1.maxDrawdown).toBe(result2.maxDrawdown);
    expect(result1.bankruptcyRate).toBe(result2.bankruptcyRate);
    expect(result1.profitProbability).toBe(result2.profitProbability);
    expect(result1.percentile5).toBe(result2.percentile5);
    expect(result1.percentile50).toBe(result2.percentile50);
    expect(result1.percentile95).toBe(result2.percentile95);
    expect(result1.paths.length).toBe(result2.paths.length);
  });

  it("produces different results for different trades", () => {
    const tradesA = [makeTrade(100), makeTrade(-50), makeTrade(30)];
    const tradesB = [makeTrade(-200), makeTrade(10), makeTrade(-80)];
    const resultA = runMonteCarloSimulation(tradesA, 100);
    const resultB = runMonteCarloSimulation(tradesB, 100);

    expect(resultA.avgFinalEquity).not.toBe(resultB.avgFinalEquity);
  });
});

// ---------------------------------------------------------------------------
// 2. Empty trades
// ---------------------------------------------------------------------------
describe("runMonteCarloSimulation - Empty trades", () => {
  it("returns all zeros and empty paths for an empty trade array", () => {
    const result = runMonteCarloSimulation([]);

    expect(result.paths).toEqual([]);
    expect(result.avgFinalEquity).toBe(0);
    expect(result.worstFinalEquity).toBe(0);
    expect(result.bestFinalEquity).toBe(0);
    expect(result.maxDrawdown).toBe(0);
    expect(result.avgMaxDrawdown).toBe(0);
    expect(result.bankruptcyRate).toBe(0);
    expect(result.profitProbability).toBe(0);
    expect(result.percentile95MaxDD).toBe(0);
    expect(result.percentile5).toBe(0);
    expect(result.percentile25).toBe(0);
    expect(result.percentile50).toBe(0);
    expect(result.percentile75).toBe(0);
    expect(result.percentile95).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Single trade
// ---------------------------------------------------------------------------
describe("runMonteCarloSimulation - Single trade", () => {
  it("uses numTrades = max(1*2, 200) = 200 and completes without error", () => {
    const trades = [makeTrade(50)];
    const result = runMonteCarloSimulation(trades, 100);

    // Each path should have length numTrades + 1 = 201 (including initial equity)
    expect(result.paths.length).toBeGreaterThan(0);
    expect(result.paths[0].length).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 4. All winning trades
// ---------------------------------------------------------------------------
describe("runMonteCarloSimulation - All winning trades", () => {
  const winners = Array.from({ length: 20 }, () => makeTrade(100));

  it("avgFinalEquity should be positive", () => {
    const result = runMonteCarloSimulation(winners, 200);
    expect(result.avgFinalEquity).toBeGreaterThan(0);
  });

  it("worstFinalEquity should be positive or zero", () => {
    const result = runMonteCarloSimulation(winners, 200);
    expect(result.worstFinalEquity).toBeGreaterThanOrEqual(0);
  });

  it("bankruptcyRate should be 0% with initialCapital", () => {
    const result = runMonteCarloSimulation(winners, 200, 10000);
    expect(result.bankruptcyRate).toBe(0);
  });

  it("bankruptcyRate should be -1 without initialCapital", () => {
    const result = runMonteCarloSimulation(winners, 200, 0);
    expect(result.bankruptcyRate).toBe(-1);
  });

  it("profitProbability should be 100%", () => {
    const result = runMonteCarloSimulation(winners, 200);
    expect(result.profitProbability).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// 5. All losing trades
// ---------------------------------------------------------------------------
describe("runMonteCarloSimulation - All losing trades", () => {
  const losers = Array.from({ length: 20 }, () => makeTrade(-100));

  it("avgFinalEquity should be negative or zero (no initial capital)", () => {
    const result = runMonteCarloSimulation(losers, 200, 0);
    expect(result.avgFinalEquity).toBeLessThanOrEqual(0);
  });

  it("bankruptcyRate should be high with initialCapital", () => {
    const result = runMonteCarloSimulation(losers, 200, 1000);
    // With 200 trades of -100 each, starting at 1000, bankruptcy is near-certain
    expect(result.bankruptcyRate).toBeGreaterThan(50);
  });

  it("bankruptcyRate should be -1 without initialCapital", () => {
    const result = runMonteCarloSimulation(losers, 200, 0);
    expect(result.bankruptcyRate).toBe(-1);
  });

  it("profitProbability should be 0%", () => {
    const result = runMonteCarloSimulation(losers, 200, 0);
    expect(result.profitProbability).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Mixed trades - structure validation
// ---------------------------------------------------------------------------
describe("runMonteCarloSimulation - Mixed trades", () => {
  const mixed = [
    makeTrade(150),
    makeTrade(-80),
    makeTrade(200),
    makeTrade(-120),
    makeTrade(50),
    makeTrade(-30),
    makeTrade(90),
    makeTrade(-60),
    makeTrade(110),
    makeTrade(-40),
  ];

  it("result has all expected fields", () => {
    const result = runMonteCarloSimulation(mixed, 500);

    expect(result).toHaveProperty("paths");
    expect(result).toHaveProperty("avgFinalEquity");
    expect(result).toHaveProperty("worstFinalEquity");
    expect(result).toHaveProperty("bestFinalEquity");
    expect(result).toHaveProperty("maxDrawdown");
    expect(result).toHaveProperty("avgMaxDrawdown");
    expect(result).toHaveProperty("bankruptcyRate");
    expect(result).toHaveProperty("profitProbability");
    expect(result).toHaveProperty("percentile95MaxDD");
    expect(result).toHaveProperty("percentile5");
    expect(result).toHaveProperty("percentile25");
    expect(result).toHaveProperty("percentile50");
    expect(result).toHaveProperty("percentile75");
    expect(result).toHaveProperty("percentile95");
  });

  it("paths should have at most 200 entries", () => {
    const result = runMonteCarloSimulation(mixed, 500);
    expect(result.paths.length).toBeLessThanOrEqual(200);
  });

  it("each path length should be numTrades + 1", () => {
    const result = runMonteCarloSimulation(mixed, 100);
    const expectedNumTrades = Math.max(mixed.length * 2, 200);
    result.paths.forEach(path => {
      expect(path.length).toBe(expectedNumTrades + 1);
    });
  });

  it("percentiles should be in order: p5 <= p25 <= p50 <= p75 <= p95", () => {
    const result = runMonteCarloSimulation(mixed, 1000);
    expect(result.percentile5).toBeLessThanOrEqual(result.percentile25);
    expect(result.percentile25).toBeLessThanOrEqual(result.percentile50);
    expect(result.percentile50).toBeLessThanOrEqual(result.percentile75);
    expect(result.percentile75).toBeLessThanOrEqual(result.percentile95);
  });

  it("worstFinalEquity <= avgFinalEquity <= bestFinalEquity", () => {
    const result = runMonteCarloSimulation(mixed, 1000);
    expect(result.worstFinalEquity).toBeLessThanOrEqual(result.avgFinalEquity);
    expect(result.avgFinalEquity).toBeLessThanOrEqual(result.bestFinalEquity);
  });
});

// ---------------------------------------------------------------------------
// 7. Bankruptcy detection
// ---------------------------------------------------------------------------
describe("runMonteCarloSimulation - Bankruptcy detection", () => {
  it("detects bankruptcy with initialCapital=1000 and large losses", () => {
    // Each trade loses 500; starting capital is 1000
    // After 2 consecutive losses, equity reaches 0 or below
    const heavyLosers = Array.from({ length: 10 }, () => makeTrade(-500));
    const result = runMonteCarloSimulation(heavyLosers, 500, 1000);

    expect(result.bankruptcyRate).toBeGreaterThan(0);
  });

  it("bankrupt paths are padded to full length", () => {
    const heavyLosers = Array.from({ length: 10 }, () => makeTrade(-500));
    const result = runMonteCarloSimulation(heavyLosers, 200, 1000);

    const expectedNumTrades = Math.max(10 * 2, 200);
    result.paths.forEach(path => {
      expect(path.length).toBe(expectedNumTrades + 1);
    });
  });

  it("bankrupt paths stop declining (equity stays constant after bankruptcy)", () => {
    const heavyLosers = Array.from({ length: 5 }, () => makeTrade(-600));
    const result = runMonteCarloSimulation(heavyLosers, 200, 1000);

    // Find a path that went bankrupt (equity < 0 at some point)
    const bankruptPath = result.paths.find(path => {
      return path.some(eq => eq < 0);
    });

    if (bankruptPath) {
      // Once equity goes below 0, it should stay constant (padded)
      let foundBankruptcy = false;
      let bankruptEquity = 0;
      for (let i = 1; i < bankruptPath.length; i++) {
        if (!foundBankruptcy && bankruptPath[i] < 0) {
          foundBankruptcy = true;
          bankruptEquity = bankruptPath[i];
        } else if (foundBankruptcy) {
          expect(bankruptPath[i]).toBe(bankruptEquity);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 8. Path storage limits
// ---------------------------------------------------------------------------
describe("runMonteCarloSimulation - Path storage limits", () => {
  it("paths.length is at most 200", () => {
    const trades = [makeTrade(10), makeTrade(-5), makeTrade(20)];
    const result = runMonteCarloSimulation(trades, 1000);
    expect(result.paths.length).toBeLessThanOrEqual(200);
  });

  it("stores at least the first 100 simulations", () => {
    const trades = [makeTrade(10), makeTrade(-5), makeTrade(20)];
    // With 100 simulations, all should be stored (sim < 100 condition)
    const result = runMonteCarloSimulation(trades, 100);
    expect(result.paths.length).toBe(100);
  });

  it("with 1000 simulations, stores first 100 plus every 10th", () => {
    const trades = [makeTrade(10), makeTrade(-5), makeTrade(20)];
    const result = runMonteCarloSimulation(trades, 1000);
    // First 100 (indices 0-99) + every 10th from 100-999 = 90 more = 190 total
    // But capped at 200
    expect(result.paths.length).toBeLessThanOrEqual(200);
    expect(result.paths.length).toBeGreaterThan(100);
  });
});

// ---------------------------------------------------------------------------
// 9. calculateDrawdownDistribution
// ---------------------------------------------------------------------------
describe("calculateDrawdownDistribution", () => {
  it("returns all zeros for empty trades", () => {
    const result = calculateDrawdownDistribution([]);
    expect(result.ranges.length).toBe(7);
    expect(result.counts.length).toBe(7);
    expect(result.counts.every(c => c === 0)).toBe(true);
  });

  it("returns exactly 7 ranges", () => {
    const trades = [makeTrade(100), makeTrade(-50)];
    const result = calculateDrawdownDistribution(trades, 1000);
    expect(result.ranges).toEqual([
      "0-5%",
      "5-10%",
      "10-15%",
      "15-20%",
      "20-30%",
      "30-50%",
      "50%+",
    ]);
    expect(result.ranges.length).toBe(7);
    expect(result.counts.length).toBe(7);
  });

  it("all winning trades -> most counts in 0-5% bucket", () => {
    const trades = Array.from({ length: 20 }, () => makeTrade(100));
    const result = calculateDrawdownDistribution(trades, 1000);

    // With only winning trades, drawdown is always 0% -> all in 0-5% bucket
    expect(result.counts[0]).toBe(20);
    const otherBucketsSum = result.counts.slice(1).reduce((s, c) => s + c, 0);
    expect(otherBucketsSum).toBe(0);
  });

  it("large drawdown scenario distributes across buckets", () => {
    // Start with 1000, then lose 600 (60% DD from peak of 1000)
    const trades = [makeTrade(-600)];
    const result = calculateDrawdownDistribution(trades, 1000);

    // 60% DD should land in the 50%+ bucket
    expect(result.counts[6]).toBe(1);
  });

  it("counts sum equals the number of trades", () => {
    const trades = [
      makeTrade(100),
      makeTrade(-50),
      makeTrade(200),
      makeTrade(-300),
      makeTrade(80),
    ];
    const result = calculateDrawdownDistribution(trades, 1000);
    const totalCounts = result.counts.reduce((s, c) => s + c, 0);
    expect(totalCounts).toBe(trades.length);
  });

  it("handles trades with zero initial balance", () => {
    // With initialBalance=0, peak starts at 0; DD calculation depends on
    // peak > 0 check in the implementation
    const trades = [makeTrade(100), makeTrade(-30)];
    const result = calculateDrawdownDistribution(trades, 0);

    expect(result.counts.length).toBe(7);
    const totalCounts = result.counts.reduce((s, c) => s + c, 0);
    expect(totalCounts).toBe(trades.length);
  });

  it("progressive drawdowns land in increasing buckets", () => {
    // initialBalance=1000, profit sequence that creates growing drawdowns
    // Trade 1: +0 -> equity=1000, peak=1000, dd=0% -> 0-5%
    // Trade 2: -100 -> equity=900, peak=1000, dd=10% -> 10-15%
    // Trade 3: -100 -> equity=800, peak=1000, dd=20% -> 20-30%
    // Trade 4: -200 -> equity=600, peak=1000, dd=40% -> 30-50%
    const trades = [
      makeTrade(0),
      makeTrade(-100),
      makeTrade(-100),
      makeTrade(-200),
    ];
    const result = calculateDrawdownDistribution(trades, 1000);

    expect(result.counts[0]).toBe(1); // 0-5%: first trade (0% dd)
    expect(result.counts[2]).toBe(1); // 10-15%: second trade (10% dd)
    expect(result.counts[4]).toBe(1); // 20-30%: third trade (20% dd)
    expect(result.counts[5]).toBe(1); // 30-50%: fourth trade (40% dd)
  });
});

// ---------------------------------------------------------------------------
// 10. Percentile ordering (dedicated)
// ---------------------------------------------------------------------------
describe("runMonteCarloSimulation - Percentile ordering", () => {
  it("percentiles are monotonically non-decreasing with positive-biased trades", () => {
    const trades = [
      makeTrade(200),
      makeTrade(-100),
      makeTrade(150),
      makeTrade(-50),
      makeTrade(300),
    ];
    const result = runMonteCarloSimulation(trades, 1000);

    expect(result.percentile5).toBeLessThanOrEqual(result.percentile25);
    expect(result.percentile25).toBeLessThanOrEqual(result.percentile50);
    expect(result.percentile50).toBeLessThanOrEqual(result.percentile75);
    expect(result.percentile75).toBeLessThanOrEqual(result.percentile95);
  });

  it("percentiles are monotonically non-decreasing with negative-biased trades", () => {
    const trades = [
      makeTrade(-200),
      makeTrade(50),
      makeTrade(-150),
      makeTrade(30),
      makeTrade(-100),
    ];
    const result = runMonteCarloSimulation(trades, 1000);

    expect(result.percentile5).toBeLessThanOrEqual(result.percentile25);
    expect(result.percentile25).toBeLessThanOrEqual(result.percentile50);
    expect(result.percentile50).toBeLessThanOrEqual(result.percentile75);
    expect(result.percentile75).toBeLessThanOrEqual(result.percentile95);
  });

  it("percentiles are monotonically non-decreasing with balanced trades", () => {
    const trades = [makeTrade(100), makeTrade(-100)];
    const result = runMonteCarloSimulation(trades, 1000);

    expect(result.percentile5).toBeLessThanOrEqual(result.percentile25);
    expect(result.percentile25).toBeLessThanOrEqual(result.percentile50);
    expect(result.percentile50).toBeLessThanOrEqual(result.percentile75);
    expect(result.percentile75).toBeLessThanOrEqual(result.percentile95);
  });

  it("worst <= p5 and p95 <= best", () => {
    const trades = [
      makeTrade(200),
      makeTrade(-100),
      makeTrade(150),
      makeTrade(-50),
    ];
    const result = runMonteCarloSimulation(trades, 1000);

    expect(result.worstFinalEquity).toBeLessThanOrEqual(result.percentile5);
    expect(result.percentile95).toBeLessThanOrEqual(result.bestFinalEquity);
  });
});
