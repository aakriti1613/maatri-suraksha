"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertTriangle, HeartPulse } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useAppwrite } from "@/components/providers/AppwriteProvider";
import { useOffline } from "@/components/providers/OfflineProvider";
import { useVoice } from "@/components/providers/VoiceProvider";
import type { PregnancyPayload } from "@/lib/validation/pregnancy";
import { evaluateRisk, buildActionPlan } from "@/lib/ai/riskModel";

type PregnancyListResponse = {
  pregnancies: Array<PregnancyPayload & { $id: string }>;
  demoFallback: boolean;
};

type PredictionResponse = {
  predictionId: string;
  risk: {
    score: number;
    riskCategory: "low" | "medium" | "high";
    confidence: number;
    logistic: number;
    randomForest: number;
    contributions: Array<{
      feature: string;
      label: string;
      impact: number;
      direction: "increase" | "decrease";
      description: string;
    }>;
  };
  actionPlan: ReturnType<typeof buildActionPlan>;
  demoFallback: boolean;
  aiService: string;
};

const STORAGE_KEY = "mh-last-action-plan";

const riskColor = (category: string) => {
  if (category === "high") return "bg-[var(--color-risk-high)]";
  if (category === "medium") return "bg-[var(--color-risk-medium)]";
  return "bg-[var(--color-risk-low)]";
};

