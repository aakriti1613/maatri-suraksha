import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string | ReactNode;
  error?: string;
  trailingIcon?: ReactNode;
  leadingIcon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, hint, error, className, trailingIcon, leadingIcon, id, ...props },
    ref,
  ) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-2">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-foreground)]/80"
          >
            {label}
          </label>
        ) : null}
        <div
          className={clsx(
            "flex h-12 items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-4 shadow-sm focus-within:border-[var(--color-accent-peach)] focus-within:ring-2 focus-within:ring-[var(--color-accent-peach)]/40 transition",
            error && "border-[var(--color-risk-high)] bg-[var(--color-risk-high)]/5",
          )}
        >
          {leadingIcon ? (
            <span className="text-[var(--color-muted-foreground)]">{leadingIcon}</span>
          ) : null}
          <input
            id={inputId}
            ref={ref}
            className={clsx(
              "flex-1 border-none bg-transparent text-base text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none",
              className,
            )}
            {...props}
          />
          {trailingIcon ? (
            <span className="text-[var(--color-muted-foreground)]">{trailingIcon}</span>
          ) : null}
        </div>
        {error ? (
          <p className="text-sm text-[var(--color-risk-high)]">{error}</p>
        ) : hint ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{hint}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";



