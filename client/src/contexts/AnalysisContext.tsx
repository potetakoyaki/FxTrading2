import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { parseCSV, type TradeRecord } from "@/lib/csvParser";
import {
  calculateMetrics,
  calculateStrategyScore,
  analyzeBySymbol,
  analyzeByTimeSlot,
  analyzeByDayOfWeek,
  analyzeLotSizeCorrelation,
  analyzeLosingStreakPattern,
  analyzeTradeQuality,
  calculateWinLossDistribution,
  analyzeLowQualityTradeImpact,
  findWeaknesses,
  generateSuggestions,
  calculateEquityCurve,
  diagnoseRisk,
  type PerformanceMetrics,
  type StrategyScore,
  type SymbolAnalysis,
  type TimeSlotAnalysis,
  type DayOfWeekAnalysis,
  type LotSizeGroup,
  type LosingStreakPattern,
  type TradeQualityAnalysis,
  type WinLossDistribution,
  type LowQualityTradeImpact,
  type WeaknessItem,
  type ImprovementSuggestion,
  type EquityCurvePoint,
  type RiskDiagnosis,
} from "@/lib/analysis";
import {
  runMonteCarloSimulation,
  calculateDrawdownDistribution,
  type MonteCarloResult,
  type DrawdownDistribution,
} from "@/lib/simulation";

export type AnalysisState = "idle" | "loading" | "done" | "error";

interface AnalysisContextType {
  state: AnalysisState;
  trades: TradeRecord[];
  metrics: PerformanceMetrics | null;
  score: StrategyScore | null;
  symbolAnalysis: SymbolAnalysis[];
  timeSlotAnalysis: TimeSlotAnalysis[];
  dayOfWeekAnalysis: DayOfWeekAnalysis[];
  lotSizeAnalysis: LotSizeGroup[];
  losingStreakPattern: LosingStreakPattern[];
  tradeQuality: TradeQualityAnalysis | null;
  winLossDistribution: WinLossDistribution | null;
  lowQualityImpact: LowQualityTradeImpact[];
  weaknesses: WeaknessItem[];
  suggestions: ImprovementSuggestion[];
  equityCurve: EquityCurvePoint[];
  monteCarloResult: MonteCarloResult | null;
  drawdownDist: DrawdownDistribution | null;
  riskDiagnosis: RiskDiagnosis | null;
  errors: string[];
  fileName: string;
  initialBalance: number;
  analyzeCSV: (csvText: string, fileName: string) => void;
  reanalyze: () => void;
  reset: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [state, setState] = useState<AnalysisState>("idle");
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [score, setScore] = useState<StrategyScore | null>(null);
  const [symbolAnalysis, setSymbolAnalysis] = useState<SymbolAnalysis[]>([]);
  const [timeSlotAnalysis, setTimeSlotAnalysis] = useState<TimeSlotAnalysis[]>([]);
  const [dayOfWeekAnalysis, setDayOfWeekAnalysis] = useState<DayOfWeekAnalysis[]>([]);
  const [lotSizeAnalysis, setLotSizeAnalysis] = useState<LotSizeGroup[]>([]);
  const [losingStreakPattern, setLosingStreakPattern] = useState<LosingStreakPattern[]>([]);
  const [tradeQuality, setTradeQuality] = useState<TradeQualityAnalysis | null>(null);
  const [winLossDistribution, setWinLossDistribution] = useState<WinLossDistribution | null>(null);
  const [lowQualityImpact, setLowQualityImpact] = useState<LowQualityTradeImpact[]>([]);
  const [weaknesses, setWeaknesses] = useState<WeaknessItem[]>([]);
  const [suggestions, setSuggestions] = useState<ImprovementSuggestion[]>([]);
  const [equityCurve, setEquityCurve] = useState<EquityCurvePoint[]>([]);
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloResult | null>(null);
  const [drawdownDist, setDrawdownDist] = useState<DrawdownDistribution | null>(null);
  const [riskDiagnosis, setRiskDiagnosis] = useState<RiskDiagnosis | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [rawCsvText, setRawCsvText] = useState("");
  const [initialBal, setInitialBal] = useState(0);

