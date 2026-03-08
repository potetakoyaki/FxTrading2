import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Language = "ja" | "en";

// Translation dictionary
const translations = {
  // Header
  "app.title": { ja: "FX Strategy Doctor", en: "FX Strategy Doctor" },
  "header.newAnalysis": { ja: "新規分析", en: "New Analysis" },
  "header.saveReport": { ja: "レポート保存", en: "Save Report" },

  // Hero
  "hero.badge": { ja: "MT4 / MT5 対応", en: "MT4 / MT5 Compatible" },
  "hero.title1": { ja: "あなたのFX戦略を", en: "Diagnose Your" },
  "hero.title2": { ja: "徹底診断", en: "FX Strategy" },
  "hero.desc": {
    ja: "トレード履歴ファイルをアップロードするだけで、戦略の強み・弱点・リスクを自動分析。CSV変換不要—ExcelやHTMLレポートもそのまま使えます。",
    en: "Upload your trade history to automatically analyze strengths, weaknesses, and risks. No CSV conversion needed\u2014Excel and HTML reports work directly.",
  },

  // Feature cards
  "feat.score.title": { ja: "戦略スコア", en: "Strategy Score" },
  "feat.score.desc": { ja: "PF・RR・期待値・DDから100点満点で評価", en: "Scored out of 100 based on PF, RR, Expectancy & DD" },
  "feat.weakness.title": { ja: "弱点分析", en: "Weakness Analysis" },
  "feat.weakness.desc": { ja: "通貨ペア別・時間帯別の弱点をランキング", en: "Ranked weaknesses by currency pair & time slot" },
  "feat.simulation.title": { ja: "資金シミュレーション", en: "Capital Simulation" },
  "feat.simulation.desc": { ja: "1,000回のモンテカルロで将来を予測", en: "1,000 Monte Carlo trials for future projection" },

  // How it works
  "howto.title": { ja: "使い方", en: "How It Works" },
  "howto.step1.title": { ja: "履歴をエクスポート", en: "Export History" },
  "howto.step1.desc": { ja: "MT4/MT5からトレード履歴をダウンロード（CSV/Excel/HTML）", en: "Download trade history from MT4/MT5 (CSV/Excel/HTML)" },
  "howto.step2.title": { ja: "アップロード", en: "Upload" },
  "howto.step2.desc": { ja: "ファイルをドラッグ&ドロップ（CSV変換不要）", en: "Drag & drop the file (no CSV conversion needed)" },
  "howto.step3.title": { ja: "分析結果を確認", en: "Review Results" },
  "howto.step3.desc": { ja: "戦略スコア・弱点・改善提案を即座に表示", en: "Instantly view strategy score, weaknesses & suggestions" },
  "howto.step4.title": { ja: "レポートをダウンロード", en: "Download Report" },
  "howto.step4.desc": { ja: "HTML/CSVレポートとして保存可能", en: "Save as HTML/CSV report" },

  // Uploader
  "upload.dropzone": { ja: "MT4 / MT5 トレード履歴ファイルをドロップ", en: "Drop MT4 / MT5 Trade History File" },
  "upload.click": { ja: "またはクリックしてファイルを選択", en: "or click to select a file" },
  "upload.format": { ja: "対応形式: CSV / Excel / HTML", en: "Format: CSV / Excel / HTML" },
  "upload.maxSize": { ja: "最大: 50MB", en: "Max: 50MB" },
  "upload.analyze": { ja: "分析する", en: "Analyze" },
  "upload.analyzing": { ja: "分析中...", en: "Analyzing..." },
  "upload.csvOnly": { ja: "CSVファイルのみアップロード可能です。", en: "Only CSV files are supported." },
  "upload.unsupported": { ja: "対応していないファイル形式です。CSV、Excel（.xlsx/.xls）、HTML（.htm）ファイルをアップロードしてください。", en: "Unsupported file format. Please upload CSV, Excel (.xlsx/.xls), or HTML (.htm) files." },
  "upload.tooLarge": { ja: "ファイルサイズが大きすぎます（最大50MB）。", en: "File is too large (max 50MB)." },
  "upload.sample": { ja: "サンプルデータで試す", en: "Try Sample Data" },

  // Dashboard
  "dash.title": { ja: "分析レポート", en: "Analysis Report" },
  "dash.tradesAnalyzed": { ja: "trades analyzed", en: "trades analyzed" },

  // Metrics
  "metric.totalTrades": { ja: "トレード回数", en: "Total Trades" },
  "metric.winRate": { ja: "勝率", en: "Win Rate" },
  "metric.pf": { ja: "Profit Factor", en: "Profit Factor" },
  "metric.rr": { ja: "Risk Reward", en: "Risk Reward" },
  "metric.expectancy": { ja: "期待値", en: "Expectancy" },
  "metric.netProfit": { ja: "純損益", en: "Net Profit" },
  "metric.maxDD": { ja: "最大ドローダウン", en: "Max Drawdown" },
  "metric.maxConsLoss": { ja: "最大連敗", en: "Max Consec. Losses" },
  "metric.largestWinLoss": { ja: "最大勝ち/最大負け", en: "Largest Win/Loss" },
  "metric.largestWinLossSub": { ja: "最良/最悪トレード", en: "Best / Worst Trade" },
  "metric.winCount": { ja: "勝ち", en: "Wins" },
  "metric.lossCount": { ja: "負け", en: "Losses" },
  "metric.grossProfit": { ja: "総利益 / 総損失", en: "Gross Profit / Loss" },
  "metric.avgProfit": { ja: "平均利益 / 平均損失", en: "Avg Profit / Avg Loss" },
  "metric.perTrade": { ja: "1トレードあたり", en: "Per Trade" },
  "metric.profit": { ja: "利益", en: "Profit" },
  "metric.loss": { ja: "損失", en: "Loss" },
  "metric.consecutiveLossTrades": { ja: "連続負けトレード", en: "Consecutive losing trades" },

  // Charts
  "chart.equityCurve": { ja: "EQUITY CURVE", en: "EQUITY CURVE" },
  "chart.equity": { ja: "資産", en: "Equity" },
  "chart.monteCarlo": { ja: "MONTE CARLO SIMULATION (1,000 TRIALS)", en: "MONTE CARLO SIMULATION (1,000 TRIALS)" },
  "chart.drawdownDist": { ja: "DRAWDOWN DISTRIBUTION", en: "DRAWDOWN DISTRIBUTION" },
  "chart.median": { ja: "中央値", en: "Median" },
  "chart.count": { ja: "回数", en: "Count" },
  "chart.medianFinal": { ja: "中央値リターン", en: "Median Return" },
  "chart.worstDD95": { ja: "95% 最大DD", en: "95% Worst DD" },
  "chart.profitProb": { ja: "利益確率", en: "Profit Prob." },
  "chart.bankruptcyRate": { ja: "破綻確率", en: "Bankruptcy Rate" },
  "chart.showMore": { ja: "他 {count} 件を表示", en: "Show {count} more" },
  "chart.showLess": { ja: "折りたたむ", en: "Show less" },
  "chart.tradeCount": { ja: "トレード数", en: "Trade Count" },
  "chart.frequency": { ja: "頻度", en: "Frequency" },

  // Analysis panels
  "panel.symbolAnalysis": { ja: "通貨ペア別分析", en: "Symbol Analysis" },
  "panel.timeSlotAnalysis": { ja: "時間帯別分析（3時間単位）", en: "Time Slot Analysis (3h)" },
  "panel.weaknessRanking": { ja: "弱点ランキング", en: "Weakness Ranking" },
  "panel.noWeakness": { ja: "重大な弱点は検出されませんでした。", en: "No significant weaknesses detected." },
  "panel.riskDiagnosis": { ja: "リスク診断", en: "Risk Diagnosis" },
  "panel.riskLow": { ja: "リスクは管理可能な範囲内です", en: "Risk is within manageable range" },
  "panel.riskMedium": { ja: "いくつかのリスク要因に注意が必要です", en: "Some risk factors require attention" },
  "panel.riskHigh": { ja: "重大なリスク要因が検出されました", en: "Critical risk factors detected" },
  "panel.suggestions": { ja: "改善提案", en: "Improvement Suggestions" },

  // Trade list
  "tradeList.title": { ja: "トレード一覧", en: "Trade List" },
  "tradeList.time": { ja: "決済時刻", en: "Close Time" },
  "tradeList.symbol": { ja: "通貨ペア", en: "Symbol" },
  "tradeList.type": { ja: "売買", en: "Type" },
  "tradeList.volume": { ja: "ロット", en: "Volume" },
  "tradeList.profit": { ja: "損益", en: "Profit" },
  "tradeList.cumProfit": { ja: "累計損益", en: "Cumulative P/L" },
  "tradeList.showing": { ja: "件表示中", en: "shown" },
  "tradeList.of": { ja: "/", en: "of" },
  "tradeList.prev": { ja: "前へ", en: "Prev" },
  "tradeList.next": { ja: "次へ", en: "Next" },
  "tradeList.sortAsc": { ja: "昇順", en: "Asc" },
  "tradeList.sortDesc": { ja: "降順", en: "Desc" },

  // Table headers
  "table.symbol": { ja: "Symbol", en: "Symbol" },
  "table.trades": { ja: "Trades", en: "Trades" },
  "table.winRate": { ja: "勝率", en: "Win Rate" },
  "table.pf": { ja: "PF", en: "PF" },
  "table.rr": { ja: "RR", en: "RR" },
  "table.profit": { ja: "損益", en: "P/L" },
  "table.timeSlot": { ja: "時間帯", en: "Time Slot" },

  // Error
  "error.title": { ja: "エラーが発生しました", en: "An error occurred" },
  "error.checkFormat": { ja: "CSVファイルの形式を確認してください。", en: "Please check the CSV file format." },
  "error.analysis": { ja: "分析中にエラーが発生しました", en: "An error occurred during analysis" },

  // Header actions
  "header.admin": { ja: "管理者", en: "Admin" },
  "header.logout": { ja: "ログアウト", en: "Logout" },

  // Footer
  "footer.text": { ja: "FX Strategy Doctor - トレード戦略評価ツール", en: "FX Strategy Doctor - Trade Strategy Evaluator" },
} as const;

export type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("ja");

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === "ja" ? "en" : "ja"));
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[language] || key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
