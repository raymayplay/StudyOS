"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function StudyChart({
  data,
  fill,
}: {
  data: Array<{ name: string; sessions?: number; value?: number }>;
  fill: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="name" stroke="#cbd5e1" />
        <YAxis stroke="#cbd5e1" />
        <Tooltip />
        <Bar dataKey={data[0]?.sessions !== undefined ? "sessions" : "value"} fill={fill} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
