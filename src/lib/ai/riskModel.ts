import type { PregnancyPayload } from "@/lib/validation/pregnancy";

type FeatureVector = {
  age: number;
  bmi: number;
  hemoglobin: number;
  bpSystolic: number;
  bpDiastolic: number;
  bloodSugar: number;
  ancVisits: number;
  ironIntake: number;
  previousComplications: number;
};

type Contribution = {
  feature: keyof FeatureVector;
  label: string;
  impact: number;
  direction: "increase" | "decrease";
  description: string;
};

export type RiskResult = {
  logistic: number;
  randomForest: number;
  ensembleScore: number;
  category: "low" | "medium" | "high";
  confidence: number;
  contributions: Contribution[];
};

const FEATURE_LABELS: Record<keyof FeatureVector, string> = {
  age: "Maternal age",
  bmi: "Body mass index",
  hemoglobin: "Hemoglobin",
  bpSystolic: "Systolic BP",
  bpDiastolic: "Diastolic BP",
  bloodSugar: "Blood sugar",
  ancVisits: "ANC visits",
  ironIntake: "Iron & folic intake",
  previousComplications: "Previous complications",
};

const NORMALS: Record<keyof FeatureVector, { mean: number; std: number }> = {
  age: { mean: 26, std: 5.3 },
  bmi: { mean: 22.5, std: 3.1 },
  hemoglobin: { mean: 11.2, std: 1.2 },
  bpSystolic: { mean: 115, std: 12 },
  bpDiastolic: { mean: 74, std: 8 },
  bloodSugar: { mean: 94, std: 15 },
  ancVisits: { mean: 3.2, std: 1.1 },
  ironIntake: { mean: 0.6, std: 0.35 },
  previousComplications: { mean: 0.18, std: 0.4 },
};

const LOGISTIC_WEIGHTS: Record<keyof FeatureVector, number> = {
  age: 0.45,
  bmi: 0.62,
  hemoglobin: -0.88,
  bpSystolic: 0.54,
  bpDiastolic: 0.32,
  bloodSugar: 0.41,
  ancVisits: -0.58,
  ironIntake: -0.73,
  previousComplications: 0.95,
};

const LOGISTIC_INTERCEPT = -0.35;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));

const normalize = (key: keyof FeatureVector, value: number) => {
  const stats = NORMALS[key];
  return (value - stats.mean) / stats.std;
};

const logisticProbability = (features: FeatureVector) => {
  let score = LOGISTIC_INTERCEPT;
  const contributions: Contribution[] = [];
  Object.entries(features).forEach(([key, raw]) => {
    const featureKey = key as keyof FeatureVector;
    const z = normalize(featureKey, raw);
    const weight = LOGISTIC_WEIGHTS[featureKey];
    const impact = weight * z;
    score += impact;
    contributions.push({
      feature: featureKey,
      label: FEATURE_LABELS[featureKey],
      impact,
      direction: impact >= 0 ? "increase" : "decrease",
      description:
        featureKey === "hemoglobin"
          ? "Lower haemoglobin raises anemia-related risk."
          : featureKey === "ironIntake"
            ? "Regular IFA consumption protects from anemia."
            : featureKey === "ancVisits"
              ? "More ANC visits reduce preventable risk."
              : "",
    });
  });
  const probability = sigmoid(score);
  return { probability, contributions };
};

const randomForestProbability = (features: FeatureVector) => {
  // Simple rule-based approximation of a tree ensemble
  let voteSum = 0;
  let voteCount = 0;

  const evaluateNode = (condition: boolean, weight: number) => {
    voteCount += weight;
    if (condition) {
      voteSum += weight;
    }
  };

  evaluateNode(features.hemoglobin < 10, 2);
  evaluateNode(features.bpSystolic > 135 || features.bpDiastolic > 85, 1.5);
  evaluateNode(features.bmi > 28 || features.bmi < 18.5, 1);
  evaluateNode(features.bloodSugar > 130, 1);
  evaluateNode(features.ironIntake < 0.5, 1);
  evaluateNode(features.previousComplications > 0.1, 2.5);
  evaluateNode(features.ancVisits < 2, 1);
  evaluateNode(features.age > 34 || features.age < 19, 1);

  const probability = clamp(voteSum / Math.max(voteCount, 1), 0, 1);
  return probability;
};

export const determineRiskCategory = (score: number): RiskResult["category"] => {
  if (score < 0.4) return "low";
  if (score < 0.7) return "medium";
  return "high";
};

const computeIronScore = (iron: PregnancyPayload["current"]["ironFolicIntake"]) => {
  if (iron === "regular") return 1;
  if (iron === "irregular") return 0.5;
  return 0;
};

const featuresFromPregnancy = (payload: PregnancyPayload): FeatureVector => {
  const complicationsPenalty = payload.obstetric.previousComplications ? 1 : 0;
  const cSectionPenalty = payload.obstetric.previousCSection ? 1 : 0.6;
  const complicationScore = complicationsPenalty + cSectionPenalty;
  return {
    age: payload.personal.age,
    bmi: payload.health.bmi,
    hemoglobin: payload.health.hemoglobin,
    bpSystolic: payload.health.bpSystolic,
    bpDiastolic: payload.health.bpDiastolic,
    bloodSugar: payload.health.bloodSugar,
    ancVisits: payload.current.ancVisits,
    ironIntake: computeIronScore(payload.current.ironFolicIntake),
    previousComplications: complicationScore,
  };
};

