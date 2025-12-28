"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  FormProvider,
  useFormContext,
  type UseFormRegisterReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, differenceInWeeks, formatISO, parseISO } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Stepper } from "@/components/ui/Stepper";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useAppwrite } from "@/components/providers/AppwriteProvider";
import { useOffline } from "@/components/providers/OfflineProvider";
import {
  pregnancySchema,
  type PregnancyPayload,
} from "@/lib/validation/pregnancy";

type PregnancyFormValues = PregnancyPayload;

const steps = [
  "Personal Details",
  "Family & Socio-economics",
  "Obstetric History",
  "Current Pregnancy",
  "Health Indicators",
];

const incomeOptions = [
  { label: "< ₹5,000", value: "<5000" },
  { label: "₹5,000 – 10,000", value: "5000-10000" },
  { label: "₹10,000 – 20,000", value: "10000-20000" },
  { label: "> ₹20,000", value: ">20000" },
];

const ironOptions = [
  { label: "Regular", value: "regular" },
  { label: "Irregular", value: "irregular" },
  { label: "Not started", value: "not-started" },
];

const trimesterLabels = ["First Trimester", "Second Trimester", "Third Trimester"];

const calculateTrimester = (lmp: string) => {
  try {
    const weeks = differenceInWeeks(new Date(), parseISO(lmp));
    if (weeks < 14) return "Trimester 1";
    if (weeks < 28) return "Trimester 2";
    return "Trimester 3";
  } catch {
    return "Trimester 1";
  }
};

const roundToOne = (value: number) => Math.round(value * 10) / 10;

