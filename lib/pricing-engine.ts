import { PricingRulesData, PricingResult, WizardAnswers } from "./types";
import pricingRulesData from "@/data/pricing-rules.json";
import {
  DeterministicPricingResult,
  PricingConfig,
  PricingBreakdownItem,
} from "./types";
import pricingConfigData from "@/data/pricing-config.json";

const pricingRules = pricingRulesData as unknown as PricingRulesData;
const pricingConfig = pricingConfigData as unknown as PricingConfig;

export class PricingEngine {
  private rules: PricingRulesData;
  private config: PricingConfig;

  constructor() {
    this.rules = pricingRules;
    this.config = pricingConfig;
  }

  /**
   * Ancienne méthode de calcul (conservée pour compatibilité)
   */
  calculatePrice(answers: WizardAnswers): PricingResult {
    let price = this.rules.basePrice;
    const breakdown: PricingResult["breakdown"] = [];

    // Appliquer chaque règle de pricing
    for (const rule of this.rules.rules) {
      const answer = answers[rule.id];
      if (answer && rule.multipliers[answer]) {
        const multiplier = rule.multipliers[answer];
        price *= multiplier;
        breakdown.push({
          questionId: rule.id,
          answer,
          multiplier,
        });
      }
    }

    // Arrondir à la centaine supérieure
    const estimatedPrice = Math.ceil(price / 100) * 100;

    // Déterminer la fourchette budgétaire
    const budgetAnswer = answers["budget"];
    const budgetRange = budgetAnswer
      ? this.rules.budgetRanges[budgetAnswer]
      : undefined;

    return {
      estimatedPrice,
      basePrice: this.rules.basePrice,
      breakdown,
      budgetRange,
    };
  }

