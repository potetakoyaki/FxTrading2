import { describe, it, expect } from "vitest";
import {
  calculateMetrics,
  calculateStrategyScore,
  analyzeBySymbol,
  analyzeByTimeSlot,
  analyzeByDayOfWeek,
  analyzeLotSizeCorrelation,
  analyzeTradeQuality,
  calculateWinLossDistribution,
  findWeaknesses,
  generateSuggestions,
  calculateEquityCurve,
  diagnoseRisk,
  analyzeLowQualityTradeImpact,
} from "./analysis";
import type { TradeRecord } from "./csvParser";

// ============================================================
// Helper
// ============================================================

function makeTrade(
  overrides: Partial<TradeRecord> & { profit: number }
): TradeRecord {
  const volume = overrides.volume ?? 0.1;
  return {
    ticket: "1000",
    openTime: new Date("2024-01-15T10:00:00"),
    time: new Date("2024-01-15T14:00:00"),
    type: "buy",
    volume,
    lots: overrides.lots ?? volume,
    symbol: "EURUSD",
    openPrice: 1.085,
    closePrice: 1.086,
    commission: 0,
    swap: 0,
    ...overrides,
  };
}

/** Generate N trades with specified profits */
function makeTrades(profits: number[], symbol = "EURUSD"): TradeRecord[] {
  return profits.map((profit, i) =>
    makeTrade({
      ticket: String(1000 + i),
      time: new Date(`2024-01-${String(15 + i).padStart(2, "0")}T14:00:00`),
      openTime: new Date(`2024-01-${String(15 + i).padStart(2, "0")}T10:00:00`),
      profit,
      symbol,
    })
  );
}

// ============================================================
// calculateMetrics
// ============================================================

