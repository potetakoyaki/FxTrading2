/**
 * Design: Trading Terminal - Bloomberg-inspired dark fintech UI
 * Main page with hero section, CSV upload, and analysis dashboard
 */
import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  FileText,
  RotateCcw,
  FileSpreadsheet,
  Languages,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalysisProvider, useAnalysis } from "@/contexts/AnalysisContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import CsvUploader from "@/components/CsvUploader";
import StrategyScoreGauge from "@/components/StrategyScoreGauge";
import MetricsPanel from "@/components/MetricsPanel";
import TradeListTable from "@/components/TradeListTable";
import {
  EquityCurveChart,
  MonteCarloChart,
  DrawdownDistChart,
} from "@/components/Charts";
import {
  WeaknessPanel,
  RiskPanel,
  SuggestionsPanel,
  SymbolAnalysisTable,
  TimeSlotAnalysisTable,
} from "@/components/AnalysisPanels";
import {
  DayOfWeekPanel,
  LotSizeCorrelationPanel,
  TradeQualityPanel,
  WinLossDistributionPanel,
  LowQualityTradeImpactPanel,
} from "@/components/AdvancedAnalysisPanels";
import { ImprovementSimulator } from "@/components/ImprovementSimulator";
import {
  generateHTMLReport,
  generateMetricsCSV,
  generateSummaryCSV,
  downloadFile,
} from "@/lib/reportGenerator";

const HERO_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663253742335/9THwtzJWhtqjLgwWgCKo96/hero-bg-TRem3RfKQMgVnHNfKT9dUd.webp";
const UPLOAD_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663253742335/9THwtzJWhtqjLgwWgCKo96/upload-illustration-VQkoys9SeZFwMPTop6Kb23.webp";

