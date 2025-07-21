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

export function CoinChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBTCData = async () => {
    setLoading(true);
    setError(null);
    try {
      //5m x (12 x 12) = 720m = 12h
      const res = await fetch(
        "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=144"
      );
      const json = await res.json();
      const parsed = json.map((item: any) => ({
        time: new Date(item[0]).toLocaleTimeString(),
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
      }));
      setData(parsed);
    } catch (err) {
      console.log(`debug:err`, err);
      setError("Failed to fetch BTC data");
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

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#0ea5e9"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
