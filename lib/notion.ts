import { Client } from "@notionhq/client";
import {
  WizardAnswers,
  DeterministicPricingResult,
  PricingBreakdownItem,
} from "./types";

export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface CreateLeadInput {
  contact: ContactInfo;
  answers: WizardAnswers;
  estimate: {
    min: number;
    max: number;
  };
  breakdown: PricingBreakdownItem[];
}

export interface NotionLeadResult {
  pageId: string;
  url: string;
}

// Mapping des types de prestation
const PRESTATION_MAP: Record<string, string> = {
  "site-vitrine": "Site vitrine",
  ecommerce: "E-commerce",
  "application-web": "Application Web",
  "app-mobile": "Application mobile",
  refonte: "Refonte",
};

// Mapping des budgets déclarés
const BUDGET_MAP: Record<string, string> = {
  "moins-5000": "< 5 000€",
  "5000-10000": "5 000€ – 10 000€",
  "10000-25000": "10 000€ – 25 000€",
  "25000+": "25 000€+",
  "je-ne-sais-pas": "Je ne sais pas",
};

// Mapping de l'urgence
const URGENCE_MAP: Record<string, string> = {
  urgent: "Urgent (< 1 mois)",
  normal: "1–3 mois",
  flexible: "Flexible",
};

/**
 * Construit les propriétés Notion à partir des données du lead
 * Fonction pure testable
 */
export function buildNotionProperties(
  input: CreateLeadInput
): Record<string, any> {
  const { contact, answers, estimate, breakdown } = input;

  // Déterminer le type de prestation
  const projectType = answers["type-projet"] || "unknown";
  const prestationLabel = PRESTATION_MAP[projectType] || "Autre";

  // Construire le nom : "Company — Prestation" ou "Name — Prestation"
  const name = contact.company
    ? `${contact.company} — ${prestationLabel}`
    : `${contact.name} — ${prestationLabel}`;

  // Budget déclaré
  const budgetAnswer = answers.budget || "unknown";
  const budgetLabel = BUDGET_MAP[budgetAnswer] || "Je ne sais pas";

  // Urgence
  const delaiAnswer = answers.delai || "normal";
  const urgenceLabel = URGENCE_MAP[delaiAnswer] || "1–3 mois";

  // Réponses JSON (tronquer si > 1900 chars)
  const answersJson = JSON.stringify(answers, null, 2);
  const answersText =
    answersJson.length > 1900
      ? answersJson.substring(0, 1900) + "…(truncated)"
      : answersJson;

  return {
    Name: {
      title: [
        {
          text: {
            content: name,
          },
        },
      ],
    },
    Email: {
      email: contact.email,
    },
    Téléphone: {
      phone_number: contact.phone || null,
    },
    Entreprise: {
      rich_text: contact.company
        ? [
            {
              text: {
                content: contact.company,
              },
            },
          ]
        : [],
    },
    Prestation: {
      select: {
        name: prestationLabel,
      },
    },
    "Budget déclaré": {
      select: {
        name: budgetLabel,
      },
    },
    "Estimation min": {
      number: estimate.min,
    },
    "Estimation max": {
      number: estimate.max,
    },
    Urgence: {
      select: {
        name: urgenceLabel,
      },
    },
    "Réponses (JSON)": {
      rich_text: [
        {
          text: {
            content: answersText,
          },
        },
      ],
    },
    Statut: {
      select: {
        name: "New",
      },
    },
    Source: {
      select: {
        name: "Website Simulator",
      },
    },
  };
}

/**
 * Crée un lead dans Notion
 */
export async function createLeadInNotion(
  input: CreateLeadInput
): Promise<NotionLeadResult> {
  const notionToken = process.env.NOTION_TOKEN;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken) {
    throw new Error(
      "NOTION_TOKEN environment variable is required but not set"
    );
  }

  if (!notionDatabaseId) {
    throw new Error(
      "NOTION_DATABASE_ID environment variable is required but not set"
    );
  }

  const notion = new Client({
    auth: notionToken,
  });

  const properties = buildNotionProperties(input);

  try {
    const response = await notion.pages.create({
      parent: {
        database_id: notionDatabaseId,
      },
      properties,
    });

    // Construire l'URL de la page Notion
    // L'ID Notion est au format UUID, on le convertit pour l'URL
    const pageId = response.id.replace(/-/g, "");
    const url = `https://www.notion.so/${pageId}`;

    return {
      pageId: response.id,
      url,
    };
  } catch (error: any) {
    // Ne pas logger les données sensibles
    console.error("Notion API error:", {
      code: error.code,
      message: error.message,
      status: error.status,
    });
    throw new Error(`Failed to create lead in Notion: ${error.message}`);
  }
}