function HomeContent() {
  const {
    state,
    trades,
    metrics,
    score,
    symbolAnalysis,
    timeSlotAnalysis,
    dayOfWeekAnalysis,
    lotSizeAnalysis,
    tradeQuality,
    winLossDistribution,
    lowQualityImpact,
    weaknesses,
    suggestions,
    equityCurve,
    monteCarloResult,
    drawdownDist,
    riskDiagnosis,
    errors,
    fileName,
    initialBalance,
    reset,
  } = useAnalysis();
  const { t, language, toggleLanguage } = useLanguage();
  const { logout, username, isAdmin } = useAuth();

  const handleDownloadReport = useCallback(() => {
    if (!metrics || !score || !monteCarloResult || !riskDiagnosis) return;
    const html = generateHTMLReport({
      fileName,
      metrics,
      score,
      symbolAnalysis,
      timeSlotAnalysis,
      weaknesses,
      suggestions,
      monteCarloResult,
      riskDiagnosis,
    });
    downloadFile(html, "fx_strategy_report.html", "text/html");
  }, [
    metrics,
    score,
    symbolAnalysis,
    timeSlotAnalysis,
    weaknesses,
    suggestions,
    monteCarloResult,
    riskDiagnosis,
    fileName,
  ]);

  const handleDownloadCSV = useCallback(() => {
    if (!metrics) return;
    const csv = generateMetricsCSV(metrics);
    downloadFile(csv, "metrics.csv", "text/csv");
  }, [metrics]);

  const handleDownloadSummary = useCallback(() => {
    if (!metrics || !score || !monteCarloResult || !riskDiagnosis) return;
    const csv = generateSummaryCSV(
      metrics,
      score,
      symbolAnalysis,
      monteCarloResult,
      riskDiagnosis
    );
    downloadFile(csv, "summary.csv", "text/csv");
  }, [metrics, score, symbolAnalysis, monteCarloResult, riskDiagnosis]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[oklch(0.82_0.18_165_/_0.15)] flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-[oklch(0.82_0.18_165)]" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">
              FX Strategy Doctor
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="text-xs gap-1.5 border-border hover:bg-accent"
            >
              <Languages className="w-3.5 h-3.5" />
              {language === "ja" ? "EN" : "JA"}
            </Button>

            {/* 管理者リンク */}
            {isAdmin && (
              <Link href="/admin">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 border-emerald-800 text-emerald-400 hover:bg-emerald-900/30"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("header.admin")}</span>
                </Button>
              </Link>
            )}
            {/* Logout */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-md px-2.5 py-1.5">
              <span className="text-emerald-400 font-mono">{username}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title={t("header.logout")}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("header.logout")}</span>
            </Button>

            {state === "done" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadReport}
                  className="text-xs gap-1.5 border-border hover:bg-accent"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">HTML Report</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCSV}
                  className="text-xs gap-1.5 border-border hover:bg-accent"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Metrics CSV</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSummary}
                  className="text-xs gap-1.5 border-border hover:bg-accent"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Summary CSV</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reset}
                  className="text-xs gap-1.5 border-border hover:bg-accent"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {t("header.newAnalysis")}
                  </span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {state === "idle" || state === "loading" || state === "error" ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Hero Section */}
            <section className="relative overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{ backgroundImage: `url(${HERO_BG})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />

              <div className="relative container py-20 lg:py-28">
                <div className="max-w-3xl mx-auto text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[oklch(0.82_0.18_165_/_0.1)] border border-[oklch(0.82_0.18_165_/_0.2)] text-[oklch(0.82_0.18_165)] text-xs font-medium mb-6">
                      <Activity className="w-3 h-3" />
                      {t("hero.badge")}
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
                      {t("hero.title1")}
                      <br />
                      <span className="text-[oklch(0.82_0.18_165)]">
                        {t("hero.title2")}
                      </span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
                      {t("hero.desc")}
                    </p>
                  </motion.div>

                  <CsvUploader />

                  {state === "error" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-6 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3 max-w-lg mx-auto text-left"
                    >
                      <p className="font-semibold mb-1">{t("error.title")}</p>
                      {errors.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          {errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs">{t("error.checkFormat")}</p>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Feature cards */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
                >
                  {[
                    {
                      title: t("feat.score.title"),
                      desc: t("feat.score.desc"),
                      color: "oklch(0.82 0.18 165)",
                    },
                    {
                      title: t("feat.weakness.title"),
                      desc: t("feat.weakness.desc"),
                      color: "oklch(0.65 0.18 250)",
                    },
                    {
                      title: t("feat.simulation.title"),
                      desc: t("feat.simulation.desc"),
                      color: "oklch(0.78 0.15 75)",
                    },
                  ].map(feat => (
                    <div
                      key={feat.title}
                      className="bg-card/60 backdrop-blur border border-border rounded-lg p-4 text-left"
                    >
                      <div
                        className="w-2 h-2 rounded-full mb-3"
                        style={{ backgroundColor: feat.color }}
                      />
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  ))}
                </motion.div>
              </div>
            </section>

            {/* How it works */}
            <section className="container py-16">
              <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    {t("howto.title")}
                  </h2>
                  <div className="space-y-5">
                    {[
                      {
                        step: "01",
                        title: t("howto.step1.title"),
                        desc: t("howto.step1.desc"),
                      },
                      {
                        step: "02",
                        title: t("howto.step2.title"),
                        desc: t("howto.step2.desc"),
                      },
                      {
                        step: "03",
                        title: t("howto.step3.title"),
                        desc: t("howto.step3.desc"),
                      },
                      {
                        step: "04",
                        title: t("howto.step4.title"),
                        desc: t("howto.step4.desc"),
                      },
                    ].map(item => (
                      <div key={item.step} className="flex gap-4">
                        <div className="metric-value text-2xl font-bold text-[oklch(0.65_0.18_250_/_0.3)] w-10 shrink-0">
                          {item.step}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            {item.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <img
                    src={UPLOAD_IMG}
                    alt="CSV to Analytics"
                    className="rounded-lg border border-border opacity-80"
                  />
                </div>
              </div>
            </section>
          </motion.div>
        ) : (
          /* ==================== Analysis Dashboard ==================== */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container py-6 pb-16"
          >
            {/* Dashboard Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t("dash.title")}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {fileName} | {metrics?.totalTrades} {t("dash.tradesAnalyzed")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadReport}
                  className="text-xs gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {t("header.saveReport")}
                </Button>
              </div>
            </div>

            {/* Strategy Score + Metrics */}
            <div className="grid lg:grid-cols-[280px_1fr] gap-6 mb-6">
              <div className="bg-card border border-border rounded-lg p-6 flex items-center justify-center">
                {score && <StrategyScoreGauge score={score} />}
              </div>
              <div>{metrics && <MetricsPanel metrics={metrics} />}</div>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {equityCurve.length > 0 && (
                <EquityCurveChart
                  data={equityCurve}
                  initialBalance={initialBalance}
                />
              )}
              {monteCarloResult && (
                <MonteCarloChart
                  result={monteCarloResult}
                  initialBalance={initialBalance}
                />
              )}
            </div>

            {drawdownDist && (
              <div className="mb-6">
                <DrawdownDistChart data={drawdownDist} />
              </div>
            )}

            {/* Analysis Tables */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {symbolAnalysis.length > 0 && (
                <SymbolAnalysisTable data={symbolAnalysis} />
              )}
              {timeSlotAnalysis.length > 0 && (
                <TimeSlotAnalysisTable data={timeSlotAnalysis} />
              )}
            </div>

            {/* Weakness + Risk + Suggestions */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <WeaknessPanel weaknesses={weaknesses} />
              {riskDiagnosis && <RiskPanel diagnosis={riskDiagnosis} />}
            </div>

            {suggestions.length > 0 && (
              <div className="mb-6">
                <SuggestionsPanel suggestions={suggestions} />
              </div>
            )}

            {/* Advanced Analysis: Day of Week + Trade Quality */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {dayOfWeekAnalysis.length > 0 && (
                <DayOfWeekPanel data={dayOfWeekAnalysis} />
              )}
              {tradeQuality && <TradeQualityPanel data={tradeQuality} />}
            </div>

            {/* Win/Loss Distribution + Low Quality Trade Impact */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {winLossDistribution &&
                winLossDistribution.buckets.length > 0 && (
                  <WinLossDistributionPanel data={winLossDistribution} />
                )}
              {lowQualityImpact.length > 0 && (
                <LowQualityTradeImpactPanel data={lowQualityImpact} />
              )}
            </div>

            {lotSizeAnalysis.length > 0 && (
              <div className="mb-6">
                <LotSizeCorrelationPanel data={lotSizeAnalysis} />
              </div>
            )}

            {/* Improvement Simulator */}
            {metrics && trades.length > 0 && (
              <div className="mb-6">
                <ImprovementSimulator metrics={metrics} trades={trades} />
              </div>
            )}

            {/* Trade List Table */}
            {trades.length > 0 && (
              <div className="mb-6">
                <TradeListTable trades={trades} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[oklch(0.82_0.18_165_/_0.15)] flex items-center justify-center">
                <Activity className="w-3 h-3 text-[oklch(0.82_0.18_165)]" />
              </div>
              <span className="font-semibold text-foreground/70">
                FX Strategy Doctor
              </span>
              <span className="text-muted-foreground/50">by Dr. Trading</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors underline underline-offset-2"
              >
                {language === "ja" ? "利用規約" : "Terms of Use"}
              </Link>
              <span className="text-muted-foreground/40">|</span>
              <span>© 2026 Dr. Trading. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <AnalysisProvider>
      <HomeContent />
    </AnalysisProvider>
  );
}
