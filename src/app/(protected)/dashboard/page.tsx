"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarCheck2, HeartPulse, UsersRound } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/Button";
import { useAppwrite } from "@/components/providers/AppwriteProvider";
import { useVoice } from "@/components/providers/VoiceProvider";

type DashboardResponse = {
  totals: {
    pregnancies: number;
    highRisk: number;
    upcomingFollowUps: number;
  };
  upcomingAlerts: Array<{
    id: string;
    message: string;
    dueOn: string;
    priority: string;
    type: string;
  }>;
  riskTrend: Array<{
    month: string;
    score: number;
    category: string;
  }>;
  demoFallback: boolean;
};

const RiskPill = ({ category }: { category: string }) => {
  const color =
    category === "high"
      ? "bg-[var(--color-risk-high)]"
      : category === "medium"
        ? "bg-[var(--color-risk-medium)] text-[var(--color-foreground)]"
        : "bg-[var(--color-risk-low)]";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase text-white ${color}`}
    >
      {category}
    </span>
  );
};

export default function DashboardPage() {
  const { currentUser } = useAppwrite();
  const { speak, cancelSpeak } = useVoice();

  const role = useMemo(
    () =>
      (currentUser?.prefs as { role?: string } | undefined)?.role?.toLowerCase() ?? "asha",
    [currentUser?.prefs],
  );

  const { data, isLoading, refetch, isFetching } = useQuery<DashboardResponse>({
    queryKey: ["dashboard", currentUser?.$id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (role) params.set("role", role);
      if (currentUser?.$id) params.set("userId", currentUser.$id);
      const response = await fetch(`/api/dashboard?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to load dashboard");
      }
      return (await response.json()) as DashboardResponse;
    },
    enabled: !!currentUser,
  });

  const handleSpeakSummary = () => {
    if (!data) return;
    const summary = `आपके रिकॉर्ड के अनुसार कुल ${data.totals.pregnancies} गर्भवती महिलाएँ ट्रैक में हैं। ${data.totals.highRisk} उच्च जोखिम में हैं और ${data.totals.upcomingFollowUps} फॉलो-अप अगले कुछ दिनों में होने वाले हैं।`;
    speak(summary, "hi");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total pregnancies tracked"
          value={data?.totals.pregnancies ?? 0}
          icon={<UsersRound className="h-10 w-10 text-[var(--color-accent-peach)]" />}
          gradient="from-[#fbc4d4] to-[#f9b4ab]"
          loading={isLoading}
        />
        <StatCard
          title="High-risk cases"
          value={data?.totals.highRisk ?? 0}
          icon={<HeartPulse className="h-10 w-10 text-[var(--color-risk-high)]" />}
          gradient="from-[#f9b4ab] to-[#f45b69]"
          loading={isLoading}
          highlight
        />
        <StatCard
          title="Upcoming follow-ups"
          value={data?.totals.upcomingFollowUps ?? 0}
          icon={<CalendarCheck2 className="h-10 w-10 text-[var(--color-accent-mint)]" />}
          gradient="from-[#b8f2e6] to-[#c9c3f7]"
          loading={isLoading}
        />
      </div>

      <div className="glass-card grid gap-6 rounded-[32px] border border-white/60 bg-white/80 p-6 md:grid-cols-[2fr,1fr]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                Risk trend (last 12 predictions)
              </h2>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Combined Logistic Regression + Random Forest ensemble scoring
              </p>
            </div>
            <Button variant="secondary" onClick={() => refetch()} isLoading={isFetching}>
              Refresh
            </Button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.riskTrend ?? []}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#f45b69" stopOpacity={0.8} />
                    <stop offset="90%" stopColor="#f9b4ab" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => format(parseISO(value), "MMM")}
                  stroke="rgba(45,42,50,0.4)"
                />
                <YAxis stroke="rgba(45,42,50,0.4)" />
                <Tooltip
                  contentStyle={{
                    background: "rgba(255,255,255,0.95)",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.5)",
                  }}
                  labelFormatter={(value) => format(parseISO(value), "dd MMM, yyyy")}
                  formatter={(value: number, _name, item) => [
                    `${value.toFixed(0)} risk score`,
                    <RiskPill key={item.payload.month} category={item.payload.category} />,
                  ]}
                />
                <Area
                  dataKey="score"
                  type="monotone"
                  stroke="#f45b69"
                  fill="url(#riskGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex h-full flex-col gap-4 rounded-[28px] border border-white/60 bg-white/70 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Upcoming alerts
            </h2>
            <Button variant="ghost" size="sm" onClick={handleSpeakSummary}>
              Voice summary (Hindi)
            </Button>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
            {(data?.upcomingAlerts ?? []).map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col gap-2 rounded-2xl bg-white/90 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--color-foreground)]">
                    {alert.message}
                  </span>
                  <RiskPill category={alert.priority?.toLowerCase() ?? "medium"} />
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
                  <span>{format(parseISO(alert.dueOn), "dd MMM, yyyy")}</span>
                  <span className="uppercase tracking-wide">{alert.type}</span>
                </div>
              </div>
            ))}
            {data && data.upcomingAlerts.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/60 bg-white/50 p-6 text-center text-sm text-[var(--color-muted-foreground)]">
                No pending alerts. Great job staying on schedule!
              </div>
            ) : null}
          </div>
          <Button variant="secondary" onClick={cancelSpeak}>
            Stop voice
          </Button>
        </div>
      </div>

      {data?.demoFallback ? (
        <div className="rounded-2xl border border-dashed border-white/70 bg-white/60 p-4 text-sm text-[var(--color-muted-foreground)]">
          Demo mode: Showing sample insights until Appwrite sync completes. Configure Appwrite
          credentials in `.env` to fetch live programme data.
        </div>
      ) : null}
    </div>
  );
}

const StatCard = ({
  title,
  value,
  icon,
  gradient,
  loading,
  highlight,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  loading?: boolean;
  highlight?: boolean;
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-[32px] border border-white/60 bg-white/70 p-6 shadow-lg transition hover:-translate-y-1 ${
        highlight ? "ring-2 ring-[var(--color-risk-high)]/40" : ""
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {title}
          </span>
          {icon}
        </div>
        <div className="text-4xl font-semibold text-[var(--color-foreground)]">
          {loading ? <span className="animate-pulse">...</span> : value}
        </div>
      </div>
    </div>
  );
};



