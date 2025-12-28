import { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed text-base font-semibold",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-accent-peach)] text-[var(--color-foreground)] hover:bg-[#f89d96] focus-visible:outline-[var(--color-accent-peach)]",
        secondary:
          "bg-white/80 text-[var(--color-foreground)] border border-white/60 hover:bg-white focus-visible:outline-[var(--color-accent-lavender)]",
        ghost:
          "bg-transparent text-[var(--color-foreground)] hover:bg-white/50 focus-visible:outline-[var(--color-accent-mint)]",
        danger:
          "bg-[var(--color-risk-high)] text-white hover:bg-[#e04d5c] focus-visible:outline-[var(--color-risk-high)]",
      },
      size: {
        md: "px-6 py-3",
        lg: "px-6 py-4 text-lg",
        sm: "px-4 py-2 text-sm",
        icon: "p-3",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;
  };

export const Button = ({
  children,
  className,
  isLoading,
  disabled,
  variant,
  size,
  block,
  ...props
}: PropsWithChildren<ButtonProps>) => {
  return (
    <button
      className={clsx(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
      )}
      {children}
    </button>
  );
};