  /**
   * Nouvelle méthode de calcul déterministe avec min/max
   */
  calculateDeterministicPrice(
    answers: WizardAnswers
  ): DeterministicPricingResult {
    const breakdown: PricingBreakdownItem[] = [];
    let baseMin = 0;
    let baseMax = 0;

    // 1. Calculer le prix de base selon le type de projet
    const projectType = answers["type-projet"];
    if (projectType && this.config.basePrices[projectType]) {
      const basePrice = this.config.basePrices[projectType];
      baseMin = basePrice;
      baseMax = basePrice;
      breakdown.push({
        label: this.getProjectTypeLabel(projectType),
        amount: basePrice,
      });
    }

    // 2. Calculer les addOns
    let addOnsMin = 0;
    let addOnsMax = 0;

    // Design
    const designAnswer = answers["design"];
    if (designAnswer && this.config.addOns.design?.[designAnswer]) {
      const addOn = this.config.addOns.design[designAnswer];
      addOnsMin += addOn.min;
      addOnsMax += addOn.max;
      if (addOn.min !== 0 || addOn.max !== 0) {
        breakdown.push({
          label: this.getDesignLabel(designAnswer),
          amount: (addOn.min + addOn.max) / 2,
        });
      }
    }

    // Pages
    const pagesAnswer = answers["nombre-pages"];
    if (pagesAnswer && this.config.addOns.pages?.[pagesAnswer]) {
      const addOn = this.config.addOns.pages[pagesAnswer];
      addOnsMin += addOn.min;
      addOnsMax += addOn.max;
      if (addOn.min !== 0 || addOn.max !== 0) {
        breakdown.push({
          label: `Pages supplémentaires (${pagesAnswer})`,
          amount: (addOn.min + addOn.max) / 2,
        });
      }
    }

    // E-commerce est déjà inclus dans le basePrice si type-projet = ecommerce
    // Pas besoin d'addOn supplémentaire

    // Intégrations (fonctionnalités)
    const integrationsAnswer = answers["fonctionnalites"];
    if (
      integrationsAnswer &&
      this.config.addOns.integrations?.[integrationsAnswer]
    ) {
      const addOn = this.config.addOns.integrations[integrationsAnswer];
      addOnsMin += addOn.min;
      addOnsMax += addOn.max;
      if (addOn.min !== 0 || addOn.max !== 0) {
        breakdown.push({
          label: this.getIntegrationsLabel(integrationsAnswer),
          amount: (addOn.min + addOn.max) / 2,
        });
      }
    }

    // SEO
    const seoAnswer = answers["referencement"];
    if (seoAnswer && this.config.addOns.seo?.[seoAnswer]) {
      const addOn = this.config.addOns.seo[seoAnswer];
      addOnsMin += addOn.min;
      addOnsMax += addOn.max;
      if (addOn.min !== 0 || addOn.max !== 0) {
        breakdown.push({
          label: this.getSeoLabel(seoAnswer),
          amount: (addOn.min + addOn.max) / 2,
        });
      }
    }

    // Tracking (inclus si fonctionnalités avancées ou e-commerce)
    const trackingAnswer =
      integrationsAnswer === "avance" || projectType === "ecommerce"
        ? "oui"
        : "non";
    if (this.config.addOns.tracking?.[trackingAnswer]) {
      const addOn = this.config.addOns.tracking[trackingAnswer];
      addOnsMin += addOn.min;
      addOnsMax += addOn.max;
      if (addOn.min !== 0 || addOn.max !== 0) {
        breakdown.push({
          label: "Analytics et tracking",
          amount: (addOn.min + addOn.max) / 2,
        });
      }
    }

    // Délai
    const delaiAnswer = answers["delai"];
    if (delaiAnswer && this.config.addOns.delai?.[delaiAnswer]) {
      const addOn = this.config.addOns.delai[delaiAnswer];
      addOnsMin += addOn.min;
      addOnsMax += addOn.max;
      if (addOn.min !== 0 || addOn.max !== 0) {
        breakdown.push({
          label: this.getDelaiLabel(delaiAnswer),
          amount: (addOn.min + addOn.max) / 2,
        });
      }
    }

    // 3. Calculer le total avant coefficients d'incertitude
    const totalMin = baseMin + addOnsMin;
    const totalMax = baseMax + addOnsMax;

    // 4. Appliquer les coefficients d'incertitude
    const finalMin = Math.round(
      totalMin * this.config.uncertaintyCoefficients.min
    );
    const finalMax = Math.round(
      totalMax * this.config.uncertaintyCoefficients.max
    );

    // Arrondir à la centaine
    return {
      min: Math.ceil(finalMin / 100) * 100,
      max: Math.ceil(finalMax / 100) * 100,
      breakdown,
    };
  }

  private getProjectTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      "site-vitrine": "Site vitrine",
      ecommerce: "E-commerce",
      "application-web": "Application web",
      refonte: "Refonte de site",
    };
    return labels[type] || type;
  }

  private getDesignLabel(answer: string): string {
    const labels: Record<string, string> = {
      "oui-complet": "Design fourni (complet)",
      "oui-partiel": "Design partiel",
      non: "Création design complète",
    };
    return labels[answer] || answer;
  }

  private getIntegrationsLabel(answer: string): string {
    const labels: Record<string, string> = {
      basique: "Fonctionnalités de base",
      intermediaire: "Fonctionnalités intermédiaires",
      avance: "Fonctionnalités avancées",
    };
    return labels[answer] || answer;
  }

  private getSeoLabel(answer: string): string {
    const labels: Record<string, string> = {
      "oui-complet": "Référencement SEO complet",
      "oui-basique": "Référencement SEO basique",
      non: "Pas de référencement",
    };
    return labels[answer] || answer;
  }

  private getDelaiLabel(answer: string): string {
    const labels: Record<string, string> = {
      urgent: "Délai urgent (majoration)",
      normal: "Délai normal",
      flexible: "Délai flexible (réduction)",
    };
    return labels[answer] || answer;
  }

  getBasePrice(): number {
    return this.rules.basePrice;
  }
}
