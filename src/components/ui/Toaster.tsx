"use client";

import { Toaster as SonnerToaster } from "sonner";

export const Toaster = () => (
  <SonnerToaster
    theme="light"
    position="top-center"
    toastOptions={{
      style: {
        background: "rgba(255,255,255,0.9)",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.6)",
        color: "var(--color-foreground)",
        boxShadow: "0 20px 48px rgba(238, 113, 146, 0.16)",
      },
    }}
  />
);



