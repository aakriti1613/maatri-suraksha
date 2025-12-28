import { z } from "zod";

export const pregnancySchema = z.object({
  personal: z.object({
    name: z.string().optional(),
    age: z.coerce.number().min(15).max(55),
    village: z.string().min(2),
    phone: z.string().min(10).max(14),
    education: z.string().min(2),
  }),
  family: z.object({
    incomeRange: z.string().min(1),
    dietType: z.enum(["veg", "non-veg"]),
    householdSize: z.coerce.number().min(1),
    cleanWater: z.boolean(),
    sanitation: z.boolean(),
    phcDistanceKm: z.coerce.number().min(0),
    partnerOccupation: z.string().min(2),
  }),
  obstetric: z.object({
    gravida: z.coerce.number().min(0),
    para: z.coerce.number().min(0),
    abortions: z.coerce.number().min(0),
    previousComplications: z.string().optional(),
    previousCSection: z.boolean(),
    birthSpacingMonths: z.coerce.number().min(0),
  }),
  current: z.object({
    lmp: z.string().min(1),
    edd: z.string().optional(),
    trimester: z.string().min(1),
    ancVisits: z.coerce.number().min(0),
    ttDoses: z.coerce.number().min(0),
    ironFolicIntake: z.enum(["regular", "irregular", "not-started"]),
  }),
  health: z.object({
    heightCm: z.coerce.number().min(120).max(200),
    weightKg: z.coerce.number().min(30).max(180),
    bmi: z.coerce.number().min(10).max(45),
    bpSystolic: z.coerce.number().min(80).max(200),
    bpDiastolic: z.coerce.number().min(40).max(130),
    hemoglobin: z.coerce.number().min(4).max(18),
    bloodSugar: z.coerce.number().min(60).max(400),
    thyroidTsh: z.coerce.number().min(0).max(20).optional(),
    edema: z.boolean(),
  }),
});

export type PregnancyPayload = z.infer<typeof pregnancySchema>;



