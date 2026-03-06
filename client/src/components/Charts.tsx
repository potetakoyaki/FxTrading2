/**
 * Design: Trading Terminal - Dark themed charts
 * Equity Curve, Monte Carlo Simulation, Drawdown Distribution
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import type { EquityCurvePoint } from "@/lib/analysis";
import type { MonteCarloResult, DrawdownDistribution } from "@/lib/simulation";

const CHART_COLORS = {
  profit: "#00D4AA",
  loss: "#FF4757",
  blue: "#3B82F6",
  warning: "#F59E0B",
  grid: "rgba(255,255,255,0.06)",
  text: "rgba(255,255,255,0.5)",
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "oklch(0.18 0.02 260)",
    border: "1px solid oklch(0.25 0.02 260)",
    borderRadius: "8px",
    color: "oklch(0.9 0.01 250)",
    fontSize: "12px",
    fontFamily: "'JetBrains Mono', monospace",
  },
  labelStyle: { color: "oklch(0.6 0.02 260)" },
};

// ==================== Equity Curve ====================

export function EquityCurveChart({ data, initialBalance = 0 }: { data: EquityCurvePoint[]; initialBalance?: number }) {
  const { t } = useLanguage();
  const chartData = useMemo(() =>
    data.map((p) => ({
      index: p.index,
      equity: Number(p.equity.toFixed(2)),
      drawdown: Number((-p.drawdown).toFixed(2)),
      drawdownPct: Number((-p.drawdownPct).toFixed(1)),
    })),
    [data]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00D4AA]" />
        {t("chart.equityCurve")}
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.profit} stopOpacity={0.3} />
                <stop offset="100%" stopColor={CHART_COLORS.profit} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="index"
              stroke={CHART_COLORS.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={CHART_COLORS.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toFixed(0)}
            />
            <Tooltip {...tooltipStyle} />
            <ReferenceLine y={initialBalance} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="equity"
              stroke={CHART_COLORS.profit}
              fill="url(#equityGrad)"
              strokeWidth={2}
              dot={false}
              name={t("chart.equity")}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ==================== Monte Carlo ====================

export function MonteCarloChart({ result, initialBalance = 0 }: { result: MonteCarloResult; initialBalance?: number }) {
  const { t } = useLanguage();
  const chartData = useMemo(() => {
    if (result.paths.length === 0) return [];
    const numPoints = result.paths[0].length;
    const step = Math.max(1, Math.floor(numPoints / 100));
    const indices: number[] = [];
    for (let i = 0; i < numPoints; i += step) indices.push(i);
    if (indices[indices.length - 1] !== numPoints - 1) indices.push(numPoints - 1);

    return indices.map((idx) => {
      const values = result.paths.map((p) => p[idx]).sort((a, b) => a - b);
      const len = values.length;
      return {
        index: idx,
        p5: Number(values[Math.floor(len * 0.05)].toFixed(2)),
        p25: Number(values[Math.floor(len * 0.25)].toFixed(2)),
        p50: Number(values[Math.floor(len * 0.5)].toFixed(2)),
        p75: Number(values[Math.floor(len * 0.75)].toFixed(2)),
        p95: Number(values[Math.floor(len * 0.95)].toFixed(2)),
      };
    });
  }, [result]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
        {t("chart.monteCarlo")}
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="mcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.2} />
                <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="index"
              stroke={CHART_COLORS.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={{ value: t("chart.tradeCount"), position: "insideBottom", offset: -2, fill: CHART_COLORS.text, fontSize: 10 }}
            />
            <YAxis
              stroke={CHART_COLORS.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip {...tooltipStyle} />
            <ReferenceLine y={initialBalance} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="p95" stroke="none" fill={CHART_COLORS.blue} fillOpacity={0.08} name="95th" />
            <Area type="monotone" dataKey="p75" stroke="none" fill={CHART_COLORS.blue} fillOpacity={0.12} name="75th" />
            <Area type="monotone" dataKey="p25" stroke="none" fill={CHART_COLORS.blue} fillOpacity={0.08} name="25th" />
            <Area type="monotone" dataKey="p5" stroke="none" fill="transparent" name="5th" />
            <Line type="monotone" dataKey="p50" stroke={CHART_COLORS.blue} strokeWidth={2} dot={false} name={t("chart.median")} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {[
          { label: t("chart.avgEquity"), value: result.avgFinalEquity.toFixed(2), color: CHART_COLORS.profit },
          { label: t("chart.worstEquity"), value: result.worstFinalEquity.toFixed(2), color: CHART_COLORS.loss },
          { label: t("chart.avgMaxDD"), value: result.avgMaxDrawdown.toFixed(2), color: CHART_COLORS.warning },
          { label: t("chart.bankruptcyRate"), value: `${result.bankruptcyRate.toFixed(1)}%`, color: result.bankruptcyRate > 10 ? CHART_COLORS.loss : CHART_COLORS.profit },
        ].map((stat) => (
          <div key={stat.label} className="text-center py-2 bg-[oklch(0.14_0.02_260)] rounded-md">
            <div className="text-xs text-muted-foreground">{stat.label}</div>
            <div className="metric-value text-sm font-semibold mt-0.5" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ==================== Drawdown Distribution ====================

export function DrawdownDistChart({ data }: { data: DrawdownDistribution }) {
  const { t } = useLanguage();
  const chartData = data.ranges.map((range, i) => ({
    range,
    count: data.counts[i],
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
        {t("chart.drawdownDist")}
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="range"
              stroke={CHART_COLORS.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={CHART_COLORS.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="count" name={t("chart.count")} fill={CHART_COLORS.warning} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