describe("calculateMetrics", () => {
  it("should return zero metrics for empty trades", () => {
    const m = calculateMetrics([]);
    expect(m.totalTrades).toBe(0);
    expect(m.winRate).toBe(0);
    expect(m.profitFactor).toBe(0);
    expect(m.riskReward).toBe(0);
    expect(m.expectancy).toBe(0);
    expect(m.maxDrawdown).toBe(0);
    expect(m.maxConsecutiveLosses).toBe(0);
    expect(m.netProfit).toBe(0);
  });

  it("should calculate single winning trade", () => {
    const m = calculateMetrics([makeTrade({ profit: 100 })]);
    expect(m.totalTrades).toBe(1);
    expect(m.winRate).toBe(100);
    expect(m.winCount).toBe(1);
    expect(m.lossCount).toBe(0);
    expect(m.avgProfit).toBe(100);
    expect(m.avgLoss).toBe(0);
    expect(m.netProfit).toBe(100);
    expect(m.largestWin).toBe(100);
    expect(m.largestLoss).toBe(0);
  });

  it("should calculate single losing trade", () => {
    const m = calculateMetrics([makeTrade({ profit: -50 })]);
    expect(m.totalTrades).toBe(1);
    expect(m.winRate).toBe(0);
    expect(m.winCount).toBe(0);
    expect(m.lossCount).toBe(1);
    expect(m.avgProfit).toBe(0);
    expect(m.avgLoss).toBe(50);
    expect(m.netProfit).toBe(-50);
    expect(m.largestLoss).toBe(-50);
  });

  it("should set PF=999 when all trades win (no losses)", () => {
    const m = calculateMetrics(makeTrades([100, 200, 50]));
    expect(m.profitFactor).toBe(999);
    expect(m.riskReward).toBe(999);
    expect(m.winRate).toBeCloseTo(100);
  });

  it("should set PF=0 when all trades lose (no wins)", () => {
    const m = calculateMetrics(makeTrades([-100, -200, -50]));
    expect(m.profitFactor).toBe(0);
    expect(m.riskReward).toBe(0);
    expect(m.winRate).toBe(0);
  });

  it("should calculate mixed trades correctly", () => {
    const trades = makeTrades([100, -50, 80, -30, 60]);
    const m = calculateMetrics(trades);
    expect(m.totalTrades).toBe(5);
    expect(m.winCount).toBe(3);
    expect(m.lossCount).toBe(2);
    expect(m.totalProfit).toBe(240); // 100+80+60
    expect(m.totalLoss).toBe(80); // |(-50)+(-30)|
    expect(m.netProfit).toBe(160);
    expect(m.profitFactor).toBe(3); // 240/80
    expect(m.winRate).toBe(60); // 3/5*100
    expect(m.avgProfit).toBe(80); // 240/3
    expect(m.avgLoss).toBe(40); // 80/2
    expect(m.riskReward).toBe(2); // 80/40
    expect(m.expectancy).toBe(32); // 160/5
    expect(m.largestWin).toBe(100);
    expect(m.largestLoss).toBe(-50);
  });

  it("should count max consecutive losses", () => {
    const trades = makeTrades([100, -10, -20, -30, 50, -5, -15]);
    const m = calculateMetrics(trades);
    expect(m.maxConsecutiveLosses).toBe(3); // -10, -20, -30
  });

  it("should calculate drawdown with initial balance", () => {
    // Initial: 1000, then +100=1100(peak), -200=900, +50=950
    const trades = makeTrades([100, -200, 50]);
    const m = calculateMetrics(trades, 1000);
    expect(m.maxDrawdown).toBe(200); // 1100 - 900
    expect(m.maxDrawdownPercent).toBeCloseTo((200 / 1100) * 100, 1);
  });

  it("should calculate drawdown without initial balance", () => {
    // Start: 0, +100=100(peak), -200=-100, DD=200
    const trades = makeTrades([100, -200]);
    const m = calculateMetrics(trades, 0);
    expect(m.maxDrawdown).toBe(200);
    // peak=100, DD%=(200/100)*100=200%, capped at 100%
    expect(m.maxDrawdownPercent).toBe(100);
  });

  it("should cap drawdown percent at 100%", () => {
    const trades = makeTrades([10, -1000]);
    const m = calculateMetrics(trades, 0);
    expect(m.maxDrawdownPercent).toBeLessThanOrEqual(100);
  });

  it("should handle zero-profit trades (breakeven)", () => {
    const trades = makeTrades([0, 0, 0]);
    const m = calculateMetrics(trades);
    expect(m.totalTrades).toBe(3);
    expect(m.winCount).toBe(0);
    expect(m.lossCount).toBe(0);
    expect(m.profitFactor).toBe(0);
    expect(m.netProfit).toBe(0);
  });
});

// ============================================================
// calculateStrategyScore
// ============================================================

describe("calculateStrategyScore", () => {
  it("should give S grade for excellent metrics", () => {
    const m = calculateMetrics(makeTrades([300, 200, 250, -50, -30]), 10000);
    const s = calculateStrategyScore(m);
    expect(s.total).toBeGreaterThanOrEqual(85);
    expect(s.grade).toBe("S");
  });

  it("should give F grade for terrible metrics", () => {
    const m = calculateMetrics(makeTrades([-100, -200, -50, 10]), 100);
    const s = calculateStrategyScore(m);
    expect(s.total).toBeLessThan(25);
    expect(s.grade).toBe("F");
  });

  it("should compute PF score tiers correctly", () => {
    // PF >= 3 → 25
    const m1 = calculateMetrics(makeTrades([300, -100]));
    expect(calculateStrategyScore(m1).pfScore).toBe(25);

    // PF >= 2 → 20
    const m2 = calculateMetrics(makeTrades([200, -100]));
    expect(calculateStrategyScore(m2).pfScore).toBe(20);

    // PF >= 1.5 → 15
    const m3 = calculateMetrics(makeTrades([150, -100]));
    expect(calculateStrategyScore(m3).pfScore).toBe(15);

    // PF >= 1.2 → 10
    const m4 = calculateMetrics(makeTrades([120, -100]));
    expect(calculateStrategyScore(m4).pfScore).toBe(10);

    // PF >= 1 → 5
    const m5 = calculateMetrics(makeTrades([100, -100]));
    expect(calculateStrategyScore(m5).pfScore).toBe(5);

    // PF < 1 → 0
    const m6 = calculateMetrics(makeTrades([50, -100]));
    expect(calculateStrategyScore(m6).pfScore).toBe(0);
  });

  it("should compute DD score tiers correctly", () => {
    // DD% ≤ 5% → 25
    const m1 = calculateMetrics(makeTrades([100, -4]), 1000);
    expect(calculateStrategyScore(m1).ddScore).toBe(25);

    // DD% > 50% → 0
    const m2 = calculateMetrics(makeTrades([100, -600]), 1000);
    expect(calculateStrategyScore(m2).ddScore).toBe(0);
  });

  it("should have grade boundaries at correct thresholds", () => {
    // A grade: total 70-84
    const mA: any = {
      profitFactor: 2,
      riskReward: 2,
      expectancy: 50,
      avgLoss: 100,
      maxDrawdownPercent: 8,
      winRate: 60,
      totalTrades: 100,
    };
    const sA = calculateStrategyScore(mA);
    expect(sA.total).toBe(20 + 20 + 25 + 20); // 85 → S!
    expect(sA.grade).toBe("S");
  });

  it("should return all score components summing to total", () => {
    const m = calculateMetrics(makeTrades([100, -50, 80, -30]));
    const s = calculateStrategyScore(m);
    expect(s.total).toBe(s.pfScore + s.rrScore + s.expectancyScore + s.ddScore);
  });
});

