import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PricingEngine } from "@/lib/pricing-engine";
import { createLeadInNotion } from "@/lib/notion";
import { WizardAnswers } from "@/lib/types";

// CORS headers helper
function corsHeaders(origin?: string | null) {
  const allowedOrigins = process.env.WEBFLOW_DOMAIN
    ? [process.env.WEBFLOW_DOMAIN]
    : ["*"];

  const isAllowed = !process.env.WEBFLOW_DOMAIN || 
    !origin || 
    allowedOrigins.includes(origin) ||
    origin.includes(".webflow.io");

  return {
    "Access-Control-Allow-Origin": isAllowed ? (origin || "*") : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return NextResponse.json({}, { headers: corsHeaders(origin) });
}

// Schéma de validation Zod
const contactSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  company: z.string().optional(),
});

const leadRequestSchema = z.object({
  contact: contactSchema,
  answers: z.record(z.string(), z.string()),
});

type LeadRequest = z.infer<typeof leadRequestSchema>;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  
  try {
    // Parse et validation du body
    const body = await request.json();
    const validationResult = leadRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "VALIDATION_ERROR",
          details: validationResult.error.errors,
        },
        { 
          status: 400,
          headers: corsHeaders(origin),
        }
      );
    }

    const { contact, answers } = validationResult.data;

    // Calcul de l'estimation
    const engine = new PricingEngine();
    const estimate = engine.calculateDeterministicPrice(answers);

    // Création du lead dans Notion
    let notionResult;
    try {
      notionResult = await createLeadInNotion({
        contact,
        answers,
        estimate: {
          min: estimate.min,
          max: estimate.max,
        },
        breakdown: estimate.breakdown,
      });
    } catch (notionError: any) {
      // Ne pas logger les données sensibles
      const hasToken = !!process.env.NOTION_TOKEN;
      const hasDatabaseId = !!process.env.NOTION_DATABASE_ID;
      
      console.error("Notion error:", {
        error: notionError.message,
        hasToken,
        hasDatabaseId,
      });

      // Message d'erreur plus explicite
      let errorMessage = notionError.message;
      if (!hasToken || !hasDatabaseId) {
        errorMessage = "Configuration Notion manquante. Vérifiez les variables d'environnement NOTION_TOKEN et NOTION_DATABASE_ID.";
      }

      return NextResponse.json(
        {
          ok: false,
          error: "NOTION_ERROR",
          message: errorMessage,
        },
        { 
          status: 500,
          headers: corsHeaders(origin),
        }
      );
    }

    // Retourner le succès
    return NextResponse.json(
      {
        ok: true,
        estimate: {
          min: estimate.min,
          max: estimate.max,
        },
        breakdown: estimate.breakdown,
        notionUrl: notionResult.url,
      },
      {
        headers: corsHeaders(origin),
      }
    );
  } catch (error: any) {
    // Erreur générale (parsing JSON, etc.)
    console.error("API error:", {
      error: error.message,
      type: error.constructor.name,
    });

    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: "Une erreur interne est survenue",
      },
      { 
        status: 500,
        headers: corsHeaders(origin),
      }
    );
  }
}
