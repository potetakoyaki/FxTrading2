import { describe, it, expect } from "vitest";
import {
  generateHTMLReport,
  generateMetricsCSV,
  generateSummaryCSV,
} from "./reportGenerator";
import type {
  PerformanceMetrics,
  StrategyScore,
  SymbolAnalysis,
  TimeSlotAnalysis,
  WeaknessItem,
  ImprovementSuggestion,
  RiskDiagnosis,
} from "./analysis";
import type { MonteCarloResult } from "./simulation";

// ============================================================
// Mock data
// ============================================================

const mockMetrics: PerformanceMetrics = {
  totalTrades: 100,
  winRate: 55,
  avgProfit: 150,
  avgLoss: 100,
  profitFactor: 1.65,
  riskReward: 1.5,
  expectancy: 32.5,
  maxDrawdown: 500,
  maxDrawdownPercent: 12.5,
  maxConsecutiveLosses: 4,
  totalProfit: 8250,
  totalLoss: 4500,
  grossProfit: 3750,
  netProfit: 3750,
  winCount: 55,
  lossCount: 45,
  largestWin: 500,
  largestLoss: -300,
  avgHoldingPeriod: 3600000,
};

const mockScore: StrategyScore = {
  total: 72,
  pfScore: 18,
  rrScore: 16,
  expectancyScore: 20,
  ddScore: 18,
  grade: "B",
  gradeColor: "#00D4AA",
};

const mockSymbolAnalysis: SymbolAnalysis[] = [
  {
    symbol: "USDJPY",
    trades: 40,
    winRate: 60,
    profitFactor: 2.1,
    riskReward: 1.8,
    netProfit: 2500,
    avgProfit: 62.5,
  },
  {
    symbol: "EURUSD",
    trades: 30,
    winRate: 50,
    profitFactor: 1.2,
    riskReward: 1.1,
    netProfit: 500,
    avgProfit: 16.67,
  },
  {
    symbol: "GBPUSD",
    trades: 30,
    winRate: 53.3,
    profitFactor: 1.4,
    riskReward: 1.3,
    netProfit: 750,
    avgProfit: 25,
  },
];

const mockTimeSlotAnalysis: TimeSlotAnalysis[] = [
  {
    slot: "09:00-12:00",
    hour: 9,
    trades: 35,
    winRate: 60,
    profitFactor: 2.0,
    netProfit: 1800,
  },
  {
    slot: "12:00-15:00",
    hour: 12,
    trades: 30,
    winRate: 50,
    profitFactor: 1.3,
    netProfit: 600,
  },
  {
    slot: "15:00-18:00",
    hour: 15,
    trades: 25,
    winRate: 52,
    profitFactor: 1.5,
    netProfit: 900,
  },
  {
    slot: "18:00-21:00",
    hour: 18,
    trades: 10,
    winRate: 40,
    profitFactor: 0.8,
    netProfit: -150,
  },
];

const mockWeaknesses: WeaknessItem[] = [
  {
    category: "リスク管理",
    target: "最大ドローダウン",
    issue: "最大DDが12.5%に達しています",
    severity: "medium",
    metric: "maxDrawdownPercent",
    value: 12.5,
  },
  {
    category: "エントリー",
    target: "損切り遅延",
    issue: "平均損失が大きい傾向があります",
    severity: "high",
    metric: "avgLoss",
    value: 100,
  },
];

const mockSuggestions: ImprovementSuggestion[] = [
  {
    title: "損切りラインの見直し",
    description: "損切り幅を狭めることで、リスクリワードの改善が期待できます。",
    priority: "high",
    category: "リスク管理",
  },
  {
    title: "時間帯の絞り込み",
    description:
      "夜間セッションの勝率が低いため、トレード時間を限定しましょう。",
    priority: "medium",
    category: "時間管理",
  },
];