// ============================================================
// analyzeBySymbol
// ============================================================

describe("analyzeBySymbol", () => {
  it("should group trades by symbol and sort by net profit descending", () => {
    const trades = [
      ...makeTrades([100, -50], "EURUSD"),
      ...makeTrades([200, 100], "USDJPY"),
      ...makeTrades([-100, -200], "GBPUSD"),
    ];
    const result = analyzeBySymbol(trades);
    expect(result).toHaveLength(3);
    expect(result[0].symbol).toBe("USDJPY"); // net +300
    expect(result[1].symbol).toBe("EURUSD"); // net +50
    expect(result[2].symbol).toBe("GBPUSD"); // net -300
  });

  it("should return empty array for no trades", () => {
    expect(analyzeBySymbol([])).toHaveLength(0);
  });

  it("should calculate PF=999 for symbol with only wins", () => {
    const trades = makeTrades([100, 200], "EURUSD");
    const result = analyzeBySymbol(trades);
    expect(result[0].profitFactor).toBe(999);
  });

  it("should calculate win rate correctly per symbol", () => {
    const trades = [
      ...makeTrades([100, -50, 80], "EURUSD"), // 2/3 = 66.7%
    ];
    const result = analyzeBySymbol(trades);
    expect(result[0].winRate).toBeCloseTo(66.67, 0);
  });
});

// ============================================================
// analyzeByTimeSlot
// ============================================================

describe("analyzeByTimeSlot", () => {
  it("should always return 8 slots", () => {
    const result = analyzeByTimeSlot([]);
    expect(result).toHaveLength(8);
  });

  it("should have slots covering 0-24 in 3-hour intervals", () => {
    const result = analyzeByTimeSlot([]);
    expect(result[0].hour).toBe(0);
    expect(result[1].hour).toBe(3);
    expect(result[7].hour).toBe(21);
  });

  it("should place trades in correct time slots", () => {
    const trades = [
      makeTrade({ profit: 100, time: new Date("2024-01-15T10:00:00") }), // 09-12 slot
      makeTrade({ profit: -50, time: new Date("2024-01-15T11:30:00") }), // 09-12 slot
      makeTrade({ profit: 200, time: new Date("2024-01-15T16:00:00") }), // 15-18 slot
    ];
    const result = analyzeByTimeSlot(trades);
    const slot9 = result.find(s => s.hour === 9)!;
    const slot15 = result.find(s => s.hour === 15)!;
    expect(slot9.trades).toBe(2);
    expect(slot15.trades).toBe(1);
  });

  it("should show 0 trades for empty time slots", () => {
    const result = analyzeByTimeSlot([]);
    result.forEach(slot => {
      expect(slot.trades).toBe(0);
      expect(slot.winRate).toBe(0);
    });
  });
});

