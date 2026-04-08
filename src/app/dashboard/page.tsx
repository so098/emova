"use client";

import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import type { DashboardData } from "@/lib/supabase/dashboardApi";

const STATUS_COLORS: Record<string, string> = {
  in_progress: "#FFA900",
  completed: "#4894FF",
  reflected: "#00FF77",
  aborted: "#656565",
};

const QUEST_COLORS: Record<string, string> = {
  pending: "#FFA900",
  in_progress: "#4894FF",
  done: "#00FF77",
  expired: "#656565",
};

const STATUS_LABELS: Record<string, string> = {
  in_progress: "진행 중",
  completed: "플로우 완료",
  reflected: "회고 완료",
  aborted: "중단",
};

const QUEST_LABELS: Record<string, string> = {
  pending: "대기",
  in_progress: "진행 중",
  done: "완료",
  expired: "만료",
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/60 p-5 shadow-sm backdrop-blur-md">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

type SessionView = "daily" | "monthly";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionView, setSessionView] = useState<SessionView>("daily");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="p-8 text-red-500">에러: {error}</div>;
  if (!data) return <div className="p-8 text-gray-400">로딩 중...</div>;

  const totalSessions = data.sessionStatusCounts.reduce((s, c) => s + c.count, 0);
  const completedSessions = data.sessionStatusCounts
    .filter((c) => c.status === "completed" || c.status === "reflected")
    .reduce((s, c) => s + c.count, 0);
  const reflectedSessions = data.sessionStatusCounts
    .find((c) => c.status === "reflected")?.count ?? 0;
  const totalQuests = data.questStatusCounts.reduce((s, c) => s + c.count, 0);
  const doneQuests = data.questStatusCounts.find((c) => c.status === "done")?.count ?? 0;

  const sessionPieData = data.sessionStatusCounts.map((c) => ({
    name: STATUS_LABELS[c.status] ?? c.status,
    value: c.count,
    color: STATUS_COLORS[c.status] ?? "#ccc",
  }));

  const questPieData = data.questStatusCounts.map((c) => ({
    name: QUEST_LABELS[c.status] ?? c.status,
    value: c.count,
    color: QUEST_COLORS[c.status] ?? "#ccc",
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="총 세션 생성 기기" value={data.totalUsers} />
        <StatCard label="총 세션" value={totalSessions} />
        <StatCard
          label="루프 완주율 (회고)"
          value={totalSessions ? `${Math.round((reflectedSessions / totalSessions) * 100)}%` : "—"}
        />
        <StatCard label="총 퀘스트" value={totalQuests} />
      </div>

      {/* 감정 / 생각 분포 */}
      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl bg-white/60 p-5 shadow-sm backdrop-blur-md">
          <h2 className="mb-4 text-lg font-bold">감정 선택 분포</h2>
          <ResponsiveContainer width="100%" height={Math.max(200, data.emotionCounts.length * 40)}>
            <BarChart data={data.emotionCounts} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="key" tick={{ fontSize: 13 }} width={70} />
              <Tooltip />
              <Bar dataKey="count" fill="#f4845f" radius={[0, 4, 4, 0]} name="선택 횟수" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl bg-white/60 p-5 shadow-sm backdrop-blur-md">
          <h2 className="mb-4 text-lg font-bold">생각 선택 분포</h2>
          <ResponsiveContainer width="100%" height={Math.max(200, data.thoughtCounts.length * 40)}>
            <BarChart data={data.thoughtCounts} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="key" tick={{ fontSize: 13 }} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#FFA900" radius={[0, 4, 4, 0]} name="선택 횟수" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 루프 완주 퍼널 */}
      <div className="rounded-2xl bg-white/60 p-5 shadow-sm backdrop-blur-md">
        <h2 className="mb-4 text-lg font-bold">루프 완주 퍼널</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.funnel} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="stage" tick={{ fontSize: 13 }} width={100} />
            <Tooltip
              formatter={(value) => {
                const total = data.funnel[0]?.count || 1;
                return [`${value}건 (${Math.round((Number(value) / total) * 100)}%)`, "세션 수"];
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.funnel.map((_, i) => (
                <Cell key={i} fill={["#FF9437", "#4894FF", "#00FF77"][i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {data.funnel[0]?.count > 0 && (
          <div className="mt-3 flex gap-4 text-sm text-gray-500">
            <span>시작 → 완료: {Math.round((data.funnel[1]?.count / data.funnel[0].count) * 100)}%</span>
            <span>완료 → 회고: {data.funnel[1]?.count ? Math.round((data.funnel[2]?.count / data.funnel[1].count) * 100) : 0}%</span>
            <span>전체 완주: {Math.round((data.funnel[2]?.count / data.funnel[0].count) * 100)}%</span>
          </div>
        )}
      </div>

      {/* 기기별 루프 완주율 */}
      <div className="rounded-2xl bg-white/60 p-5 shadow-sm backdrop-blur-md">
        <h2 className="mb-4 text-lg font-bold">기기별 루프 완주율</h2>
        <ResponsiveContainer width="100%" height={Math.max(200, data.deviceCompletionRates.length * 50)}>
          <BarChart data={data.deviceCompletionRates} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="clientId" tick={{ fontSize: 11, fontFamily: "monospace" }} width={80} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Bar dataKey="flowRate" fill="#4894FF" name="플로우 완주율" radius={[0, 4, 4, 0]} />
            <Bar dataKey="loopRate" fill="#00FF77" name="루프 완주율" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 차트 영역 */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* 퀘스트 상태 분포 */}
        <div className="rounded-2xl bg-white/60 p-5 shadow-sm backdrop-blur-md">
          <h2 className="mb-4 text-lg font-bold">퀘스트 상태 분포</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={questPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {questPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 세션 수 (일별/월별 전환) */}
        <div className="rounded-2xl bg-white/60 p-5 shadow-sm backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {sessionView === "daily" ? "일별" : "월별"} 세션 수
            </h2>
            <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5 text-sm">
              <button
                onClick={() => setSessionView("daily")}
                className={`rounded-md px-3 py-1 transition-colors ${sessionView === "daily" ? "bg-white font-bold shadow-sm" : "text-gray-500"}`}
              >
                일별
              </button>
              <button
                onClick={() => setSessionView("monthly")}
                className={`rounded-md px-3 py-1 transition-colors ${sessionView === "monthly" ? "bg-white font-bold shadow-sm" : "text-gray-500"}`}
              >
                월별
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            {sessionView === "daily" ? (
              <LineChart data={data.dailySessions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#FF9437" strokeWidth={2} name="세션 수" />
              </LineChart>
            ) : (
              <BarChart data={(() => {
                const monthMap = new Map<string, number>();
                for (const d of data.dailySessions) {
                  const month = d.date.slice(0, 7);
                  monthMap.set(month, (monthMap.get(month) ?? 0) + d.count);
                }
                return [...monthMap.entries()]
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([month, count]) => ({ month, count }));
              })()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#FF9437" radius={[4, 4, 0, 0]} name="세션 수" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>


      </div>

      {/* 날짜별 세션 수 */}
      <div className="rounded-2xl bg-white/60 p-5 shadow-sm backdrop-blur-md">
        <h2 className="mb-4 text-lg font-bold">날짜별 세션 수</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-2 pr-4">날짜</th>
                <th className="pb-2">세션 수</th>
              </tr>
            </thead>
            <tbody>
              {[...data.dailySessions].reverse().map((d) => (
                <tr key={d.date} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{d.date}</td>
                  <td className="py-2">{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 기기별 플로우/진행중/루프 횟수 */}
      <div className="rounded-2xl bg-white/60 p-5 shadow-sm backdrop-blur-md">
        <h2 className="mb-4 text-lg font-bold">기기별 플로우 / 진행중 / 루프</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-2 pr-4">기기 ID</th>
                <th className="pb-2 pr-4">플로우</th>
                <th className="pb-2 pr-4">진행중</th>
                <th className="pb-2">루프</th>
              </tr>
            </thead>
            <tbody>
              {data.deviceCompletionRates.map((d) => (
                <tr key={d.clientId} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-mono text-xs">{d.clientId}</td>
                  <td className="py-2 pr-4">{d.completed}</td>
                  <td className="py-2 pr-4">{d.total - d.completed}</td>
                  <td className="py-2">{d.reflected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 기기별 접속 기록 */}
      <div className="rounded-2xl bg-white/60 p-5 shadow-sm backdrop-blur-md">
        <h2 className="mb-4 text-lg font-bold">기기별 접속 기록</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-2 pr-4">기기 ID</th>
                <th className="pb-2 pr-4">첫 접속</th>
                <th className="pb-2 pr-4">마지막 접속</th>
                <th className="pb-2 pr-4">세션 수</th>
                <th className="pb-2">활동 시간대</th>
              </tr>
            </thead>
            <tbody>
              {data.deviceAccessLogs.map((d) => (
                <tr key={d.clientId} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-mono text-xs">{d.clientId}</td>
                  <td className="py-2 pr-4">{new Date(d.firstSeen).toLocaleString("ko-KR")}</td>
                  <td className="py-2 pr-4">{new Date(d.lastSeen).toLocaleString("ko-KR")}</td>
                  <td className="py-2 pr-4">{d.sessions}</td>
                  <td className="py-2">{d.activeHours.map((h) => `${h}시`).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