export default function PredictionsPage() {
  const { currentUser } = useAppwrite();
  const { isOnline } = useOffline();
  const { speak, cancelSpeak } = useVoice();
  const [selected, setSelected] = useState<PregnancyPayload & { $id: string } | null>(null);
  const [lastResult, setLastResult] = useState<PredictionResponse | null>(null);

  const {
    data,
    isLoading,
    refetch,
  } = useQuery<PregnancyListResponse>({
    queryKey: ["pregnancies", currentUser?.$id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentUser?.$id) params.set("assignedTo", currentUser.$id);
      const response = await fetch(`/api/pregnancies?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to load pregnancies");
      }
      return (await response.json()) as PregnancyListResponse;
    },
    onSuccess: (payload) => {
      if (!selected && payload.pregnancies.length > 0) {
        setSelected(payload.pregnancies[0]);
      }
    },
  });

  useEffect(() => {
    if (!selected && currentUser) {
      void refetch();
    }
  }, [currentUser, refetch, selected]);

  const mutation = useMutation({
    mutationFn: async (pregnancy: PregnancyPayload & { $id: string }) => {
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregnancyId: pregnancy.$id }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.error ?? "Prediction failed");
      }
      return (await response.json()) as PredictionResponse;
    },
    onError: (err) => {
      toast.error("Prediction failed", {
        description: (err as { message?: string }).message ?? "Try again shortly.",
      });
    },
    onSuccess: (result) => {
      setLastResult(result);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      } catch {
        // ignore storage errors
      }
      toast.success("Risk prediction ready", {
        description: `Risk category: ${result.risk.riskCategory.toUpperCase()}`,
      });
    },
  });

  const handlePredict = async () => {
    if (!selected) return;
    if (!isOnline) {
      // offline fallback using local ensemble
      const risk = evaluateRisk(selected);
      const actionPlan = buildActionPlan(risk, selected);
      const offlineResult: PredictionResponse = {
        predictionId: crypto.randomUUID(),
        risk: {
          score: risk.ensembleScore,
          riskCategory: risk.category,
          confidence: risk.confidence,
          logistic: risk.logistic,
          randomForest: risk.randomForest,
          contributions: risk.contributions,
        },
        actionPlan,
        demoFallback: true,
        aiService: "local-ensemble-offline",
      };
      setLastResult(offlineResult);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(offlineResult));
      toast.info("Offline prediction generated", {
        description: "Action plan saved locally and will sync later.",
      });
      return;
    }
    await mutation.mutateAsync(selected);
  };

  const handleSpeak = () => {
    if (!lastResult) return;
    speak(lastResult.actionPlan.tts, "hi");
  };

  const handleViewPlan = () => {
    if (!lastResult) {
      toast.info("Generate a prediction first.");
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lastResult));
    window.location.href = `/action-plan?predictionId=${lastResult.predictionId}`;
  };

  const contributions = useMemo(() => lastResult?.risk.contributions ?? [], [lastResult]);

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-[var(--gradient-soft)] px-4 py-6 md:px-8">
      <header className="glass-card flex flex-col gap-4 rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <HeartPulse className="h-10 w-10 text-[var(--color-risk-high)]" />
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
              AI Risk Prediction
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Ensemble of Logistic Regression + Random Forest provides risk score, factors, and a
              guided action plan.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => refetch()} disabled={isLoading}>
            Refresh pregnancies
          </Button>
          <Button variant="ghost" onClick={handleSpeak} disabled={!lastResult}>
            Speak summary (Hindi)
          </Button>
          <Button variant="ghost" onClick={cancelSpeak}>
            Stop voice
          </Button>
        </div>
      </header>

      <section className="glass-card flex flex-col gap-6 rounded-[32px] border border-white/60 bg-white/90 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Select pregnancy</h2>
          {data?.demoFallback ? (
            <span className="rounded-full border border-dashed border-[var(--color-accent-lavender)] bg-[var(--color-accent-lavender)]/20 px-3 py-1 text-xs text-[var(--color-accent-lavender)]">
              Demo data • connect Appwrite for live sync
            </span>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {(data?.pregnancies ?? []).map((pregnancy) => {
            const isActive = selected?.$id === pregnancy.$id;
            return (
              <button
                key={pregnancy.$id}
                type="button"
                onClick={() => setSelected(pregnancy)}
                className={`flex h-full flex-col gap-3 rounded-3xl border px-4 py-4 text-left shadow-sm transition ${isActive ? "border-[var(--color-accent-peach)] bg-white" : "border-white/60 bg-white/70 hover:border-[var(--color-accent-peach)]/60"}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold text-[var(--color-foreground)]">
                    {pregnancy.personal.name ?? "Beneficiary"}
                  </p>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    {pregnancy.current.trimester}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-muted-foreground)]">
                  <span>Age: {pregnancy.personal.age}</span>
                  <span>Hb: {pregnancy.health.hemoglobin} g/dL</span>
                  <span>BMI: {pregnancy.health.bmi}</span>
                  <span>BP: {pregnancy.health.bpSystolic}/{pregnancy.health.bpDiastolic}</span>
                  <span>ANC: {pregnancy.current.ancVisits}</span>
                  <span>IFA: {pregnancy.current.ironFolicIntake}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handlePredict}
            isLoading={mutation.isPending}
            disabled={!selected}
            size="lg"
          >
            Run risk prediction
          </Button>
          <Button variant="secondary" onClick={handleViewPlan} disabled={!lastResult}>
            View action plan
          </Button>
        </div>
      </section>

      {lastResult ? (
        <section className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <div className="glass-card flex flex-col gap-5 rounded-[32px] border border-white/60 bg-white/90 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              Risk snapshot
            </h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-2 rounded-3xl border border-white/60 bg-white/80 p-4 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  Ensemble score
                </span>
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-24 rounded-full ${riskColor(lastResult.risk.riskCategory)}`} />
                  <span className="text-2xl font-semibold text-[var(--color-foreground)]">
                    {Math.round(lastResult.risk.score * 100)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded-3xl border border-white/60 bg-white/80 p-4 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  Confidence
                </span>
                <span className="text-2xl font-semibold text-[var(--color-foreground)]">
                  {Math.round(lastResult.risk.confidence * 100)}%
                </span>
              </div>
              <div className="flex flex-col gap-2 rounded-3xl border border-white/60 bg-white/80 p-4 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  Logistic vs Random Forest
                </span>
                <div className="flex items-center gap-3 text-sm text-[var(--color-muted-foreground)]">
                  <span>LR {Math.round(lastResult.risk.logistic * 100)}</span>
                  <span>•</span>
                  <span>RF {Math.round(lastResult.risk.randomForest * 100)}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Top contributing factors
              </h4>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {contributions.map((factor) => (
                  <div
                    key={factor.feature}
                    className="rounded-2xl border border-white/60 bg-white/80 p-3 text-sm"
                  >
                    <p className="font-semibold text-[var(--color-foreground)]">{factor.label}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {factor.description || "Influences risk score."}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className={`h-2 w-16 rounded-full ${factor.direction === "increase" ? "bg-[var(--color-risk-high)]" : "bg-[var(--color-risk-low)]"}`}
                        style={{
                          opacity: Math.min(1, Math.abs(factor.impact)),
                        }}
                      />
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        {factor.direction === "increase" ? "Raises risk" : "Reduces risk"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="glass-card flex h-full flex-col justify-between gap-4 rounded-[32px] border border-white/60 bg-white/90 p-6 shadow-lg">
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
                Action plan preview
              </h3>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {lastResult.actionPlan.summary}
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--color-muted-foreground)]">
                {lastResult.actionPlan.priorityActions.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <Button variant="secondary" onClick={handleViewPlan}>
              View full action plan
            </Button>
          </div>
        </section>
      ) : (
        <section className="glass-card flex items-center gap-3 rounded-[32px] border border-dashed border-white/60 bg-white/60 p-6 text-sm text-[var(--color-muted-foreground)]">
          <AlertTriangle className="h-5 w-5 text-[var(--color-risk-medium)]" />
          Select a pregnancy and run prediction to view risk insights and care plan.
        </section>
      )}
    </main>
  );
}