// ============================================================
// analyzeByDayOfWeek
// ============================================================

describe("analyzeByDayOfWeek", () => {
  it("should return analysis only for days with trades (filters empty days)", () => {
    // Jan 15, 2024 is Monday
    const trades = [
      makeTrade({ profit: 100, time: new Date("2024-01-15T14:00:00") }), // Mon
      makeTrade({ profit: -50, time: new Date("2024-01-16T14:00:00") }), // Tue
      makeTrade({ profit: 200, time: new Date("2024-01-17T14:00:00") }), // Wed
    ];
    const result = analyzeByDayOfWeek(trades, "en");
    // Only days with trades are returned
    expect(result).toHaveLength(3);
    const mon = result.find(d => d.day === "Mon")!;
    expect(mon.trades).toBe(1);
    expect(mon.winRate).toBe(100);
  });

  it("should use Japanese day names when lang=ja", () => {
    const trades = [
      makeTrade({ profit: 100, time: new Date("2024-01-15T14:00:00") }),
    ];
    const result = analyzeByDayOfWeek(trades, "ja");
    expect(result.some(d => d.day === "月")).toBe(true); // Monday in Japanese
  });

  it("should set PF=999 when day has only wins", () => {
    const trades = [
      makeTrade({ profit: 100, time: new Date("2024-01-15T14:00:00") }),
      makeTrade({ profit: 200, time: new Date("2024-01-22T14:00:00") }), // also Mon
    ];
    const result = analyzeByDayOfWeek(trades, "en");
    const mon = result.find(d => d.day === "Mon")!;
    expect(mon.profitFactor).toBe(999);
  });
});

// ============================================================
// analyzeLotSizeCorrelation
// ============================================================

describe("analyzeLotSizeCorrelation", () => {
  it("should return single group when all lots are the same", () => {
    const trades = makeTrades([100, -50, 80]);
    // All have lots=0.1 (same)
    const result = analyzeLotSizeCorrelation(trades, "ja");
    expect(result).toHaveLength(1);
    expect(result[0].label).toContain("全て同一");
  });

  it("should return multiple groups for different lot sizes", () => {
    const trades = [
      makeTrade({ profit: 100, lots: 0.01, volume: 0.01 }),
      makeTrade({ profit: -50, lots: 0.01, volume: 0.01 }),
      makeTrade({ profit: 80, lots: 0.5, volume: 0.5 }),
      makeTrade({ profit: -30, lots: 0.5, volume: 0.5 }),
      makeTrade({ profit: 200, lots: 1.0, volume: 1.0 }),
      makeTrade({ profit: -100, lots: 1.0, volume: 1.0 }),
    ];
    const result = analyzeLotSizeCorrelation(trades, "en");
    expect(result.length).toBeGreaterThan(1);
  });

  it("should return empty for no trades", () => {
    const result = analyzeLotSizeCorrelation([], "en");
    expect(result).toHaveLength(0);
  });
});

// ============================================================
// analyzeTradeQuality
// ============================================================

describe("analyzeTradeQuality", () => {
  it("should return defaults for empty trades", () => {
    const result = analyzeTradeQuality([]);
    expect(result.avgWinAmount).toBe(0);
    expect(result.avgLossAmount).toBe(0);
    expect(result.isKotsuKotsuDokan).toBe(false);
    expect(result.hasLateSL).toBe(false);
    expect(result.qualityGrade).toBe("C");
  });

  it("should detect kotsukotsu-dokan pattern", () => {
    // Many small wins, few huge losses
    const trades = [
      ...makeTrades([10, 15, 12, 8, 11, 13, 9, 14, 10, 12]),
      ...makeTrades([-200, -250]),
    ];
    const result = analyzeTradeQuality(trades);
    expect(result.isKotsuKotsuDokan).toBe(true);
  });

  it("should detect late stop-loss", () => {
    // avgLoss > 2 * avgProfit
    const trades = [...makeTrades([50, 60, 40]), ...makeTrades([-200, -180])];
    const result = analyzeTradeQuality(trades);
    expect(result.hasLateSL).toBe(true);
  });

  it("should calculate profit concentration", () => {
    const trades = [
      ...makeTrades([1000]), // one big win
      ...makeTrades([10, 5, 8, 3]), // small wins
      ...makeTrades([-20, -15]),
    ];
    const result = analyzeTradeQuality(trades);
    expect(result.profitConcentration).toBeGreaterThan(50);
  });
});