export const evaluateRisk = (payload: PregnancyPayload): RiskResult => {
  const features = featuresFromPregnancy(payload);
  const logistic = logisticProbability(features);
  const rf = randomForestProbability(features);
  const ensembleScore = clamp((logistic.probability + rf) / 2, 0, 1);
  const category = determineRiskCategory(ensembleScore);
  const confidence = 1 - Math.abs(logistic.probability - rf);

  const rankedContributions = logistic.contributions
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 5);

  return {
    logistic: logistic.probability,
    randomForest: rf,
    ensembleScore,
    category,
    confidence: clamp(confidence, 0.3, 0.95),
    contributions: rankedContributions,
  };
};

type ActionPlan = {
  summary: string;
  riskCategory: RiskResult["category"];
  priorityActions: string[];
  ancSchedule: string[];
  nutrition: string[];
  medications: string[];
  followUp: string[];
  counselling: string[];
  tts: string;
};

const formatScore = (score: number) => Math.round(score * 100);

const planForRisk = (
  risk: RiskResult,
  payload: PregnancyPayload,
): ActionPlan => {
  const hb = payload.health.hemoglobin;
  const bp = `${payload.health.bpSystolic}/${payload.health.bpDiastolic}`;
  const summary = `Risk score ${formatScore(risk.ensembleScore)} with ${risk.category.toUpperCase()} risk profile. Hemoglobin ${hb} g/dL, BP ${bp}.`;

  const nutrition: string[] = [
    payload.current.ironFolicIntake === "regular"
      ? "Continue daily IFA tablets with citrus juice for absorption."
      : "Restart daily IFA tablets; give 100 tablets and supervise intake weekly.",
    "Add green leafy vegetables (saag, spinach), jaggery and roasted chana twice daily.",
    "Include protein: dal, eggs (if non-veg), curd or groundnut chikki to support fetal growth.",
  ];

  const meds: string[] = [
    "IFA tablet once daily till 180 doses completed.",
    "Calcium 500 mg twice daily after meals, separate from IFA by 2 hours.",
  ];

  const baseFollowup = [
    "Home visit every 2 weeks to monitor BP, weight, fetal movements.",
    "Document ANC in Mother & Child Protection (MCP) card and sync to app.",
  ];

  if (risk.category === "high") {
    return {
      riskCategory: risk.category,
      summary,
      priorityActions: [
        "Refer to nearest FRU/CHC immediately for doctor review.",
        "Arrange transport, inform MOIC and family guardian.",
        "Prepare referral note with vitals, labs, complication history.",
      ],
      ancSchedule: [
        "Doctor ANC within 48 hours, weekly follow-up thereafter.",
        "Lab: Hb, blood sugar, urine protein, thyroid, ultrasound as advised.",
      ],
      nutrition,
      medications: [
        ...meds,
        "If Hb < 8 g/dL, plan IV iron at facility (consult doctor).",
      ],
      followUp: [
        ...baseFollowup,
        "Daily phone check-in for danger signs (bleeding, swelling, headaches).",
        "Trigger high-risk alert in app and assign to doctor.",
      ],
      counselling: [
        "Explain danger signs in simple language; family must know when to rush.",
        "Encourage rest, reduce heavy workload, ensure sleep of 8 hours.",
        "Discuss birth preparedness: transport, blood donor, finance.",
      ],
      tts: `उच्च जोखिम मिला है। तुरंत डॉक्टर से मिलवाएं, आईएफ़ए नियमित कराएं और हर सप्ताह फॉलो-अप करें। परिवार को खतरे के लक्षण समझाएं और वाहन की व्यवस्था रखें।`,
    };
  }

  if (risk.category === "medium") {
    return {
      riskCategory: risk.category,
      summary,
      priorityActions: [
        "Reinforce IFA adherence; document weekly consumption.",
        "Schedule facility ANC within 7 days for medical review.",
        "Monitor BP, edema and fetal movements at every visit.",
      ],
      ancSchedule: [
        "Facility ANC every 2 weeks till delivery.",
        "Repeat Hb test in 4 weeks; perform OGTT if blood sugar elevated.",
      ],
      nutrition,
      medications: meds,
      followUp: [
        ...baseFollowup,
        "Add reminder for TT dose if pending.",
        "Use app alerts for lab follow-up and compliance tracking.",
      ],
      counselling: [
        "Educate on balanced diet, portion control, iron absorption tips.",
        "Encourage moderate activity, pregnancy yoga or safe walks.",
        "Discuss rest, mental wellbeing, partner support.",
      ],
      tts: `मध्यम जोखिम दर्ज हुआ है। सात दिनों में सुविधा पर जाँच कराएं, आईएफ़ए और कैल्शियम नियमित लें और हर दो सप्ताह एएनसी करवाएं।`,
    };
  }

  return {
    riskCategory: risk.category,
    summary,
    priorityActions: [
      "Continue routine ANC with focus on nutrition and rest.",
      "Review danger signs during every counselling session.",
    ],
    ancSchedule: [
      "ANC monthly till 7 months, fortnightly till 9 months, weekly in last month.",
      "Ensure TT doses as per schedule, document in app.",
    ],
    nutrition,
    medications: meds,
    followUp: baseFollowup,
    counselling: [
      "Promote birth preparedness and institutional delivery.",
      "Encourage family support, stress-free environment.",
      "Discuss newborn care and breastfeeding preparation.",
    ],
    tts: `जोखिम कम है, फिर भी नियमित एएनसी, पौष्टिक आहार और आईएफ़ए टैबलेट जारी रखें। परिवार को खतरे के लक्षण याद दिलाएं।`,
  };
};

export const buildActionPlan = (
  risk: RiskResult,
  payload: PregnancyPayload,
) => planForRisk(risk, payload);



