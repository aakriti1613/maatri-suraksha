"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Feather, ShieldAlert, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";

type OnboardingStep = {
  title: string;
  description: string;
  illustration: React.ReactNode;
};

const gradientClasses = [
  "from-[#fbc4d4] via-[#c9c3f7] to-[#b8f2e6]",
  "from-[#b8f2e6] via-[#f9b4ab] to-[#fbc4d4]",
  "from-[#c9c3f7] via-[#b8f2e6] to-[#f9b4ab]",
];

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  const [activeStep, setActiveStep] = useState(0);

  const steps = useMemo<OnboardingStep[]>(
    () => [
      {
        title: t("splash.intro1Title"),
        description: t("splash.intro1Body"),
        illustration: (
          <ShieldAlert className="h-16 w-16 text-[var(--color-risk-high)] drop-shadow-lg" />
        ),
      },
      {
        title: t("splash.intro2Title"),
        description: t("splash.intro2Body"),
        illustration: (
          <Sparkles className="h-16 w-16 text-[var(--color-accent-lavender)] drop-shadow-lg" />
        ),
      },
      {
        title: t("splash.intro3Title"),
        description: t("splash.intro3Body"),
        illustration: (
          <Feather className="h-16 w-16 text-[var(--color-accent-mint)] drop-shadow-lg" />
        ),
      },
    ],
    [t],
  );

  const handleNext = () => {
    setActiveStep((prev) => (prev + 1) % steps.length);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[var(--gradient-soft)]" />
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-10 rounded-[40px] border border-white/40 bg-white/60 px-6 py-10 shadow-[0_32px_80px_rgba(238,113,146,0.18)] backdrop-blur-xl sm:px-12 md:flex-row md:items-start md:gap-16 md:py-16">
        <div className="flex w-full flex-1 flex-col items-center gap-8 text-center md:items-start md:text-left">
          <span className="inline-flex items-center gap-3 rounded-full border border-white/50 bg-white/70 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            <ShieldAlert className="h-4 w-4 text-[var(--color-risk-high)]" />
            {t("common.appName")}
          </span>
          <h1 className="text-4xl font-semibold leading-snug text-[var(--color-foreground)] sm:text-5xl">
            {t("splash.welcome")}
          </h1>
          <p className="max-w-xl text-lg text-[var(--color-muted-foreground)]">
            {steps[activeStep]?.description}
          </p>

          <div className="flex flex-col items-center gap-4 md:flex-row md:items-center">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  language === "en"
                    ? "bg-[var(--color-accent-peach)] text-[var(--color-foreground)]"
                    : "bg-white/70 text-[var(--color-muted-foreground)] shadow"
                }`}
              >
                {t("splash.english")}
              </button>
              <button
                type="button"
                onClick={() => setLanguage("hi")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  language === "hi"
                    ? "bg-[var(--color-accent-peach)] text-[var(--color-foreground)]"
                    : "bg-white/70 text-[var(--color-muted-foreground)] shadow"
                }`}
              >
                {t("splash.hindi")}
              </button>
            </div>
            <span className="hidden h-6 border-l border-white/60 md:inline-block" />
            <Link href="/auth/login">
              <Button size="lg">{t("splash.getStarted")}</Button>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {steps.map((step, index) => (
              <button
                key={step.title}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`h-2 rounded-full transition-all ${
                  activeStep === index ? "w-16 bg-[var(--color-accent-peach)]" : "w-6 bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative flex w-full max-w-md flex-1 flex-col items-center gap-6 rounded-[32px] border border-white/50 bg-white/80 p-8 shadow-lg backdrop-blur-lg md:max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={steps[activeStep]?.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center gap-6 text-center"
            >
              <div
                className={`flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br ${gradientClasses[activeStep]} shadow-xl`}
              >
                {steps[activeStep]?.illustration}
              </div>
              <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
                {steps[activeStep]?.title}
              </h2>
              <p className="text-base text-[var(--color-muted-foreground)]">
                {steps[activeStep]?.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {activeStep + 1} / {steps.length}
            </span>
            <Button variant="secondary" onClick={handleNext}>
              {t("common.continue")}
            </Button>
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {t("splash.intro3Body")}
          </p>
        </div>
      </div>
    </main>
  );
}