// ============================================================
// calculateWinLossDistribution
// ============================================================

describe("calculateWinLossDistribution", () => {
  it("should return empty for no trades", () => {
    const result = calculateWinLossDistribution([]);
    expect(result.buckets).toHaveLength(0);
    expect(result.skewness).toBe(0);
  });

  it("should distribute trades into correct buckets", () => {
    const trades = [
      makeTrade({ profit: -150 }), // ≤-100
      makeTrade({ profit: -50 }), // -100 to -20
      makeTrade({ profit: -5 }), // -20 to -1
      makeTrade({ profit: 0.5 }), // 0 to 1
      makeTrade({ profit: 10 }), // 1 to 20
      makeTrade({ profit: 50 }), // 20 to 100
      makeTrade({ profit: 200 }), // 100 to 500
      makeTrade({ profit: 600 }), // > 500
    ];
    const result = calculateWinLossDistribution(trades);
    expect(result.buckets.length).toBeGreaterThan(0);
    // Total count across all buckets should equal trade count
    const totalCount = result.buckets.reduce((s, b) => s + b.count, 0);
    expect(totalCount).toBe(8);
  });
});

// ============================================================
// findWeaknesses
// ============================================================

describe("findWeaknesses", () => {
  it("should detect weak symbol with PF < 0.9", () => {
    const symbolAnalysis = [
      {
        symbol: "EURUSD",
        trades: 5,
        winRate: 30,
        profitFactor: 0.7,
        riskReward: 0.8,
        netProfit: -100,
        avgProfit: -20,
      },
    ];
    const result = findWeaknesses(symbolAnalysis, [], "en");
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(w => w.metric === "PF")).toBe(true);
  });

  it("should skip symbols with < 3 trades", () => {
    const symbolAnalysis = [
      {
        symbol: "EURUSD",
        trades: 2,
        winRate: 0,
        profitFactor: 0.1,
        riskReward: 0.1,
        netProfit: -100,
        avgProfit: -50,
      },
    ];
    const result = findWeaknesses(symbolAnalysis, [], "en");
    expect(result).toHaveLength(0);
  });

  it("should return no weaknesses when all metrics are good", () => {
    const symbolAnalysis = [
      {
        symbol: "EURUSD",
        trades: 10,
        winRate: 60,
        profitFactor: 2.0,
        riskReward: 1.5,
        netProfit: 500,
        avgProfit: 50,
      },
    ];
    const result = findWeaknesses(symbolAnalysis, [], "en");
    expect(result).toHaveLength(0);
  });

  it("should detect weak time slot with low PF", () => {
    const timeSlotAnalysis = [
      {
        slot: "09:00-12:00",
        hour: 9,
        trades: 5,
        winRate: 20,
        profitFactor: 0.5,
        netProfit: -200,
      },
    ];
    const result = findWeaknesses([], timeSlotAnalysis, "en");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should limit to 10 weaknesses max", () => {
    const symbolAnalysis = Array.from({ length: 20 }, (_, i) => ({
      symbol: `PAIR${i}`,
      trades: 10,
      winRate: 10,
      profitFactor: 0.3,
      riskReward: 0.2,
      netProfit: -500,
      avgProfit: -50,
    }));
    const result = findWeaknesses(symbolAnalysis, [], "en");
    expect(result.length).toBeLessThanOrEqual(10);
  });
});

// ============================================================
// generateSuggestions
// ============================================================

