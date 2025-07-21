"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const CoinChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateMAs = (rawData: any[], periods: number[]) => {
    return rawData.map((item, index) => {
      const maValues: Record<string, number | null> = {};
      for (const period of periods) {
        if (index < period - 1) {
          maValues[`ma${period}`] = null;
        } else {
          const sum = rawData
            .slice(index - period + 1, index + 1)
            .reduce((acc, cur) => acc + cur.close, 0);
          maValues[`ma${period}`] = sum / period;
        }
      }
      return { ...item, ...maValues };
    });
  };

  const fetchBTCData = async () => {
    try {
      setLoading(true);

      //5m x (12 x 12) = 720m = 12h
      const res = await fetch(
        "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=15m&limit=144"
      );
      const json = await res.json();

      const parsed = json.map((item: any) => ({
        time: new Date(item[0]).toLocaleTimeString(),
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
      }));

      const withMA = calculateMAs(parsed, [5, 20]);
      setData(withMA);
    } catch (err) {
      console.log(`debug:err`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBTCData();
    const interval = setInterval(fetchBTCData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 w-full mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">BTC/USDT 5m Chart</h1>

      <Button onClick={fetchBTCData} className="mx-auto">
        Refresh Data
      </Button>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip />
          <Line type="monotone" dataKey="close" stroke="#0ea5e9" dot={false} />
          <Line type="monotone" dataKey="ma5" stroke="#ff0000" dot={false} />
          <Line type="monotone" dataKey="ma20" stroke="#00ff00" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
