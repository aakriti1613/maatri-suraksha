"use client";

import { useMemo } from "react";
import { Pill, Syringe, Thermometer, Timer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAppwrite } from "@/components/providers/AppwriteProvider";

const sampleMedications = [
  {
    name: "Iron & Folic Acid",
    dosage: "1 tablet",
    frequency: "Daily after dinner",
    duration: "Till delivery",
    adherence: 82,
    type: "tablet",
  },
  {
    name: "Calcium carbonate",
    dosage: "500 mg",
    frequency: "Daily morning",
    duration: "24 weeks onwards",
    adherence: 67,
    type: "tablet",
  },
  {
    name: "TT Injection",
    dosage: "0.5 ml IM",
    frequency: "2 doses",
    duration: "First at 16 weeks, second after 4 weeks",
    adherence: 100,
    type: "injection",
  },
];

export default function MedicationsPage() {
  const { currentUser } = useAppwrite();
  const role = useMemo(
    () =>
      (currentUser?.prefs as { role?: string } | undefined)?.role?.toLowerCase() ?? "asha",
    [currentUser?.prefs],
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="glass-card rounded-[32px] border border-white/60 bg-white/80 p-6 shadow">
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
          Medicine Tracker
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Monitor prescribed medicines, doses, compliance, and reminders. Syncs with alerts so no
          ANC essential is missed.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="primary" size="sm">
            <Pill className="h-4 w-4" />
            Add prescription
          </Button>
          <Button variant="secondary" size="sm">
            <Timer className="h-4 w-4" />
            Set reminder
          </Button>
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        {sampleMedications.map((med) => (
          <article
            key={med.name}
            className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-accent-peach)]/20">
                {med.type === "injection" ? (
                  <Syringe className="h-5 w-5 text-[var(--color-accent-peach)]" />
                ) : med.type === "tablet" ? (
                  <Pill className="h-5 w-5 text-[var(--color-accent-peach)]" />
                ) : (
                  <Thermometer className="h-5 w-5 text-[var(--color-accent-peach)]" />
                )}
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--color-foreground)]">
                  {med.name}
                </h2>
                <p className="text-xs text-[var(--color-muted-foreground)]">{med.frequency}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 text-sm text-[var(--color-muted-foreground)]">
              <p>
                <span className="font-semibold text-[var(--color-foreground)]">Dosage:</span>{" "}
                {med.dosage}
              </p>
              <p>
                <span className="font-semibold text-[var(--color-foreground)]">Duration:</span>{" "}
                {med.duration}
              </p>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--color-foreground)]">Adherence:</span>
                <div className="flex-1 overflow-hidden rounded-full bg-white/60">
                  <div
                    className="h-2 rounded-full bg-[var(--color-accent-mint)]"
                    style={{ width: `${med.adherence}%` }}
                  />
                </div>
                <span>{med.adherence}%</span>
              </div>
            </div>
          </article>
        ))}
      </section>
      <footer className="rounded-2xl border border-dashed border-white/60 bg-white/70 p-4 text-sm text-[var(--color-muted-foreground)]">
        {role === "asha"
          ? "Record medicine adherence during home visits. Missed doses automatically trigger alerts."
          : "Review adherence trends and adjust prescriptions during ANC clinic days."}
      </footer>
    </div>
  );
}