  const runAnalysis = useCallback((csvText: string, name: string, lang: typeof language) => {
    setState("loading");
    setFileName(name);
    setRawCsvText(csvText);

    setTimeout(() => {
      try {
        const { trades: parsedTrades, errors: parseErrors, initialBalance } = parseCSV(csvText);

        if (parseErrors.length > 0 && parsedTrades.length === 0) {
          setErrors(parseErrors);
          setState("error");
          return;
        }

        const m = calculateMetrics(parsedTrades, initialBalance);
        const s = calculateStrategyScore(m);
        const sa = analyzeBySymbol(parsedTrades);
        const ta = analyzeByTimeSlot(parsedTrades);
        const dw = analyzeByDayOfWeek(parsedTrades, lang);
        const ls = analyzeLotSizeCorrelation(parsedTrades, lang);
        const lsp = analyzeLosingStreakPattern(parsedTrades);
        const tq = analyzeTradeQuality(parsedTrades);
        const wld = calculateWinLossDistribution(parsedTrades);
        const w = findWeaknesses(sa, ta, lang);
        const lqi = analyzeLowQualityTradeImpact(parsedTrades, m);
        const sug = generateSuggestions(m, w, lang, tq, ls, dw, ta, lqi, parsedTrades);
        const ec = calculateEquityCurve(parsedTrades, initialBalance);
        const mc = runMonteCarloSimulation(parsedTrades, 1000, initialBalance);
        const dd = calculateDrawdownDistribution(parsedTrades, initialBalance);
        const rd = diagnoseRisk(m, lang);

        setTrades(parsedTrades);
        setInitialBal(initialBalance);
        setMetrics(m);
        setScore(s);
        setSymbolAnalysis(sa);
        setTimeSlotAnalysis(ta);
        setDayOfWeekAnalysis(dw);
        setLotSizeAnalysis(ls);
        setLosingStreakPattern(lsp);
        setTradeQuality(tq);
        setWinLossDistribution(wld);
        setLowQualityImpact(lqi);
        setWeaknesses(w);
        setSuggestions(sug);
        setEquityCurve(ec);
        setMonteCarloResult(mc);
        setDrawdownDist(dd);
        setRiskDiagnosis(rd);
        setErrors(parseErrors);
        setState("done");
      } catch (err) {
        const errMsg = lang === "ja"
          ? `分析中にエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`
          : `Error during analysis: ${err instanceof Error ? err.message : String(err)}`;
        setErrors([errMsg]);
        setState("error");
      }
    }, 100);
  }, []);

  const analyzeCSV = useCallback((csvText: string, name: string) => {
    runAnalysis(csvText, name, language);
  }, [language, runAnalysis]);

  // Re-analyze with current language when language changes
  const reanalyze = useCallback(() => {
    if (rawCsvText && fileName && state === "done") {
      runAnalysis(rawCsvText, fileName, language);
    }
  }, [rawCsvText, fileName, state, language, runAnalysis]);

  // Auto re-analyze when language changes
  const prevLangRef = useRef(language);
  useEffect(() => {
    if (prevLangRef.current !== language && rawCsvText && fileName) {
      prevLangRef.current = language;
      runAnalysis(rawCsvText, fileName, language);
    }
  }, [language, rawCsvText, fileName, runAnalysis]);

  const reset = useCallback(() => {
    setState("idle");
    setTrades([]);
    setMetrics(null);
    setScore(null);
    setSymbolAnalysis([]);
    setTimeSlotAnalysis([]);
    setDayOfWeekAnalysis([]);
    setLotSizeAnalysis([]);
    setLosingStreakPattern([]);
    setTradeQuality(null);
    setWinLossDistribution(null);
    setLowQualityImpact([]);
    setWeaknesses([]);
    setSuggestions([]);
    setEquityCurve([]);
    setMonteCarloResult(null);
    setDrawdownDist(null);
    setRiskDiagnosis(null);
    setErrors([]);
    setFileName("");
    setRawCsvText("");
    setInitialBal(0);
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        state, trades, metrics, score, symbolAnalysis, timeSlotAnalysis,
        dayOfWeekAnalysis, lotSizeAnalysis, losingStreakPattern,
        tradeQuality, winLossDistribution, lowQualityImpact,
        weaknesses, suggestions, equityCurve, monteCarloResult, drawdownDist,
        riskDiagnosis, errors, fileName, initialBalance: initialBal,
        analyzeCSV, reanalyze, reset,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}
