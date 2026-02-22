export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface Question {
  id: string;
  type: "radio" | "select" | "text" | "number";
  label: string;
  required: boolean;
  options?: QuestionOption[];
}

export interface QuestionsData {
  questions: Question[];
}

export interface PricingRule {
  id: string;
  multipliers: Record<string, number>;
}

export interface PricingRulesData {
  basePrice: number;
  rules: PricingRule[];
  budgetRanges: Record<string, { min: number; max: number }>;
}

export interface WizardAnswers {
  [questionId: string]: string;
}

export interface PricingResult {
  estimatedPrice: number;
  basePrice: number;
  breakdown: {
    questionId: string;
    answer: string;
    multiplier: number;
  }[];
  budgetRange?: {
    min: number;
    max: number;
  };
}

export interface PricingBreakdownItem {
  label: string;
  amount: number;
}

export interface DeterministicPricingResult {
  min: number;
  max: number;
  breakdown: PricingBreakdownItem[];
}

export interface PricingConfig {
  basePrices: Record<string, number>;
  addOns: {
    design?: Record<string, { min: number; max: number }>;
    pages?: Record<string, { min: number; max: number }>;
    ecom?: Record<string, { min: number; max: number }>;
    integrations?: Record<string, { min: number; max: number }>;
    seo?: Record<string, { min: number; max: number }>;
    tracking?: Record<string, { min: number; max: number }>;
    delai?: Record<string, { min: number; max: number }>;
  };
  uncertaintyCoefficients: {
    min: number;
    max: number;
  };
}
