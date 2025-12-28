"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAppwrite } from "@/components/providers/AppwriteProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";

const roles = [
  { label: "ASHA Worker", value: "asha" },
  { label: "Nurse / ANM", value: "nurse" },
  { label: "Doctor", value: "doctor" },
  { label: "Admin", value: "admin" },
];

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Enter a valid email"),
    phone: z
      .string()
      .min(10, "Enter a valid phone number with country code")
      .regex(/^\+?[0-9\s-]{10,20}$/, "Use digits only, e.g. +919876543210"),
    role: z.enum(["asha", "nurse", "doctor", "admin"]),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
    facility: z.string().optional(),
    district: z.string().optional(),
    experienceYears: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const router = useRouter();
  const { account, refreshUser } = useAppwrite();
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "asha",
    },
  });

  const handleSubmit = async (values: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      const digitsOnly = values.phone.replace(/[^0-9]/g, "");
      const normalizedPhone = digitsOnly ? `+${digitsOnly}` : "";
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, phone: normalizedPhone, locale: language }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Registration failed");
      }

      if (!account) {
        toast.info("Account created. Please login.");
        router.push("/auth/login");
        return;
      }

      await account.createEmailPasswordSession(values.email, values.password);
      await refreshUser();
      toast.success("Welcome to Maatri Suraksha!", {
        description: "Account created successfully.",
      });
      router.replace(values.role === "admin" || values.role === "doctor" ? "/analytics" : "/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Registration failed", {
        description:
          (error as { message?: string })?.message ?? "Please try again with different credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--gradient-soft)] px-4 py-12">
      <div className="glass-card relative flex w-full max-w-5xl flex-col gap-10 rounded-[40px] px-6 py-12 md:flex-row md:px-12">
        <div className="flex flex-1 flex-col gap-8 text-center md:text-left">
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <ShieldAlert className="h-10 w-10 text-[var(--color-risk-high)]" />
            <div>
              <h1 className="text-3xl font-semibold text-[var(--color-foreground)]">
                {t("common.appName")}
              </h1>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Register your care team account
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/60 bg-white/70 p-6">
            <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
              Tailored workflows for every role
            </h2>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-[var(--color-muted-foreground)]">
              <li>• ASHA workers – quick data entry, voice notes, follow-ups</li>
              <li>• Nurses/ANM – trimester milestones, vitals, sync queue</li>
              <li>• Doctors – risk analytics, escalations, action validation</li>
              <li>• Admin – program monitoring, compliance, user management</li>
            </ul>
            <p className="mt-4 text-xs text-[var(--color-muted-foreground)]">
              You can invite colleagues later from the Admin console. All accounts enforce consent,
              offline safety, and ethical AI use.
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 rounded-[30px] border border-white/60 bg-white/80 p-8 shadow-lg">
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <Input
              label="Full name"
              placeholder="Sita Devi"
              {...form.register("fullName")}
              error={form.formState.errors.fullName?.message}
            />
            <Input
              label="Email"
              type="email"
              placeholder="asha.worker@example.com"
              {...form.register("email")}
              error={form.formState.errors.email?.message}
            />
            <Input
              label="Phone number"
              placeholder="+91 9876543210"
              {...form.register("phone")}
              error={form.formState.errors.phone?.message}
            />
            <Select
              label="Role"
              options={roles}
              {...form.register("role")}
              error={form.formState.errors.role?.message}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Facility / PHC"
                placeholder="PHC Bihiya"
                {...form.register("facility")}
                error={form.formState.errors.facility?.message}
              />
              <Input
                label="District"
                placeholder="Bhojpur"
                {...form.register("district")}
                error={form.formState.errors.district?.message}
              />
            </div>
            <Input
              label="Years of experience"
              placeholder="4"
              {...form.register("experienceYears")}
              error={form.formState.errors.experienceYears?.message}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Create a strong password"
              {...form.register("password")}
              error={form.formState.errors.password?.message}
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="Re-enter your password"
              {...form.register("confirmPassword")}
              error={form.formState.errors.confirmPassword?.message}
            />
            <Button type="submit" isLoading={isLoading} block>
              Create account
            </Button>
          </form>

          <div className="rounded-2xl bg-white/70 p-4 text-center text-sm text-[var(--color-muted-foreground)]">
            <p>Already have an account?</p>
            <Link
              href="/auth/login"
              className="font-semibold text-[var(--color-accent-peach)] underline-offset-4 hover:underline"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}


