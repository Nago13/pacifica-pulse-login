import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, HistogramSeries } from "lightweight-charts";
import { Skeleton } from "@/components/ui/skeleton";

interface Candle {
  t: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CandlestickChartProps {
  candles: Candle[];
  loading?: boolean;
}

const CandlestickChart = ({ candles, loading }: CandlestickChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#8BB8CC",
        fontFamily: "DM Sans, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.1)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 240,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#1DB887",
      downColor: "#E84855",
      borderUpColor: "#1DB887",
      borderDownColor: "#E84855",
      wickUpColor: "#1DB887",
      wickDownColor: "#E84855",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current || !candles.length) return;

    const formatted = candles
      .map((c) => ({
        time: (Math.floor(c.t / 1000)) as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
      .sort((a, b) => a.time - b.time);

    candleSeriesRef.current.setData(formatted);

    if (volumeSeriesRef.current) {
      const volumeData = candles
        .map((c) => ({
          time: (Math.floor(c.t / 1000)) as any,
          value: c.volume ?? 0,
          color: c.close >= c.open ? "rgba(29,184,135,0.4)" : "rgba(232,72,85,0.4)",
        }))
        .sort((a, b) => a.time - b.time);

      volumeSeriesRef.current.setData(volumeData);
    }

    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  if (loading) {
    return <Skeleton className="w-full rounded-lg" style={{ height: 240 }} />;
  }

  return (
    <div
      ref={chartContainerRef}
      style={{ width: "100%", height: "240px" }}
    />
  );
};

export default CandlestickChart;
