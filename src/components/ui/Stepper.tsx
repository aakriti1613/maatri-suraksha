import clsx from "clsx";

type StepperProps = {
  steps: string[];
  currentStep: number;
};

export const Stepper = ({ steps, currentStep }: StepperProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          return (
            <div key={step} className="flex flex-1 items-center last:flex-[unset]">
              <div
                className={clsx(
                  "flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-semibold transition",
                  isActive
                    ? "border-[var(--color-accent-peach)] bg-[var(--color-accent-peach)] text-[var(--color-foreground)] shadow-lg"
                    : isCompleted
                      ? "border-[var(--color-accent-mint)] bg-[var(--color-accent-mint)] text-[var(--color-foreground)]"
                      : "border-white/60 bg-white/80 text-[var(--color-muted-foreground)]",
                )}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 ? (
                <div className="mx-2 hidden flex-1 border-t border-dashed border-white/60 xl:block" />
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="grid gap-2 text-center sm:grid-cols-5 sm:text-left">
        {steps.map((step, index) => (
          <p
            key={step}
            className={clsx(
              "text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]",
              index === currentStep && "text-[var(--color-accent-peach)]",
            )}
          >
            {step}
          </p>
        ))}
      </div>
    </div>
  );
};



