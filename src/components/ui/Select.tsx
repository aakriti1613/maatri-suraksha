import { forwardRef, ReactNode, SelectHTMLAttributes } from "react";
import clsx from "clsx";

export type SelectOption = {
  label: string;
  value: string | number;
};

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string | ReactNode;
  error?: string;
  options: SelectOption[];
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, options, id, name, className, ...props }, ref) => {
    const selectId = id ?? name;
    return (
      <div className="flex flex-col gap-2">
        {label ? (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-[var(--color-foreground)]/80"
          >
            {label}
          </label>
        ) : null}
        <select
          id={selectId}
          ref={ref}
          className={clsx(
            "h-12 rounded-2xl border border-white/60 bg-white/70 px-4 text-base text-[var(--color-foreground)] shadow-sm transition focus:border-[var(--color-accent-peach)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-peach)]/40",
            error && "border-[var(--color-risk-high)] bg-[var(--color-risk-high)]/5",
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error ? (
          <p className="text-sm text-[var(--color-risk-high)]">{error}</p>
        ) : hint ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{hint}</p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = "Select";