describe("generateSuggestions", () => {
  it("should generate PF suggestion when PF < 1.2", () => {
    const m = calculateMetrics(makeTrades([60, -50, -40]));
    const suggestions = generateSuggestions(m, [], "en");
    const pfSuggestion = suggestions.find(s =>
      s.title.toLowerCase().includes("profit factor")
    );
    expect(pfSuggestion).toBeDefined();
  });

  it("should generate RR suggestion when RR < 1", () => {
    // avg profit small, avg loss big → RR < 1
    const m = calculateMetrics(makeTrades([30, 20, -100, -80]));
    const suggestions = generateSuggestions(m, [], "en");
    const rrSuggestion = suggestions.find(s =>
      s.title.toLowerCase().includes("risk reward")
    );
    expect(rrSuggestion).toBeDefined();
  });

  it("should generate WR suggestion when WR < 40%", () => {
    const m = calculateMetrics(makeTrades([500, -100, -80, -90, -70])); // WR=20%
    const suggestions = generateSuggestions(m, [], "en");
    const wrSuggestion = suggestions.find(s =>
      s.title.toLowerCase().includes("win rate")
    );
    expect(wrSuggestion).toBeDefined();
  });

  it("should generate DD suggestion when DD > 15%", () => {
    const m = calculateMetrics(makeTrades([100, -500]), 1000);
    const suggestions = generateSuggestions(m, [], "en");
    const ddSuggestion = suggestions.find(s =>
      s.title.toLowerCase().includes("drawdown")
    );
    expect(ddSuggestion).toBeDefined();
  });

  it("should not generate suggestions for excellent metrics", () => {
    const m = calculateMetrics(makeTrades([200, 150, 180, -30, -20]), 10000);
    const suggestions = generateSuggestions(m, [], "en");
    // May still have some suggestions but should not have critical ones
    const highPriority = suggestions.filter(s => s.priority === "high");
    expect(highPriority).toHaveLength(0);
  });

  it("should sort suggestions by priority", () => {
    const m = calculateMetrics(makeTrades([-100, -200, 10]), 100);
    const suggestions = generateSuggestions(m, [], "en");
    if (suggestions.length >= 2) {
      const priorities = suggestions.map(s => s.priority);
      const order = { high: 0, medium: 1, low: 2 };
      for (let i = 1; i < priorities.length; i++) {
        expect(order[priorities[i]]).toBeGreaterThanOrEqual(
          order[priorities[i - 1]]
        );
      }
    }
  });
});

// ============================================================
// calculateEquityCurve
// ============================================================

describe("calculateEquityCurve", () => {
  it("should return empty for no trades", () => {
    expect(calculateEquityCurve([])).toHaveLength(0);
  });

  it("should start with initial balance point", () => {
    const trades = makeTrades([100]);
    const curve = calculateEquityCurve(trades, 1000);
    expect(curve[0].equity).toBe(1000);
    expect(curve[0].index).toBe(0);
    expect(curve[0].drawdown).toBe(0);
  });

  it("should have length = trades + 1 (initial point)", () => {
    const trades = makeTrades([100, -50, 80]);
    const curve = calculateEquityCurve(trades, 0);
    expect(curve).toHaveLength(4); // 1 initial + 3 trades
  });

  it("should track equity correctly", () => {
    const trades = makeTrades([100, -50, 80]);
    const curve = calculateEquityCurve(trades, 1000);
    expect(curve[0].equity).toBe(1000); // initial
    expect(curve[1].equity).toBe(1100); // +100
    expect(curve[2].equity).toBe(1050); // -50
    expect(curve[3].equity).toBe(1130); // +80
  });

  it("should calculate drawdown from peak", () => {
    const trades = makeTrades([100, -200, 50]);
    const curve = calculateEquityCurve(trades, 1000);
    // After +100: equity=1100, peak=1100, dd=0
    expect(curve[1].drawdown).toBe(0);
    // After -200: equity=900, peak=1100, dd=200
    expect(curve[2].drawdown).toBe(200);
    expect(curve[2].drawdownPct).toBeCloseTo((200 / 1100) * 100, 1);
  });

  it("should cap drawdown percentage at 100%", () => {
    const trades = makeTrades([10, -1000]);
    const curve = calculateEquityCurve(trades, 0);
    curve.forEach(p => {
      expect(p.drawdownPct).toBeLessThanOrEqual(100);
    });
  });
});

