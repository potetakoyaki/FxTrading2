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

interface ReportData {
  fileName: string;
  metrics: PerformanceMetrics;
  score: StrategyScore;
  symbolAnalysis: SymbolAnalysis[];
  timeSlotAnalysis: TimeSlotAnalysis[];
  weaknesses: WeaknessItem[];
  suggestions: ImprovementSuggestion[];
  monteCarloResult: MonteCarloResult;
  riskDiagnosis: RiskDiagnosis;
}

export function generateHTMLReport(data: ReportData): string {
  const {
    metrics,
    score,
    symbolAnalysis,
    timeSlotAnalysis,
    weaknesses,
    suggestions,
    monteCarloResult,
    riskDiagnosis,
  } = data;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FX Strategy Doctor - Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0A0E1A; color: #E2E8F0; line-height: 1.6; padding: 2rem; }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 1.8rem; color: #fff; margin-bottom: 0.5rem; }
  h2 { font-size: 1.2rem; color: #94A3B8; margin: 2rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #1E293B; text-transform: uppercase; letter-spacing: 0.1em; }
  .subtitle { color: #64748B; font-size: 0.9rem; margin-bottom: 2rem; }
  .score-section { text-align: center; padding: 2rem; background: #111827; border-radius: 12px; margin-bottom: 2rem; border: 1px solid #1E293B; }
  .score-value { font-size: 4rem; font-weight: 700; color: ${score.gradeColor}; }
  .score-grade { display: inline-block; padding: 0.3rem 1.2rem; border-radius: 20px; font-size: 1.2rem; font-weight: 700; background: ${score.gradeColor}20; color: ${score.gradeColor}; margin-top: 0.5rem; }
  .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .metric-card { background: #111827; border: 1px solid #1E293B; border-radius: 8px; padding: 1rem; }
  .metric-label { font-size: 0.75rem; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
  .metric-val { font-size: 1.5rem; font-weight: 700; font-family: monospace; margin-top: 0.3rem; }
  .profit { color: #00D4AA; }
  .loss { color: #FF4757; }
  .warning { color: #F59E0B; }
  .blue { color: #3B82F6; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
  th { text-align: left; padding: 0.6rem; font-size: 0.75rem; color: #64748B; text-transform: uppercase; border-bottom: 1px solid #1E293B; }
  td { padding: 0.6rem; font-size: 0.85rem; border-bottom: 1px solid #111827; }
  .risk-badge { display: inline-block; padding: 0.4rem 1rem; border-radius: 6px; font-weight: 700; font-size: 1.1rem; }
  .suggestion { border-left: 3px solid; padding: 0.8rem 1rem; margin-bottom: 0.8rem; background: #111827; border-radius: 0 6px 6px 0; }
  .weakness-item { display: flex; align-items: center; gap: 0.8rem; padding: 0.6rem; background: #111827; border-radius: 6px; margin-bottom: 0.5rem; }
  .severity { font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 3px; }
  .sev-high { background: #FF475720; color: #FF4757; }
  .sev-medium { background: #F59E0B20; color: #F59E0B; }
  .footer { text-align: center; color: #475569; font-size: 0.8rem; margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #1E293B; }
</style>
</head>
<body>
<div class="container">
  <h1>FX Strategy Doctor Report</h1>
  <div class="subtitle">File: ${data.fileName} | Generated: ${new Date().toLocaleString("ja-JP")}</div>

  <h2>Strategy Score</h2>
  <div class="score-section">
    <div class="score-value">${score.total}</div>
    <div>/100</div>
    <div class="score-grade">Grade ${score.grade}</div>
    <div style="margin-top:1rem;display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;font-size:0.8rem;">
      <div><div style="color:#64748B">PF</div><div>${score.pfScore}/25</div></div>
      <div><div style="color:#64748B">RR</div><div>${score.rrScore}/25</div></div>
      <div><div style="color:#64748B">期待値</div><div>${score.expectancyScore}/25</div></div>
      <div><div style="color:#64748B">DD</div><div>${score.ddScore}/25</div></div>
    </div>
  </div>

  <h2>Performance Metrics</h2>
  <div class="metrics-grid">
    <div class="metric-card"><div class="metric-label">トレード回数</div><div class="metric-val blue">${metrics.totalTrades}</div></div>
    <div class="metric-card"><div class="metric-label">勝率</div><div class="metric-val ${metrics.winRate >= 50 ? "profit" : "loss"}">${metrics.winRate.toFixed(1)}%</div></div>
    <div class="metric-card"><div class="metric-label">Profit Factor</div><div class="metric-val ${metrics.profitFactor >= 1 ? "profit" : "loss"}">${metrics.profitFactor.toFixed(2)}</div></div>
    <div class="metric-card"><div class="metric-label">Risk Reward</div><div class="metric-val ${metrics.riskReward >= 1 ? "profit" : "loss"}">${metrics.riskReward.toFixed(2)}</div></div>
    <div class="metric-card"><div class="metric-label">期待値</div><div class="metric-val ${metrics.expectancy > 0 ? "profit" : "loss"}">${metrics.expectancy.toFixed(2)}</div></div>
    <div class="metric-card"><div class="metric-label">純損益</div><div class="metric-val ${metrics.netProfit >= 0 ? "profit" : "loss"}">${metrics.netProfit.toFixed(2)}</div></div>
    <div class="metric-card"><div class="metric-label">最大DD</div><div class="metric-val warning">${metrics.maxDrawdown.toFixed(2)} (${metrics.maxDrawdownPercent.toFixed(1)}%)</div></div>
    <div class="metric-card"><div class="metric-label">最大勝ち/最大負け</div><div class="metric-val"><span class="profit">+${metrics.largestWin.toFixed(2)}</span> / <span class="loss">${metrics.largestLoss.toFixed(2)}</span></div></div>
  </div>

  <h2>Weakness Ranking</h2>
  ${
    weaknesses.length === 0
      ? "<p>重大な弱点は検出されませんでした。</p>"
      : weaknesses
          .slice(0, 5)
          .map(
            (w, i) => `
  <div class="weakness-item">
    <span style="color:#64748B;font-family:monospace;font-size:0.8rem;">#${i + 1}</span>
    <span class="severity sev-${w.severity}">${w.severity.toUpperCase()}</span>
    <div>
      <div style="font-weight:600;">${w.category}: ${w.target}</div>
      <div style="font-size:0.8rem;color:#64748B;">${w.issue}</div>
    </div>
  </div>`
          )
          .join("")
  }

  <h2>通貨ペア別分析</h2>
  <table>
    <thead><tr><th>Symbol</th><th style="text-align:right">Trades</th><th style="text-align:right">勝率</th><th style="text-align:right">PF</th><th style="text-align:right">損益</th></tr></thead>
    <tbody>
    ${symbolAnalysis
      .map(
        s => `<tr>
      <td style="font-family:monospace;font-weight:600;">${s.symbol}</td>
      <td style="text-align:right">${s.trades}</td>
      <td style="text-align:right" class="${s.winRate >= 50 ? "profit" : "loss"}">${s.winRate.toFixed(1)}%</td>
      <td style="text-align:right" class="${s.profitFactor >= 1 ? "profit" : "loss"}">${s.profitFactor >= 999 ? "999+" : s.profitFactor.toFixed(2)}</td>
      <td style="text-align:right;font-family:monospace" class="${s.netProfit >= 0 ? "profit" : "loss"}">${s.netProfit >= 0 ? "+" : ""}${s.netProfit.toFixed(2)}</td>
    </tr>`
      )
      .join("")}
    </tbody>
  </table>

  <h2>時間帯別分析</h2>
  <table>
    <thead><tr><th>時間帯</th><th style="text-align:right">Trades</th><th style="text-align:right">勝率</th><th style="text-align:right">PF</th><th style="text-align:right">損益</th></tr></thead>
    <tbody>
    ${timeSlotAnalysis
      .map(
        t => `<tr>
      <td style="font-family:monospace">${t.slot}</td>
      <td style="text-align:right">${t.trades}</td>
      <td style="text-align:right" class="${t.winRate >= 50 ? "profit" : "loss"}">${t.trades > 0 ? t.winRate.toFixed(1) + "%" : "-"}</td>
      <td style="text-align:right" class="${t.profitFactor >= 1 ? "profit" : "loss"}">${t.trades > 0 ? (t.profitFactor >= 999 ? "999+" : t.profitFactor.toFixed(2)) : "-"}</td>
      <td style="text-align:right;font-family:monospace" class="${t.netProfit >= 0 ? "profit" : "loss"}">${t.trades > 0 ? (t.netProfit >= 0 ? "+" : "") + t.netProfit.toFixed(2) : "-"}</td>
    </tr>`
      )
      .join("")}
    </tbody>
  </table>

  <h2>Monte Carlo Simulation</h2>
  <div class="metrics-grid">
    <div class="metric-card"><div class="metric-label">平均資金</div><div class="metric-val profit">${monteCarloResult.avgFinalEquity.toFixed(2)}</div></div>
    <div class="metric-card"><div class="metric-label">最悪資金</div><div class="metric-val loss">${monteCarloResult.worstFinalEquity.toFixed(2)}</div></div>
    <div class="metric-card"><div class="metric-label">最大DD</div><div class="metric-val warning">${monteCarloResult.maxDrawdown.toFixed(2)}</div></div>
    <div class="metric-card"><div class="metric-label">破綻確率</div><div class="metric-val ${monteCarloResult.bankruptcyRate > 10 ? "loss" : "profit"}">${monteCarloResult.bankruptcyRate.toFixed(1)}%</div></div>
  </div>

  <h2>Risk Diagnosis</h2>
  <div style="margin-bottom:1rem;">
    <span class="risk-badge" style="background:${riskDiagnosis.color}20;color:${riskDiagnosis.color};">${riskDiagnosis.level}</span>
  </div>
  ${riskDiagnosis.factors
    .map(
      f => `<div style="padding:0.6rem 0;font-size:0.9rem;color:#94A3B8;">
    <div style="font-weight:600;color:#E2E8F0;">${f.label}: <span class="${f.status === "danger" ? "loss" : f.status === "caution" ? "warning" : "profit"}">${f.value}</span> <span style="font-size:0.75rem;padding:0.15rem 0.4rem;border-radius:3px;background:${f.status === "danger" ? "#FF475720" : f.status === "caution" ? "#F59E0B20" : "#00D4AA20"};color:${f.status === "danger" ? "#FF4757" : f.status === "caution" ? "#F59E0B" : "#00D4AA"};">${f.statusLabel}</span></div>
    <div style="font-size:0.85rem;margin-top:0.2rem;">${f.description}</div>
  </div>`
    )
    .join("")}

  <h2>Improvement Suggestions</h2>
  ${suggestions
    .map(s => {
      const color =
        s.priority === "high"
          ? "#FF4757"
          : s.priority === "medium"
            ? "#F59E0B"
            : "#3B82F6";
      return `<div class="suggestion" style="border-color:${color}">
      <div style="font-weight:600;margin-bottom:0.3rem;">${s.title} <span style="font-size:0.7rem;color:#64748B;background:#1E293B;padding:0.1rem 0.4rem;border-radius:3px;">${s.category}</span></div>
      <div style="font-size:0.85rem;color:#94A3B8;">${s.description}</div>
    </div>`;
    })
    .join("")}

  <div class="footer">Generated by FX Strategy Doctor | ${new Date().toLocaleDateString("ja-JP")}</div>
</div>
</body>
</html>`;
}

export function generateMetricsCSV(metrics: PerformanceMetrics): string {
  const rows = [
    ["Metric", "Value"],
    ["Total Trades", metrics.totalTrades.toString()],
    ["Win Rate (%)", metrics.winRate.toFixed(2)],
    ["Avg Profit", metrics.avgProfit.toFixed(2)],
    ["Avg Loss", metrics.avgLoss.toFixed(2)],
    ["Profit Factor", metrics.profitFactor.toFixed(2)],
    ["Risk Reward", metrics.riskReward.toFixed(2)],
    ["Expectancy", metrics.expectancy.toFixed(2)],
    ["Max Drawdown", metrics.maxDrawdown.toFixed(2)],
    ["Max Drawdown %", metrics.maxDrawdownPercent.toFixed(2)],
    ["Max Consecutive Losses", metrics.maxConsecutiveLosses.toString()],
    ["Net Profit", metrics.netProfit.toFixed(2)],
    ["Gross Profit", metrics.grossProfit.toFixed(2)],
    ["Total Loss", metrics.totalLoss.toFixed(2)],
    ["Win Count", metrics.winCount.toString()],
    ["Loss Count", metrics.lossCount.toString()],
    ["Largest Win", metrics.largestWin.toFixed(2)],
    ["Largest Loss", metrics.largestLoss.toFixed(2)],
  ];
  return rows.map(r => r.join(",")).join("\n");
}

export function generateSummaryCSV(
  metrics: PerformanceMetrics,
  score: StrategyScore,
  symbolAnalysis: SymbolAnalysis[],
  monteCarloResult: MonteCarloResult,
  riskDiagnosis: RiskDiagnosis
): string {
  const rows: string[][] = [
    ["=== Strategy Summary ===", ""],
    ["Strategy Score", score.total.toString()],
    ["Grade", score.grade],
    ["Risk Level", riskDiagnosis.level],
    ["", ""],
    ["=== Key Metrics ===", ""],
    ["Total Trades", metrics.totalTrades.toString()],
    ["Win Rate", `${metrics.winRate.toFixed(2)}%`],
    ["Profit Factor", metrics.profitFactor.toFixed(2)],
    ["Risk Reward", metrics.riskReward.toFixed(2)],
    ["Expectancy", metrics.expectancy.toFixed(2)],
    ["Net Profit", metrics.netProfit.toFixed(2)],
    ["Max Drawdown", metrics.maxDrawdown.toFixed(2)],
    ["Max Drawdown %", `${metrics.maxDrawdownPercent.toFixed(2)}%`],
    ["Max Consecutive Losses", metrics.maxConsecutiveLosses.toString()],
    ["", ""],
    ["=== Monte Carlo (1000 trials) ===", ""],
    ["Avg Final Equity", monteCarloResult.avgFinalEquity.toFixed(2)],
    ["Worst Final Equity", monteCarloResult.worstFinalEquity.toFixed(2)],
    ["Best Final Equity", monteCarloResult.bestFinalEquity.toFixed(2)],
    ["Avg Max Drawdown", monteCarloResult.avgMaxDrawdown.toFixed(2)],
    ["Bankruptcy Rate", `${monteCarloResult.bankruptcyRate.toFixed(1)}%`],
    ["", ""],
    ["=== Symbol Analysis ===", ""],
    ["Symbol", "Trades", "Win Rate", "PF", "RR", "Net Profit"],
    ...symbolAnalysis.map(s => [
      s.symbol,
      s.trades.toString(),
      `${s.winRate.toFixed(2)}%`,
      s.profitFactor.toFixed(2),
      s.riskReward.toFixed(2),
      s.netProfit.toFixed(2),
    ]),
  ];
  return rows.map(r => r.join(",")).join("\n");
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Delay revoking so the browser has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
