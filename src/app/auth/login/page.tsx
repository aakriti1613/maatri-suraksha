"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldAlert, Smartphone, UserRound } from "lucide-react";
import { ID, Models } from "appwrite";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppwrite } from "@/components/providers/AppwriteProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";

type LoginMode = "email" | "phone";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Enter a valid phone number")
    .regex(/^\+?[0-9]{10,14}$/, "Phone must include country code, e.g. +919876543210"),
  otp: z.string().optional(),
});

const getRoleRedirect = (user: Models.User<Models.Preferences>) => {
  const role =
    (user.prefs as Models.Preferences & { role?: string })?.role?.toLowerCase() ?? "asha";
  switch (role) {
    case "admin":
      return "/analytics";
    case "doctor":
      return "/analytics";
    case "nurse":
    case "anm":
      return "/dashboard";
    default:
      return "/dashboard";
  }
};

export default function LoginPage() {
  const router = useRouter();
  const { account, refreshUser } = useAppwrite();
  const { t } = useLanguage();
  const [mode, setMode] = useState<LoginMode>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [phoneSession, setPhoneSession] = useState<{ userId: string } | null>(null);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
      otp: "",
    },
  });

  const handleEmailLogin = async (values: z.infer<typeof emailSchema>) => {
    if (!account) return;
    try {
      setIsLoading(true);
      await account.createEmailPasswordSession(values.email, values.password);
      await refreshUser();
      const user = await account.get();
      toast.success("Welcome back!", {
        description: `Logged in as ${user.email ?? user.phone}`,
      });
      router.replace(getRoleRedirect(user));
    } catch (error) {
      console.error(error);
      toast.error("Login failed", {
        description:
          (error as { message?: string })?.message ?? "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (values: z.infer<typeof phoneSchema>) => {
    if (!account) return;
    try {
      setIsLoading(true);
      const session = await account.createPhoneSession(values.phone);
      setPhoneSession({ userId: session.userId });
      toast.success("OTP sent", {
        description: `An OTP has been sent to ${values.phone}`,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to send OTP", {
        description: (error as { message?: string })?.message ?? "Please try again shortly.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (values: z.infer<typeof phoneSchema>) => {
    if (!account || !phoneSession) return;
    if (!values.otp || values.otp.length < 4) {
      phoneForm.setError("otp", { message: "Enter the OTP sent to the phone" });
      return;
    }
    try {
      setIsLoading(true);
      await account.updatePhoneSession(phoneSession.userId, values.otp);
      await refreshUser();
      const user = await account.get();
      toast.success("Welcome!", {
        description: `Logged in as ${user.email ?? user.phone}`,
      });
      router.replace(getRoleRedirect(user));
    } catch (error) {
      console.error(error);
      toast.error("OTP verification failed", {
        description:
          (error as { message?: string })?.message ??
          "Please double check the OTP and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--gradient-soft)] px-4 py-12">
      <div className="glass-card relative flex w-full max-w-5xl flex-col gap-12 rounded-[40px] px-6 py-12 md:flex-row md:px-12">
        <div className="flex flex-1 flex-col gap-8 text-center md:text-left">
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <ShieldAlert className="h-10 w-10 text-[var(--color-risk-high)]" />
            <div>
              <h1 className="text-3xl font-semibold text-[var(--color-foreground)]">
                {t("common.appName")}
              </h1>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                AI-powered maternal health companion
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/60 bg-white/70 p-6">
            <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
              Trusted by ASHA workers, nurses & doctors
            </h2>
            <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
              Secure access with Appwrite authentication, offline-ready data capture, and
              explainable AI to guide safe pregnancies in rural India.
            </p>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-[var(--color-foreground)]">
              <li>• Phone OTP or email sign-in</li>
              <li>• Role-based dashboards</li>
              <li>• Voice-enabled data entry</li>
              <li>• Ethical AI with human oversight</li>
            </ul>
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            By signing in, you confirm informed consent from the beneficiary. This application never
            stores Aadhaar numbers and encrypts health data end-to-end.
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-6 rounded-[30px] border border-white/60 bg-white/80 p-8 shadow-lg">
          <div className="flex rounded-full bg-white/70 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("email");
                setPhoneSession(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "email"
                  ? "bg-[var(--color-accent-peach)] text-[var(--color-foreground)] shadow"
                  : "text-[var(--color-muted-foreground)]"
              }`}
            >
              <UserRound className="h-4 w-4" />
              Email / Password
            </button>
            <button
              type="button"
              onClick={() => setMode("phone")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "phone"
                  ? "bg-[var(--color-accent-peach)] text-[var(--color-foreground)] shadow"
                  : "text-[var(--color-muted-foreground)]"
              }`}
            >
              <Smartphone className="h-4 w-4" />
              Phone / OTP
            </button>
          </div>

          {mode === "email" ? (
            <form
              className="flex flex-col gap-4"
              onSubmit={emailForm.handleSubmit(handleEmailLogin)}
            >
              <Input
                label="Email"
                type="email"
                placeholder="asha.worker@example.com"
                {...emailForm.register("email")}
                error={emailForm.formState.errors.email?.message}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••"
                {...emailForm.register("password")}
                error={emailForm.formState.errors.password?.message}
              />
              <Button type="submit" isLoading={isLoading} block>
                Sign in
              </Button>
            </form>
          ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={phoneForm.handleSubmit((values) =>
                phoneSession ? handleOtpVerify(values) : handleSendOtp(values),
              )}
            >
              <Input
                label="Phone number"
                placeholder="+91 9876543210"
                {...phoneForm.register("phone")}
                error={phoneForm.formState.errors.phone?.message}
                disabled={!!phoneSession}
              />
              {phoneSession ? (
                <Input
                  label="Enter OTP"
                  placeholder="123456"
                  {...phoneForm.register("otp")}
                  error={phoneForm.formState.errors.otp?.message}
                />
              ) : null}
              <Button type="submit" isLoading={isLoading} block>
                {phoneSession ? "Verify & Sign in" : "Send OTP"}
              </Button>
              {!phoneSession ? (
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  You will receive a 6-digit OTP via SMS. Standard carrier charges may apply.
                </p>
              ) : (
                <button
                  type="button"
                  className="text-sm font-semibold text-[var(--color-accent-peach)] underline-offset-4 hover:underline"
                  onClick={() => {
                    setPhoneSession(null);
                    phoneForm.reset();
                  }}
                >
                  Use a different phone number
                </button>
              )}
            </form>
          )}

          <div className="flex flex-col gap-3 rounded-2xl bg-white/70 p-4 text-center text-sm text-[var(--color-muted-foreground)]">
            <p>Need an account?</p>
            <Link
              href="/auth/register"
              className="font-semibold text-[var(--color-accent-peach)] underline-offset-4 hover:underline"
            >
              Register with Appwrite
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}


