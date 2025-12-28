"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BellRing, CheckCircle2, Clock, RefreshCcw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/Button";
import { useAppwrite } from "@/components/providers/AppwriteProvider";
import { useOffline } from "@/components/providers/OfflineProvider";

type Alert = {
  id: string;
  message: string;
  dueOn: string;
  priority: string;
  status: string;
  type: string;
};

type AlertsResponse = {
  alerts: Alert[];
  demoFallback: boolean;
};

export default function AlertsPage() {
  const { currentUser } = useAppwrite();
  const { enqueue, isOnline, registerHandler } = useOffline();

  const { data, isLoading, refetch, isFetching } = useQuery<AlertsResponse>({
    queryKey: ["alerts", currentUser?.$id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentUser?.$id) params.set("userId", currentUser.$id);
      const response = await fetch(`/api/alerts?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to load alerts");
      return (await response.json()) as AlertsResponse;
    },
    enabled: !!currentUser,
  });

  const handleMarkComplete = async (alert: Alert) => {
    if (!isOnline) {
      await enqueue({
        type: "alerts.markComplete",
        payload: alert,
      });
    }
    await fetch(`/api/alerts/${alert.id}/complete`, {
      method: "POST",
    });
    void refetch();
  };

  useEffect(() => {
    registerHandler("alerts.markComplete", async (mutation) => {
      const alert = mutation.payload as Alert;
      await fetch(`/api/alerts/${alert.id}/complete`, {
        method: "POST",
      });
    });
  }, [registerHandler]);

  return (
    <div className="flex flex-col gap-6">
      <header className="glass-card flex flex-col gap-3 rounded-[32px] border border-white/60 bg-white/80 p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
              Alerts & Follow-ups
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Track upcoming visits, labs, medicines, and escalations. Actions sync automatically
              when you reconnect.
            </p>
          </div>
          <Button variant="secondary" onClick={() => refetch()} isLoading={isFetching}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        {!isOnline ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-accent-peach)] bg-[var(--color-accent-peach)]/20 p-3 text-sm text-[var(--color-foreground)]">
            Offline mode: any updates are stored locally and will sync once connectivity returns.
          </div>
        ) : null}
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        {(data?.alerts ?? []).map((alert) => (
          <article
            key={alert.id}
            className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-accent-peach)]/20">
                  <BellRing className="h-5 w-5 text-[var(--color-accent-peach)]" />
                </div>
                <h2 className="text-base font-semibold text-[var(--color-foreground)]">
                  {alert.message}
                </h2>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                {alert.priority}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {format(parseISO(alert.dueOn), "dd MMM, yyyy")}
              </span>
              <span className="uppercase">{alert.type}</span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Status: {alert.status}
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleMarkComplete(alert)}
                disabled={alert.status === "completed"}
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark done
              </Button>
            </div>
          </article>
        ))}
      </section>
      {data?.demoFallback ? (
        <div className="rounded-2xl border border-dashed border-white/70 bg-white/60 p-4 text-sm text-[var(--color-muted-foreground)]">
          Demo mode: Showing sample alerts until Appwrite sync completes.
        </div>
      ) : null}
      {isLoading ? (
        <div className="rounded-2xl border border-white/60 bg-white/70 p-6 text-center text-sm text-[var(--color-muted-foreground)]">
          Loading alerts...
        </div>
      ) : null}
    </div>
  );
}


