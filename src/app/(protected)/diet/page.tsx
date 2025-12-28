"use client";

import { useMemo } from "react";
import { Salad, Soup, Utensils } from "lucide-react";
import { useAppwrite } from "@/components/providers/AppwriteProvider";

const dietGuidance = {
  trimester1: {
    title: "Trimester 1 nourishment",
    items: [
      "Small, frequent meals to manage nausea",
      "Fresh fruits rich in folate (papaya avoided)",
      "Sprouted moong / chana for vegetarian protein",
      "Boiled eggs / fish (macchi) twice a week for non-veg",
    ],
  },
  trimester2: {
    title: "Trimester 2 strengthening",
    items: [
      "Iron-rich foods (ragi, jaggery, spinach, dates)",
      "Calcium boost: ragi porridge, sesame, milk",
      "Hydration with lemon jeera water",
      "Include seasonal vegetables & dals daily",
    ],
  },
  trimester3: {
    title: "Trimester 3 energy & recovery",
    items: [
      "High-protein laddoos (gond, nuts, jaggery)",
      "Lean meats / paneer / soybean chunks",
      "Plenty of fluids: butter milk, coconut water",
      "Avoid fried/spicy foods before check-ups",
    ],
  },
};

export default function DietPage() {
  const { currentUser } = useAppwrite();
  const role = useMemo(
    () =>
      (currentUser?.prefs as { role?: string } | undefined)?.role?.toLowerCase() ?? "asha",
    [currentUser?.prefs],
  );

  return (
    <div className="glass-card flex flex-col gap-6 rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
          Diet & Nutrition Companion
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Trimester-specific meal guidance focusing on affordable local foods. Tailor the plan
          during counselling sessions and capture adherence in the medicine tracker.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        {Object.entries(dietGuidance).map(([key, block]) => (
          <article
            key={key}
            className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              {key === "trimester1" ? (
                <Salad className="h-8 w-8 text-[var(--color-accent-mint)]" />
              ) : key === "trimester2" ? (
                <Soup className="h-8 w-8 text-[var(--color-accent-peach)]" />
              ) : (
                <Utensils className="h-8 w-8 text-[var(--color-accent-lavender)]" />
              )}
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                {block.title}
              </h2>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--color-muted-foreground)]">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      <footer className="rounded-2xl border border-dashed border-white/60 bg-white/70 p-4 text-sm text-[var(--color-muted-foreground)]">
        {role === "asha"
          ? "Record dietary counselling during home visits and log compliance in follow-up forms."
          : "Review diet adherence trends in analytics and reinforce guidance during ANC visits."}
      </footer>
    </div>
  );
}



