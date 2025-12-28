"use client";

import { Lock, ShieldCheck, Users } from "lucide-react";

const points = [
  {
    title: "Consent-first data capture",
    description:
      "We collect maternal health data only after explicit informed consent from the beneficiary. Consent status is stored alongside every record.",
    icon: Users,
  },
  {
    title: "Privacy by design",
    description:
      "No Aadhaar or highly sensitive identifiers are collected. Appwrite encrypts data at rest and in transit, while access policies enforce least privilege.",
    icon: ShieldCheck,
  },
  {
    title: "Human-in-the-loop AI",
    description:
      "Risk predictions assist—not replace—clinical judgement. Every AI output records who triggered it, model version, and confidence explanations.",
    icon: Lock,
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="glass-card rounded-[32px] border border-white/60 bg-white/80 p-6 shadow">
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
          Data Privacy & Ethical AI
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted-foreground)]">
          Maatri Suraksha is committed to safeguarding maternal health information with empathy and
          responsibility. This page outlines how we protect data, uphold consent, and ensure the AI
          companion remains transparent and accountable.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        {points.map((point) => (
          <article
            key={point.title}
            className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-sm"
          >
            <point.icon className="h-10 w-10 text-[var(--color-accent-lavender)]" />
            <h2 className="mt-4 text-lg font-semibold text-[var(--color-foreground)]">
              {point.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              {point.description}
            </p>
          </article>
        ))}
      </section>
      <section className="glass-card rounded-[28px] border border-white/60 bg-white/80 p-6 text-sm text-[var(--color-muted-foreground)]">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          Key safeguards
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>No Aadhaar, ration card, or financial identifiers collected.</li>
          <li>Role-based policies for ASHA, Nurse/ANM, Doctor, and Admin groups.</li>
          <li>Audit log for risk predictions, action plan acknowledgements, and data exports.</li>
          <li>Offline data encrypted within device storage and purged after successful sync.</li>
          <li>Explainable AI narratives accompany every risk score to avoid black-box decisions.</li>
        </ul>
      </section>
    </div>
  );
}



