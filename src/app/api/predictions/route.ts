import { NextRequest, NextResponse } from "next/server";
import { ID } from "appwrite";
import { evaluateRisk, buildActionPlan } from "@/lib/ai/riskModel";
import {
  pregnancySchema,
  type PregnancyPayload,
} from "@/lib/validation/pregnancy";
import {
  appwriteServerConfig,
  aiConfig,
  collectionIds,
} from "@/lib/appwrite/config";
import {
  getServerDatabases,
  serverCollections,
} from "@/lib/appwrite/server";

type PredictionRequest = {
  pregnancyId?: string;
  pregnancy?: PregnancyPayload;
};

const DEMO_PREDICTION = {
  pregnancy: pregnancySchema.parse({
    personal: {
      name: "Demo Beneficiary",
      age: 30,
      village: "Demo Village",
      phone: "+919900000000",
      education: "Secondary",
    },
    family: {
      incomeRange: "5000-10000",
      dietType: "veg",
      householdSize: 4,
      cleanWater: true,
      sanitation: true,
      phcDistanceKm: 5,
      partnerOccupation: "Farmer",
    },
    obstetric: {
      gravida: 2,
      para: 1,
      abortions: 0,
      previousComplications: "Anemia",
      previousCSection: false,
      birthSpacingMonths: 28,
    },
    current: {
      lmp: "2025-02-01",
      edd: "2025-11-08",
      trimester: "Trimester 2",
      ancVisits: 3,
      ttDoses: 1,
      ironFolicIntake: "irregular",
    },
    health: {
      heightCm: 160,
      weightKg: 58,
      bmi: 22.6,
      bpSystolic: 128,
      bpDiastolic: 84,
      hemoglobin: 10,
      bloodSugar: 102,
      thyroidTsh: 2.5,
      edema: true,
    },
  }),
};

const fetchPregnancy = async (pregnancyId: string) => {
  if (
    !appwriteServerConfig.endpoint ||
    !appwriteServerConfig.projectId ||
    !appwriteServerConfig.apiKey ||
    !appwriteServerConfig.databaseId
  ) {
    return DEMO_PREDICTION.pregnancy;
  }

  const databases = getServerDatabases();
  const document = await databases.getDocument(
    appwriteServerConfig.databaseId,
    serverCollections.pregnancies,
    pregnancyId,
  );
  return pregnancySchema.parse(document);
};

const storePrediction = async (data: {
  pregnancyId: string | null;
  payload: PregnancyPayload;
  score: number;
  category: string;
  confidence: number;
  explanations: ReturnType<typeof evaluateRisk>["contributions"];
  plan: ReturnType<typeof buildActionPlan>;
}) => {
  if (
    !appwriteServerConfig.endpoint ||
    !appwriteServerConfig.projectId ||
    !appwriteServerConfig.apiKey ||
    !appwriteServerConfig.databaseId
  ) {
    return { predictionId: ID.unique(), demoFallback: true };
  }

  const databases = getServerDatabases();
  const documentId = ID.unique();
  await databases.createDocument(
    appwriteServerConfig.databaseId,
    collectionIds.riskPredictions,
    documentId,
    {
      pregnancyId: data.pregnancyId,
      input: data.payload,
      score: data.score,
      category: data.category,
      confidence: data.confidence,
      explanations: data.explanations,
      actionPlan: data.plan,
      modelVersion: "ensemble-v1",
      createdAt: new Date().toISOString(),
    },
  );

  return { predictionId: documentId, demoFallback: false };
};

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as PredictionRequest;

  let pregnancy: PregnancyPayload;
  try {
    if (payload.pregnancy) {
      pregnancy = pregnancySchema.parse(payload.pregnancy);
    } else if (payload.pregnancyId) {
      pregnancy = await fetchPregnancy(payload.pregnancyId);
    } else {
      pregnancy = DEMO_PREDICTION.pregnancy;
    }
  } catch (error) {
    console.error("Failed to fetch pregnancy for prediction", error);
    return NextResponse.json(
      { error: "Unable to load pregnancy data." },
      { status: 400 },
    );
  }

  try {
    const result = evaluateRisk(pregnancy);
    const actionPlan = buildActionPlan(result, pregnancy);
    const stored = await storePrediction({
      pregnancyId: payload.pregnancyId ?? null,
      payload: pregnancy,
      score: result.ensembleScore,
      category: result.category,
      confidence: result.confidence,
      explanations: result.contributions,
      plan: actionPlan,
    });

    return NextResponse.json({
      predictionId: stored.predictionId,
      risk: {
        score: result.ensembleScore,
        riskCategory: result.category,
        confidence: result.confidence,
        logistic: result.logistic,
        randomForest: result.randomForest,
        contributions: result.contributions,
      },
      actionPlan,
      demoFallback: stored.demoFallback,
      aiService: aiConfig.endpoint ? "external" : "local-ensemble",
    });
  } catch (error) {
    console.error("Prediction failed", error);
    return NextResponse.json(
      { error: "Prediction failed." },
      { status: 500 },
    );
  }
}



