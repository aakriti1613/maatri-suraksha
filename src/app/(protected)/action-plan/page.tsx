"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ShieldAlert, Sparkles, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useVoice } from "@/components/providers/VoiceProvider";

type ActionPlan = {
  summary: string;
  riskCategory: "low" | "medium" | "high";
  priorityActions: string[];
  ancSchedule: string[];
  nutrition: string[];
  medications: string[];
  followUp: string[];
  counselling: string[];
  tts: string;
};

type PredictionDetail = {
  predictionId: string;
  pregnancy: {
    personal: { name?: string; age?: number; village?: string };
    current: { trimester?: string; ancVisits?: number };
  };
  risk: {
    score: number;
    riskCategory: "low" | "medium" | "high";
    confidence: number;
    contributions: Array<{
      label: string;
      description: string;
      direction: "increase" | "decrease";
    }>;
  };
  actionPlan: ActionPlan;
  demoFallback: boolean;
};

const STORAGE_KEY = "mh-last-action-plan";

const badgeClass = (category: string) => {
  if (category === "high") return "bg-[var(--color-risk-high)] text-white";
  if (category === "medium") return "bg-[var(--color-risk-medium)] text-[var(--color-foreground)]";
  return "bg-[var(--color-risk-low)] text-white";
};

export default function ActionPlanPage() {
  const router = useRouter();
  const { speak, cancelSpeak } = useVoice();
  const params = useSearchParams();
  const [detail, setDetail] = useState<PredictionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const predictionId = params.get("predictionId");
    const fetchPlan = async () => {
      if (predictionId) {
        const response = await fetch(`/api/predictions/${predictionId}`, {
          cache: "no-store",
        }).catch(() => null);
        if (response && response.ok) {
          const data = (await response.json()) as PredictionDetail;
          setDetail(data);
          setLoading(false);
          return;
        }
      }

      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDetail(JSON.parse(stored) as PredictionDetail);
        setLoading(false);
        return;
      }
      setLoading(false);
    };

    void fetchPlan();
  }, [params]);

  const handleSpeak = () => {
    if (!detail) return;
    speak(detail.actionPlan.tts, "hi");
  };

  const handleCopy = async () => {
    if (!detail) return;
    const text = [
      `Risk: ${detail.risk.riskCategory.toUpperCase()} (score ${Math.round(detail.risk.score * 100)})`,
      "",
      "Priority actions:",
      ...detail.actionPlan.priorityActions.map((item) => `• ${item}`),
      "",
      "ANC schedule:",
      ...detail.actionPlan.ancSchedule.map((item) => `• ${item}`),
      "",
      "Nutrition:",
      ...detail.actionPlan.nutrition.map((item) => `• ${item}`),
      "",
      "Medications:",
      ...detail.actionPlan.medications.map((item) => `• ${item}`),
      "",
      "Follow-up:",
      ...detail.actionPlan.followUp.map((item) => `• ${item}`),
    ].join("\n");

    await navigator.clipboard.writeText(text);
    window.alert("Action plan copied to clipboard for sharing.");
  };

  const contributions = useMemo(
    () => detail?.risk.contributions ?? [],
    [detail?.risk.contributions],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--gradient-soft)]">
        <div className="glass-card flex items-center gap-3 rounded-3xl border border-white/60 bg-white/80 px-8 py-6 text-sm text-[var(--color-muted-foreground)]">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent-peach)]" />
          Loading latest action plan...
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--gradient-soft)]">
        <div className="glass-card flex flex-col items-center gap-4 rounded-3xl px-12 py-10 text-center">
          <ShieldAlert className="h-12 w-12 text-[var(--color-risk-medium)]" />
          <p className="text-lg font-semibold text-[var(--color-foreground)]">
            No action plan available yet.
          </p>
          <Button variant="secondary" onClick={() => router.replace("/predictions")}>
            Run a prediction
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-[var(--gradient-soft)] px-4 py-6 md:px-8">
      <header className="glass-card flex flex-col gap-4 rounded-[32px] border border-white/60 bg-white/90 p-6 shadow-xl md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            <Stethoscope className="h-4 w-4 text-[var(--color-accent-mint)]" />
            Pregnancy care plan
          </span>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            {detail.pregnancy.personal.name ?? "Beneficiary"} •{" "}
            {detail.pregnancy.personal.age ?? "—"} years •{" "}
            {detail.pregnancy.personal.village ?? "Village"}
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Trimester: {detail.pregnancy.current.trimester ?? "—"} | ANC visits completed:{" "}
            {detail.pregnancy.current.ancVisits ?? 0}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleSpeak}>
            Play advice (Hindi)
          </Button>
          <Button variant="ghost" onClick={cancelSpeak}>
            Stop voice
          </Button>
          <Button variant="secondary" onClick={handleCopy}>
            Copy plan
          </Button>
        </div>
      </header>

      <section className="glass-card flex flex-col gap-4 rounded-[32px] border border-white/60 bg-white/90 p-6 shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClass(detail.risk.riskCategory)}`}>
            {detail.risk.riskCategory} risk • {Math.round(detail.risk.score * 100)} score
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Confidence {Math.round(detail.risk.confidence * 100)}%
          </span>
          {detail.demoFallback ? (
            <span className="rounded-full border border-dashed border-[var(--color-accent-lavender)] bg-[var(--color-accent-lavender)]/20 px-3 py-1 text-xs text-[var(--color-accent-lavender)]">
              Demo insight • Connect Appwrite for longitudinal storage
            </span>
          ) : null}
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">{detail.actionPlan.summary}</p>
        {contributions.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {contributions.map((factor) => (
              <div
                key={factor.label}
                className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/80 p-3 text-sm"
              >
                <Sparkles className="mt-1 h-4 w-4 text-[var(--color-accent-peach)]" />
                <div>
                  <p className="font-semibold text-[var(--color-foreground)]">{factor.label}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {factor.description || "Contributes to risk assessment."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <ActionCard title="Priority actions" items={detail.actionPlan.priorityActions} />
        <ActionCard title="ANC schedule & tests" items={detail.actionPlan.ancSchedule} />
        <ActionCard title="Nutrition & diet" items={detail.actionPlan.nutrition} />
        <ActionCard title="Medications & supplements" items={detail.actionPlan.medications} />
        <ActionCard title="Follow-up & alerts" items={detail.actionPlan.followUp} />
        <ActionCard title="Counselling & family support" items={detail.actionPlan.counselling} />
      </section>

      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => router.push("/predictions")}>
          Run another prediction
        </Button>
        <Button variant="secondary" onClick={() => router.push("/alerts")}>
          View alerts & follow-ups
        </Button>
      </div>
    </main>
  );
}

const ActionCard = ({ title, items }: { title: string; items: string[] }) => (
  <article className="glass-card flex flex-col gap-3 rounded-[28px] border border-white/60 bg-white/90 p-5 shadow">
    <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{title}</h3>
    <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--color-muted-foreground)]">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </article>
);



