"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ChevronLeft,
  ClipboardCheck,
  HeartPulse,
  Stethoscope,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/Button";
import { useVoice } from "@/components/providers/VoiceProvider";

type TimelineEntry = {
  title: string;
  date: string;
  notes: string;
  type: "visit" | "lab" | "risk" | "med";
};

type PregnancyResponse = {
  pregnancy: {
    $id: string;
    personal: {
      name?: string;
      age?: number;
      village?: string;
    };
    current: {
      lmp?: string;
      edd?: string;
      trimester?: string;
      ancVisits?: number;
      ironFolicIntake?: string;
    };
    health?: {
      bmi?: number;
      hemoglobin?: number;
      bloodSugar?: number;
      bpSystolic?: number;
      bpDiastolic?: number;
    };
    timeline?: TimelineEntry[];
    demoFallback?: boolean;
  } | null;
  error?: string;
};

const iconByType = {
  visit: <Stethoscope className="h-5 w-5 text-[var(--color-accent-peach)]" />,
  lab: <ClipboardCheck className="h-5 w-5 text-[var(--color-accent-lavender)]" />,
  risk: <HeartPulse className="h-5 w-5 text-[var(--color-risk-high)]" />,
  med: <Stethoscope className="h-5 w-5 text-[var(--color-accent-mint)]" />,
};

export default function PregnancyTimelinePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { speak } = useVoice();

  const { data, isLoading } = useQuery<PregnancyResponse>({
    queryKey: ["pregnancy", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/pregnancies/${params.id}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to load pregnancy");
      }
      return (await response.json()) as PregnancyResponse;
    },
  });

  const pregnancy = data?.pregnancy ?? null;

  const voiceSummary = useMemo(() => {
    if (!pregnancy) return "";
    const hb = pregnancy.health?.hemoglobin;
    const anc = pregnancy.current?.ancVisits;
    const trimester = pregnancy.current?.trimester;
    return `यह गर्भवती महिला ${trimester ?? "पहली तिमाही"} में है। अब तक ${anc ?? 0} ए एन सी विज़िट पूरी कर चुकी हैं। हीमोग्लोबिन ${hb ?? "अनुपलब्ध"} ग्राम दर्ज किया गया है। कृपया समय पर फॉलो-अप करें और आयरन गोलियाँ नियमित दें।`;
  }, [pregnancy]);

  const handleSpeak = () => {
    if (voiceSummary) {
      speak(voiceSummary, "hi");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--gradient-soft)]">
        <div className="glass-card flex flex-col items-center gap-4 rounded-3xl px-12 py-10 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-accent-peach)] border-t-transparent" />
          <p className="text-lg font-semibold text-[var(--color-foreground)]">
            Loading pregnancy timeline...
          </p>
        </div>
      </div>
    );
  }

  if (!pregnancy) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--gradient-soft)]">
        <div className="glass-card flex flex-col items-center gap-4 rounded-3xl px-12 py-10 text-center">
          <HeartPulse className="h-12 w-12 text-[var(--color-risk-high)]" />
          <p className="text-lg font-semibold text-[var(--color-foreground)]">
            Unable to load pregnancy record.
          </p>
          <Button variant="secondary" onClick={() => router.replace("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-[var(--gradient-soft)] px-4 py-6 md:px-8">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSpeak}>
          Hindi voice summary
        </Button>
      </div>

      <section className="glass-card flex flex-col gap-4 rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            {pregnancy.personal?.name ?? "Pregnancy record"}
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Age {pregnancy.personal?.age ?? "—"} • {pregnancy.personal?.village ?? "Village TBD"}
          </p>
          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            <span className="rounded-full bg-white/70 px-3 py-1">
              {pregnancy.current?.trimester ?? "Trimester"}
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1">
              ANC visits: {pregnancy.current?.ancVisits ?? 0}
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1">
              BMI: {pregnancy.health?.bmi ?? "—"}
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1">
              Hemoglobin: {pregnancy.health?.hemoglobin ?? "—"} g/dL
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => router.push(`/predictions?pregnancy=${pregnancy.$id}`)}>
            Run AI risk prediction
          </Button>
          {pregnancy.demoFallback ? (
            <span className="rounded-full border border-dashed border-[var(--color-risk-medium)] bg-[var(--color-risk-medium)]/20 px-3 py-2 text-xs text-[var(--color-risk-medium)]">
              Demo data • Connect Appwrite for live records
            </span>
          ) : null}
        </div>
      </section>

      <section className="glass-card flex flex-col gap-4 rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--color-foreground)]">Pregnancy journey</h2>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            <Calendar className="h-4 w-4" />
            LMP {pregnancy.current?.lmp ?? "—"} • EDD {pregnancy.current?.edd ?? "—"}
          </div>
        </div>
        <div className="relative flex flex-col gap-6">
          <span className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-[var(--color-accent-peach)]/60 to-transparent md:left-8" />
          {(pregnancy.timeline ?? []).map((entry) => (
            <article
              key={`${entry.title}-${entry.date}`}
              className="relative ml-10 flex flex-col gap-2 rounded-3xl border border-white/60 bg-white/90 p-5 shadow-sm md:ml-12"
            >
              <div className="absolute -left-10 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white/80 shadow md:-left-12">
                {iconByType[entry.type]}
              </div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-[var(--color-foreground)]">
                  {entry.title}
                </h3>
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  {format(parseISO(entry.date), "dd MMM yyyy")}
                </span>
              </div>
              <p className="text-sm text-[var(--color-muted-foreground)]">{entry.notes}</p>
            </article>
          ))}
          {pregnancy.timeline && pregnancy.timeline.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/60 bg-white/70 p-6 text-center text-sm text-[var(--color-muted-foreground)]">
              No timeline events captured yet. Add ANC visits or lab data from the dashboard.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}