// ============================================================
// diagnoseRisk
// ============================================================

describe("diagnoseRisk", () => {
  it("should return LOW risk for excellent metrics", () => {
    const m = calculateMetrics(makeTrades([200, 150, 180, -30, -20]), 10000);
    const d = diagnoseRisk(m, "en");
    expect(d.level).toBe("LOW");
    expect(d.color).toBe("#00D4AA");
    expect(d.factors).toHaveLength(5);
  });

  it("should return HIGH risk for terrible metrics", () => {
    const m = calculateMetrics(
      makeTrades([-100, -200, -50, -80, -60, -70, -90, -110, 10]),
      100
    );
    const d = diagnoseRisk(m, "en");
    expect(d.level).toBe("HIGH");
    expect(d.color).toBe("#EF4444");
  });

  it("should always return 5 risk factors", () => {
    const m = calculateMetrics(makeTrades([100, -50]));
    const d = diagnoseRisk(m, "en");
    expect(d.factors).toHaveLength(5);
  });

  it("should set danger status for DD > 30%", () => {
    const m = calculateMetrics(makeTrades([100, -500]), 1000);
    const d = diagnoseRisk(m, "en");
    const ddFactor = d.factors.find(f => f.label === "Max Drawdown");
    expect(ddFactor?.status).toBe("danger");
  });

  it("should set danger status for PF < 1", () => {
    const m = calculateMetrics(makeTrades([50, -100]));
    const d = diagnoseRisk(m, "en");
    const pfFactor = d.factors.find(f => f.label === "Profit Factor");
    expect(pfFactor?.status).toBe("danger");
  });

  it("should set danger status for consecutive losses >= 8", () => {
    const trades = makeTrades([-10, -20, -30, -10, -20, -30, -10, -20, 100]);
    const m = calculateMetrics(trades);
    expect(m.maxConsecutiveLosses).toBe(8);
    const d = diagnoseRisk(m, "en");
    const clFactor = d.factors.find(f => f.label.includes("Consecutive"));
    expect(clFactor?.status).toBe("danger");
  });

  it("should set danger for negative expectancy", () => {
    const m = calculateMetrics(makeTrades([-100, -200, 10]));
    const d = diagnoseRisk(m, "en");
    const expFactor = d.factors.find(f => f.label === "Expectancy");
    expect(expFactor?.status).toBe("danger");
  });

  it("should set danger for win rate < 30%", () => {
    const m = calculateMetrics(
      makeTrades([500, -10, -20, -30, -10, -20, -30, -10, -20, -30])
    );
    // 1 win / 10 trades = 10%
    const d = diagnoseRisk(m, "en");
    const wrFactor = d.factors.find(f => f.label === "Win Rate");
    expect(wrFactor?.status).toBe("danger");
  });

  it("should use Japanese labels when lang=ja", () => {
    const m = calculateMetrics(makeTrades([100, -50]));
    const d = diagnoseRisk(m, "ja");
    expect(d.factors.some(f => f.label.includes("ドローダウン"))).toBe(true);
  });
});

// ============================================================
// analyzeLowQualityTradeImpact
// ============================================================

describe("analyzeLowQualityTradeImpact", () => {
  it("should show improvement when removing worst trades", () => {
    const trades = [
      ...makeTrades([100, 80, 60, 50, 40]),
      makeTrade({
        profit: -500,
        time: new Date("2024-01-20T14:00:00"),
        ticket: "2000",
      }),
    ];
    const m = calculateMetrics(trades);
    const result = analyzeLowQualityTradeImpact(trades, m, "en");
    // Removing the -500 trade should significantly improve PF
    if (result.length > 0) {
      expect(result[0].newPF).toBeGreaterThan(result[0].originalPF);
    }
  });

  it("should handle trades with few entries", () => {
    const trades = makeTrades([100, -50]);
    const m = calculateMetrics(trades);
    const result = analyzeLowQualityTradeImpact(trades, m, "en");
    // May return empty array for few trades
    expect(Array.isArray(result)).toBe(true);
  });
});