const mockMonteCarloResult: MonteCarloResult = {
  paths: [
    [0, 100, 200],
    [0, -50, 80],
  ],
  avgFinalEquity: 5200,
  worstFinalEquity: -800,
  bestFinalEquity: 12000,
  maxDrawdown: 1500,
  avgMaxDrawdown: 600,
  bankruptcyRate: 3.5,
  profitProbability: 85,
  percentile95MaxDD: 1200,
  percentile5: 1000,
  percentile25: 3000,
  percentile50: 5000,
  percentile75: 7000,
  percentile95: 10000,
};

const mockRiskDiagnosis: RiskDiagnosis = {
  level: "MEDIUM",
  color: "#F59E0B",
  factors: [
    {
      label: "最大ドローダウン",
      status: "caution",
      statusLabel: "注意",
      description: "DDは許容範囲内ですが、注意が必要です。",
      action: "DDモニタリングを継続してください。",
      value: "12.5%",
    },
    {
      label: "Profit Factor",
      status: "ok",
      statusLabel: "良好",
      description: "PFは十分に高い水準です。",
      action: "現在の戦略を維持してください。",
      value: "1.65",
    },
  ],
};

function buildReportData(overrides: Record<string, unknown> = {}) {
  return {
    fileName: "test_trades.csv",
    metrics: mockMetrics,
    score: mockScore,
    symbolAnalysis: mockSymbolAnalysis,
    timeSlotAnalysis: mockTimeSlotAnalysis,
    weaknesses: mockWeaknesses,
    suggestions: mockSuggestions,
    monteCarloResult: mockMonteCarloResult,
    riskDiagnosis: mockRiskDiagnosis,
    ...overrides,
  };
}

// ============================================================
// generateHTMLReport
// ============================================================