export default function NewPregnancyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setSubmitting] = useState(false);
  const { language } = useLanguage();
  const { isOnline, enqueue, registerHandler } = useOffline();
  const { currentUser } = useAppwrite();

  const form = useForm<PregnancyFormValues>({
    resolver: zodResolver(pregnancySchema),
    mode: "onBlur",
    defaultValues: {
      personal: {
        name: "",
        age: 24,
        village: "",
        phone: "+91",
        education: "Secondary",
      },
      family: {
        incomeRange: incomeOptions[1]?.value ?? "5000-10000",
        dietType: "veg",
        householdSize: 4,
        cleanWater: true,
        sanitation: true,
        phcDistanceKm: 3,
        partnerOccupation: "Farmer",
      },
      obstetric: {
        gravida: 1,
        para: 0,
        abortions: 0,
        previousComplications: "",
        previousCSection: false,
        birthSpacingMonths: 0,
      },
      current: {
        lmp: formatISO(new Date(), { representation: "date" }),
        edd: "",
        trimester: "Trimester 1",
        ancVisits: 0,
        ttDoses: 0,
        ironFolicIntake: "regular",
      },
      health: {
        heightCm: 160,
        weightKg: 55,
        bmi: 21.5,
        bpSystolic: 110,
        bpDiastolic: 70,
        hemoglobin: 11,
        bloodSugar: 90,
        thyroidTsh: 2,
        edema: false,
      },
    },
  });

  const watchLmp = form.watch("current.lmp");
  const watchHeight = form.watch("health.heightCm");
  const watchWeight = form.watch("health.weightKg");

  useEffect(() => {
    if (!watchLmp) return;
    try {
      const estDate = addDays(parseISO(watchLmp), 280);
      form.setValue("current.edd", formatISO(estDate, { representation: "date" }));
      form.setValue("current.trimester", calculateTrimester(watchLmp));
    } catch {
      // ignore parse error; validation will catch
    }
  }, [form, watchLmp]);

  useEffect(() => {
    if (!watchHeight || !watchWeight) return;
    const heightMeters = watchHeight / 100;
    if (!heightMeters) return;
    const bmi = roundToOne(watchWeight / (heightMeters * heightMeters));
    if (Number.isFinite(bmi)) {
      form.setValue("health.bmi", bmi, { shouldValidate: true });
    }
  }, [form, watchHeight, watchWeight]);

  useEffect(() => {
    registerHandler("pregnancies.create", async (mutation) => {
      const body = mutation.payload as {
        values: PregnancyFormValues;
        meta: Record<string, unknown>;
      };
      await fetch("/api/pregnancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    });
  }, [registerHandler]);

  const goNext = async () => {
    const sectionKeys: Array<keyof PregnancyFormValues> = [
      "personal",
      "family",
      "obstetric",
      "current",
      "health",
    ];
    const currentKey = sectionKeys[step];
    const valid = await form.trigger(currentKey);
    if (!valid) return;
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goBack = () => setStep((prev) => Math.max(prev - 1, 0));

  const onSubmit = async (values: PregnancyFormValues) => {
    setSubmitting(true);
    const payload = {
      values,
      meta: {
        capturedAt: new Date().toISOString(),
        language,
        createdBy: currentUser?.$id ?? null,
      },
    };

    const POST = async () =>
      fetch("/api/pregnancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

    try {
      if (!isOnline) {
        await enqueue({
          type: "pregnancies.create",
          payload,
        });
        toast.info("Offline entry queued", {
          description: "Will sync with Appwrite when you reconnect.",
        });
        router.replace("/dashboard");
        return;
      }

      const response = await POST();
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.error ?? "Failed to save pregnancy");
      }
      const result = (await response.json()) as {
        pregnancyId: string;
        demoFallback?: boolean;
      };
      toast.success("Pregnancy record saved");
      router.replace(`/pregnancies/${result.pregnancyId}/timeline`);
    } catch (error) {
      console.error(error);
      await enqueue({
        type: "pregnancies.create",
        payload,
      });
      toast.warning("Saved offline", {
        description: "We will sync automatically when network returns.",
      });
      router.replace("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form
        className="flex min-h-screen flex-col gap-6 bg-[var(--gradient-soft)] px-4 py-6 md:px-8"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="glass-card flex flex-col gap-6 rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Guided capture
            </p>
            <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
              Add new pregnancy
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Voice-enabled multi-step form optimised for ASHA workers. Fields auto-compute EDD and
              BMI, and sync safely even in offline mode.
            </p>
          </div>
          <Stepper steps={steps} currentStep={step} />
        </div>

        <div className="glass-card flex flex-col gap-8 rounded-[32px] border border-white/60 bg-white/90 p-6 shadow-lg">
          {step === 0 && <PersonalSection />}
          {step === 1 && <FamilySection />}
          {step === 2 && <ObstetricSection />}
          {step === 3 && <CurrentPregnancySection />}
          {step === 4 && <HealthIndicatorsSection />}
        </div>

        <div className="flex flex-wrap justify-between gap-4">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={goBack}
            disabled={step === 0 || isSubmitting}
          >
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" size="lg" onClick={goNext} isLoading={isSubmitting}>
              Next
            </Button>
          ) : (
            <Button type="submit" size="lg" isLoading={isSubmitting}>
              Save pregnancy
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

const PersonalSection = () => {
  const { register, formState, setValue } = useFormContext<PregnancyFormValues>();
  const { language } = useLanguage();

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <VoiceInputField
        label="Woman's name (optional / masked)"
        placeholder="Sita D."
        registration={register("personal.name")}
        error={formState.errors.personal?.name?.message}
        setValue={(val) => setValue("personal.name", val)}
        language={language}
      />
      <NumberField
        label="Age"
        registration={register("personal.age", { valueAsNumber: true })}
        error={formState.errors.personal?.age?.message}
      />
      <VoiceInputField
        label="Village / Address"
        placeholder="Rampur, Block"
        registration={register("personal.village")}
        error={formState.errors.personal?.village?.message}
        setValue={(val) => setValue("personal.village", val)}
        language={language}
      />
      <VoiceInputField
        label="Phone number"
        placeholder="+91 98XXXXXX"
        registration={register("personal.phone")}
        error={formState.errors.personal?.phone?.message}
        setValue={(val) => setValue("personal.phone", val)}
        language={language}
      />
      <VoiceInputField
        label="Education level"
        placeholder="Secondary"
        registration={register("personal.education")}
        error={formState.errors.personal?.education?.message}
        setValue={(val) => setValue("personal.education", val)}
        language={language}
      />
    </div>
  );
};

const FamilySection = () => {
  const { register, setValue, formState } = useFormContext<PregnancyFormValues>();
  const { language } = useLanguage();

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Select
        label="Family income (monthly)"
        options={incomeOptions}
        {...register("family.incomeRange")}
        error={formState.errors.family?.incomeRange?.message}
      />
      <Select
        label="Diet type"
        options={[
          { label: "Vegetarian", value: "veg" },
          { label: "Non-vegetarian", value: "non-veg" },
        ]}
        {...register("family.dietType")}
        error={formState.errors.family?.dietType?.message}
      />
      <NumberField
        label="Household size"
        registration={register("family.householdSize", { valueAsNumber: true })}
        error={formState.errors.family?.householdSize?.message}
      />
      <NumberField
        label="Distance to nearest PHC (km)"
        registration={register("family.phcDistanceKm", { valueAsNumber: true })}
        error={formState.errors.family?.phcDistanceKm?.message}
      />
      <ToggleField
        label="Access to clean water"
        registration={register("family.cleanWater")}
        checkedDefault
      />
      <ToggleField
        label="Sanitation facility available"
        registration={register("family.sanitation")}
        checkedDefault
      />
      <VoiceInputField
        label="Husband / partner occupation"
        placeholder="Farmer"
        registration={register("family.partnerOccupation")}
        error={formState.errors.family?.partnerOccupation?.message}
        setValue={(val) => setValue("family.partnerOccupation", val)}
        language={language}
      />
    </div>
  );
};

const ObstetricSection = () => {
  const { register, setValue, formState } = useFormContext<PregnancyFormValues>();
  const { language } = useLanguage();

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <NumberField
        label="Gravida"
        registration={register("obstetric.gravida", { valueAsNumber: true })}
        error={formState.errors.obstetric?.gravida?.message}
      />
      <NumberField
        label="Para"
        registration={register("obstetric.para", { valueAsNumber: true })}
        error={formState.errors.obstetric?.para?.message}
      />
      <NumberField
        label="Abortions"
        registration={register("obstetric.abortions", { valueAsNumber: true })}
        error={formState.errors.obstetric?.abortions?.message}
      />
      <VoiceInputField
        label="Previous complications"
        placeholder="None"
        registration={register("obstetric.previousComplications")}
        error={formState.errors.obstetric?.previousComplications?.message}
        setValue={(val) => setValue("obstetric.previousComplications", val)}
        language={language}
      />
      <ToggleField
        label="Previous C-section"
        registration={register("obstetric.previousCSection")}
      />
      <NumberField
        label="Birth spacing (months)"
        registration={register("obstetric.birthSpacingMonths", { valueAsNumber: true })}
        error={formState.errors.obstetric?.birthSpacingMonths?.message}
      />
    </div>
  );
};

const CurrentPregnancySection = () => {
  const { register, formState, watch } = useFormContext<PregnancyFormValues>();
  const trimester = watch("current.trimester");
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Input
        label="Last menstrual period (LMP)"
        type="date"
        {...register("current.lmp")}
        error={formState.errors.current?.lmp?.message}
      />
      <Input
        label="Estimated due date (auto)"
        type="date"
        {...register("current.edd")}
        error={formState.errors.current?.edd?.message}
        disabled
      />
      <Input
        label="Current trimester"
        value={trimester}
        disabled
        {...register("current.trimester")}
      />
      <NumberField
        label="ANC visits completed"
        registration={register("current.ancVisits", { valueAsNumber: true })}
        error={formState.errors.current?.ancVisits?.message}
      />
      <NumberField
        label="TT injections received"
        registration={register("current.ttDoses", { valueAsNumber: true })}
        error={formState.errors.current?.ttDoses?.message}
      />
      <Select
        label="Iron & folic acid intake"
        options={ironOptions}
        {...register("current.ironFolicIntake")}
        error={formState.errors.current?.ironFolicIntake?.message}
      />
      <aside className="col-span-full rounded-2xl border border-dashed border-white/60 bg-white/70 p-4 text-sm text-[var(--color-muted-foreground)]">
        {trimesterLabels.includes(trimester)
          ? trimesterLabels[["Trimester 1", "Trimester 2", "Trimester 3"].indexOf(trimester)] ??
            trimester
          : trimester}
      </aside>
    </div>
  );
};

const HealthIndicatorsSection = () => {
  const { register, formState, watch } = useFormContext<PregnancyFormValues>();
  const bmi = watch("health.bmi");

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <NumberField
        label="Height (cm)"
        registration={register("health.heightCm", { valueAsNumber: true })}
        error={formState.errors.health?.heightCm?.message}
      />
      <NumberField
        label="Weight (kg)"
        registration={register("health.weightKg", { valueAsNumber: true })}
        error={formState.errors.health?.weightKg?.message}
      />
      <Input label="BMI (auto)" value={bmi ?? ""} disabled />
      <div className="grid grid-cols-2 gap-4 md:col-span-2">
        <NumberField
          label="BP systolic"
          registration={register("health.bpSystolic", { valueAsNumber: true })}
          error={formState.errors.health?.bpSystolic?.message}
        />
        <NumberField
          label="BP diastolic"
          registration={register("health.bpDiastolic", { valueAsNumber: true })}
          error={formState.errors.health?.bpDiastolic?.message}
        />
      </div>
      <NumberField
        label="Hemoglobin (g/dL)"
        registration={register("health.hemoglobin", { valueAsNumber: true })}
        error={formState.errors.health?.hemoglobin?.message}
      />
      <NumberField
        label="Random blood sugar (mg/dL)"
        registration={register("health.bloodSugar", { valueAsNumber: true })}
        error={formState.errors.health?.bloodSugar?.message}
      />
      <NumberField
        label="Thyroid TSH (if available)"
        registration={register("health.thyroidTsh", { valueAsNumber: true })}
        error={formState.errors.health?.thyroidTsh?.message}
      />
      <ToggleField label="Edema present" registration={register("health.edema")} />
    </div>
  );
};

type VoiceFieldProps = {
  label: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
  error?: string;
  setValue: (value: string) => void;
  language: "en" | "hi";
};

const VoiceInputField = ({
  label,
  placeholder,
  registration,
  error,
  setValue,
  language,
}: VoiceFieldProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Input label={label} placeholder={placeholder} {...registration} error={error} />
      <VoiceInputButton
        label="Tap & speak"
        language={language}
        onTranscript={(text) => setValue(text)}
      />
    </div>
  );
};

type NumberFieldProps = {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
};

const NumberField = ({ label, registration, error }: NumberFieldProps) => (
  <Input
    label={label}
    type="number"
    inputMode="decimal"
    step="any"
    {...registration}
    error={error}
  />
);

type ToggleFieldProps = {
  label: string;
  registration: UseFormRegisterReturn;
  checkedDefault?: boolean;
};

const ToggleField = ({ label, registration, checkedDefault }: ToggleFieldProps) => (
  <label className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm font-semibold text-[var(--color-foreground)] shadow-sm">
    {label}
    <input
      type="checkbox"
      className="h-5 w-5 rounded-full border-[var(--color-accent-peach)] text-[var(--color-accent-peach)] focus:ring-[var(--color-accent-peach)]"
      defaultChecked={checkedDefault}
      {...registration}
    />
  </label>
);


