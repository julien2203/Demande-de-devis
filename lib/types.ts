export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface Question {
  id: string;
  type: "radio" | "select" | "text" | "number" | "multi-select";
  label: string;
  required: boolean;
  options?: QuestionOption[];
  visibleFor?: string[];
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

export type QuoteConfidenceLevel = "high" | "medium" | "low";

export interface QuoteV2LotItem {
  label: string;
  amount: number;
  qty?: number;
  unit?: string;
}

export interface QuoteV2Lot {
  lot: string;
  items: QuoteV2LotItem[];
  subtotal: number;
}

export interface QuoteV2 {
  min: number;
  max: number;
  confidence: QuoteConfidenceLevel;
  lots: QuoteV2Lot[];
  assumptions: string[];
  exclusions: string[];
  nextSteps: string[];
  uncertaintyScore: number;
}

export interface UncertaintyResult {
  minCoef: number;
  maxCoef: number;
  confidence: QuoteConfidenceLevel;
  score: number;
}

export interface PricingConfig {
  basePrices: Record<string, number>;
  addOns: {
    design?: Record<string, { min: number; max: number }>;
    pages?: Record<string, { min: number; max: number }>;
    ecom?: Record<string, { min: number; max: number }>;
    integrations?: Record<string, { min: number; max: number }>;
    contentLevel?: Record<string, { min: number; max: number }>;
    multiLang?: Record<string, { min: number; max: number }>;
    toolConnections?: Record<string, { min: number; max: number }>;
    seo?: Record<string, { min: number; max: number }>;
    tracking?: Record<string, { min: number; max: number }>;
    delai?: Record<string, { min: number; max: number }>;
    mobileScreens?: Record<string, { min: number; max: number }>;
    mobilePlatforms?: Record<string, { min: number; max: number }>;
    mobileAuth?: Record<string, { min: number; max: number }>;
    mobileFeatures?: Record<string, { min: number; max: number }>;
    mobileContent?: Record<string, { min: number; max: number }>;
    mobileBackoffice?: Record<string, { min: number; max: number }>;
    mobileOffline?: Record<string, { min: number; max: number }>;
    mobileDesign?: Record<string, { min: number; max: number }>;
    mobileAnalytics?: Record<string, { min: number; max: number }>;
    mobilePostLaunch?: Record<string, { min: number; max: number }>;
  };
  uncertaintyCoefficients: {
    min: number;
    max: number;
  };
}