describe("generateHTMLReport", () => {
  it("returns valid HTML containing <html> and </html>", () => {
    const html = generateHTMLReport(buildReportData());
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  it("contains strategy score value", () => {
    const html = generateHTMLReport(buildReportData());
    expect(html).toContain(">72<");
    expect(html).toContain("Grade B");
    expect(html).toContain("18/25"); // pfScore
    expect(html).toContain("16/25"); // rrScore
    expect(html).toContain("20/25"); // expectancyScore
  });

  it("contains metrics values (totalTrades, winRate, etc.)", () => {
    const html = generateHTMLReport(buildReportData());
    expect(html).toContain(">100<"); // totalTrades
    expect(html).toContain("55.0%"); // winRate
    expect(html).toContain("1.65"); // profitFactor
    expect(html).toContain("1.50"); // riskReward
    expect(html).toContain("32.50"); // expectancy
    expect(html).toContain("3750.00"); // netProfit
    expect(html).toContain("500.00"); // maxDrawdown
    expect(html).toContain("12.5%"); // maxDrawdownPercent
    expect(html).toContain("+500.00"); // largestWin
    expect(html).toContain("-300.00"); // largestLoss
  });

  it("contains symbol analysis table", () => {
    const html = generateHTMLReport(buildReportData());
    expect(html).toContain("USDJPY");
    expect(html).toContain("EURUSD");
    expect(html).toContain("GBPUSD");
    expect(html).toContain("通貨ペア別分析");
    // USDJPY row values
    expect(html).toContain("60.0%");
    expect(html).toContain("2.10"); // PF
    expect(html).toContain("+2500.00"); // netProfit
  });

  it("contains time slot analysis table", () => {
    const html = generateHTMLReport(buildReportData());
    expect(html).toContain("時間帯別分析");
    expect(html).toContain("09:00-12:00");
    expect(html).toContain("12:00-15:00");
    expect(html).toContain("15:00-18:00");
    expect(html).toContain("18:00-21:00");
  });

  it("contains weakness ranking", () => {
    const html = generateHTMLReport(buildReportData());
    expect(html).toContain("Weakness Ranking");
    expect(html).toContain("リスク管理");
    expect(html).toContain("最大ドローダウン");
    expect(html).toContain("損切り遅延");
    expect(html).toContain("MEDIUM");
    expect(html).toContain("HIGH");
  });

  it("contains suggestions", () => {
    const html = generateHTMLReport(buildReportData());
    expect(html).toContain("Improvement Suggestions");
    expect(html).toContain("損切りラインの見直し");
    expect(html).toContain("時間帯の絞り込み");
    expect(html).toContain("リスク管理");
    expect(html).toContain("時間管理");
  });

  it("contains risk diagnosis section", () => {
    const html = generateHTMLReport(buildReportData());
    expect(html).toContain("Risk Diagnosis");
    expect(html).toContain("MEDIUM");
    expect(html).toContain("最大ドローダウン");
    expect(html).toContain("12.5%");
    expect(html).toContain("注意");
    expect(html).toContain("良好");
  });

  it("contains Monte Carlo simulation section", () => {
    const html = generateHTMLReport(buildReportData());
    expect(html).toContain("Monte Carlo Simulation");
    expect(html).toContain("5200.00"); // avgFinalEquity
    expect(html).toContain("-800.00"); // worstFinalEquity
    expect(html).toContain("1500.00"); // maxDrawdown
    expect(html).toContain("3.5%"); // bankruptcyRate
  });

  it("handles empty weaknesses (shows no-weakness message)", () => {
    const html = generateHTMLReport(buildReportData({ weaknesses: [] }));
    expect(html).toContain("重大な弱点は検出されませんでした");
  });

  it("handles PF=999 (displays '999+')", () => {
    const symbolWith999: SymbolAnalysis[] = [
      {
        symbol: "USDJPY",
        trades: 10,
        winRate: 100,
        profitFactor: 999,
        riskReward: 3.0,
        netProfit: 5000,
        avgProfit: 500,
      },
    ];
    const html = generateHTMLReport(
      buildReportData({ symbolAnalysis: symbolWith999 })
    );
    expect(html).toContain("999+");
    expect(html).not.toContain(">999.00<");
  });

  it("handles PF=999 in time slot analysis (displays '999+')", () => {
    const timeWith999: TimeSlotAnalysis[] = [
      {
        slot: "09:00-12:00",
        hour: 9,
        trades: 5,
        winRate: 100,
        profitFactor: 999,
        netProfit: 1000,
      },
    ];
    const html = generateHTMLReport(
      buildReportData({ timeSlotAnalysis: timeWith999 })
    );
    expect(html).toContain("999+");
  });

  it("HTML-escapes special characters (XSS prevention)", () => {
    const xssData = buildReportData({
      fileName: '<script>alert("xss")</script>',
      weaknesses: [
        {
          category: '<img onerror="alert(1)">',
          target: "test&target",
          issue: 'issue "quoted"',
          severity: "high" as const,
          metric: "test",
          value: 0,
        },
      ],
      suggestions: [
        {
          title: "<b>bold</b>",
          description: "desc with <em>html</em>",
          priority: "high" as const,
          category: "cat&dog",
        },
      ],
    });
    const html = generateHTMLReport(xssData);
    expect(html).not.toContain('<script>alert("xss")</script>');
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
    expect(html).toContain("&quot;");
    expect(html).not.toContain("<img onerror=");
  });
});

// ============================================================
// generateMetricsCSV
// ============================================================

describe("generateMetricsCSV", () => {
  it("returns CSV with header row", () => {
    const csv = generateMetricsCSV(mockMetrics);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Metric,Value");
  });

  it("contains all 17 metric rows (plus header = 18 lines)", () => {
    const csv = generateMetricsCSV(mockMetrics);
    const lines = csv.split("\n");
    // header + 17 data rows = 18 lines
    expect(lines).toHaveLength(18);
  });

  it("values are correctly formatted", () => {
    const csv = generateMetricsCSV(mockMetrics);
    expect(csv).toContain("Total Trades,100");
    expect(csv).toContain("Win Rate (%),55.00");
    expect(csv).toContain("Avg Profit,150.00");
    expect(csv).toContain("Avg Loss,100.00");
    expect(csv).toContain("Profit Factor,1.65");
    expect(csv).toContain("Risk Reward,1.50");
    expect(csv).toContain("Expectancy,32.50");
    expect(csv).toContain("Max Drawdown,500.00");
    expect(csv).toContain("Max Drawdown %,12.50");
    expect(csv).toContain("Max Consecutive Losses,4");
    expect(csv).toContain("Net Profit,3750.00");
    expect(csv).toContain("Gross Profit,3750.00");
    expect(csv).toContain("Total Loss,4500.00");
    expect(csv).toContain("Win Count,55");
    expect(csv).toContain("Loss Count,45");
    expect(csv).toContain("Largest Win,500.00");
    expect(csv).toContain("Largest Loss,-300.00");
  });

  it("handles PF=999", () => {
    const metricsWithPF999 = { ...mockMetrics, profitFactor: 999 };
    const csv = generateMetricsCSV(metricsWithPF999);
    expect(csv).toContain("Profit Factor,999.00");
  });
});

// ============================================================
// generateSummaryCSV
// ============================================================

describe("generateSummaryCSV", () => {
  const csv = generateSummaryCSV(
    mockMetrics,
    mockScore,
    mockSymbolAnalysis,
    mockMonteCarloResult,
    mockRiskDiagnosis
  );

  it("contains section headers (=== ... ===)", () => {
    expect(csv).toContain("=== Strategy Summary ===");
    expect(csv).toContain("=== Key Metrics ===");
    expect(csv).toContain("=== Monte Carlo (1000 trials) ===");
    expect(csv).toContain("=== Symbol Analysis ===");
  });

  it("contains strategy summary section", () => {
    expect(csv).toContain("Strategy Score,72");
    expect(csv).toContain("Grade,B");
    expect(csv).toContain("Risk Level,MEDIUM");
  });

  it("contains key metrics section", () => {
    expect(csv).toContain("Total Trades,100");
    expect(csv).toContain("Win Rate,55.00%");
    expect(csv).toContain("Profit Factor,1.65");
    expect(csv).toContain("Risk Reward,1.50");
    expect(csv).toContain("Expectancy,32.50");
    expect(csv).toContain("Net Profit,3750.00");
    expect(csv).toContain("Max Drawdown,500.00");
    expect(csv).toContain("Max Drawdown %,12.50%");
    expect(csv).toContain("Max Consecutive Losses,4");
  });

  it("contains Monte Carlo section", () => {
    expect(csv).toContain("Avg Final Equity,5200.00");
    expect(csv).toContain("Worst Final Equity,-800.00");
    expect(csv).toContain("Best Final Equity,12000.00");
    expect(csv).toContain("Avg Max Drawdown,600.00");
    expect(csv).toContain("Bankruptcy Rate,3.5%");
  });

  it("contains symbol analysis section with header", () => {
    expect(csv).toContain("Symbol,Trades,Win Rate,PF,RR,Net Profit");
  });

  it("symbol rows have correct column count (6 columns)", () => {
    const lines = csv.split("\n");
    // Find symbol data rows — they come after the Symbol header row
    const symbolHeaderIndex = lines.findIndex(l =>
      l.startsWith("Symbol,Trades")
    );
    expect(symbolHeaderIndex).toBeGreaterThan(-1);

    const symbolRows = lines
      .slice(symbolHeaderIndex + 1)
      .filter(l => l.trim() !== "");
    expect(symbolRows.length).toBe(3); // USDJPY, EURUSD, GBPUSD

    symbolRows.forEach(row => {
      const cols = row.split(",");
      expect(cols).toHaveLength(6);
    });
  });

  it("symbol rows contain correct data", () => {
    expect(csv).toContain("USDJPY,40,60.00%,2.10,1.80,2500.00");
    expect(csv).toContain("EURUSD,30,50.00%,1.20,1.10,500.00");
    expect(csv).toContain("GBPUSD,30,53.30%,1.40,1.30,750.00");
  });
});
