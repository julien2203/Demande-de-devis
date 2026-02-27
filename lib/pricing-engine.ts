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
    const missingFields: string[] = [];

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
    if (!designAnswer) {
      missingFields.push("design");
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
    if (!pagesAnswer) {
      missingFields.push("nombre-pages");
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
    if (!integrationsAnswer) {
      missingFields.push("fonctionnalites");
    }

    // Niveau de contenu (général)
    const contentLevelAnswer = answers["content-level"];
    if (
      contentLevelAnswer &&
      this.config.addOns.contentLevel?.[contentLevelAnswer]
    ) {
      const addOn = this.config.addOns.contentLevel[contentLevelAnswer];
      addOnsMin += addOn.min;
      addOnsMax += addOn.max;
      if (addOn.min !== 0 || addOn.max !== 0) {
        breakdown.push({
          label: "Accompagnement sur le contenu",
          amount: (addOn.min + addOn.max) / 2,
        });
      }
    }
    if (!contentLevelAnswer) {
      missingFields.push("content-level");
    }

    // Multi-langues
    const multiLangAnswer = answers["multi-lang"];
    if (multiLangAnswer && this.config.addOns.multiLang?.[multiLangAnswer]) {
      const addOn = this.config.addOns.multiLang[multiLangAnswer];
      addOnsMin += addOn.min;
      addOnsMax += addOn.max;
      if (addOn.min !== 0 || addOn.max !== 0) {
        breakdown.push({
          label: "Multi-langues",
          amount: (addOn.min + addOn.max) / 2,
        });
      }
    }
    if (!multiLangAnswer) {
      missingFields.push("multi-lang");
    }

    // Connexions outils (multi-select)
    const toolConnectionsAnswer = answers["tool-connections"];
    if (toolConnectionsAnswer && this.config.addOns.toolConnections) {
      const tools = toolConnectionsAnswer.split(",").filter(Boolean);
      for (const tool of tools) {
        const addOn = this.config.addOns.toolConnections[tool];
        if (addOn) {
          addOnsMin += addOn.min;
          addOnsMax += addOn.max;
          breakdown.push({
            label: `Connexion ${this.getToolConnectionLabel(tool)}`,
            amount: (addOn.min + addOn.max) / 2,
          });
        }
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
    if (!seoAnswer) {
      missingFields.push("referencement");
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
    if (!delaiAnswer) {
      missingFields.push("delai");
    }

    // Spécifique application mobile
    if (projectType === "app-mobile") {
      const mobileScreens = answers["mobile-screens"];
      if (
        mobileScreens &&
        this.config.addOns.mobileScreens?.[mobileScreens]
      ) {
        const addOn = this.config.addOns.mobileScreens[mobileScreens];
        addOnsMin += addOn.min;
        addOnsMax += addOn.max;
        breakdown.push({
          label: "Nombre d'écrans",
          amount: (addOn.min + addOn.max) / 2,
        });
      } else {
        missingFields.push("mobile-screens");
      }

      const mobilePlatforms = answers["mobile-platforms"];
      if (
        mobilePlatforms &&
        this.config.addOns.mobilePlatforms?.[mobilePlatforms]
      ) {
        const addOn = this.config.addOns.mobilePlatforms[mobilePlatforms];
        addOnsMin += addOn.min;
        addOnsMax += addOn.max;
        breakdown.push({
          label: "Plateformes",
          amount: (addOn.min + addOn.max) / 2,
        });
      } else {
        missingFields.push("mobile-platforms");
      }

      const mobileAuth = answers["mobile-auth"];
      if (mobileAuth && this.config.addOns.mobileAuth?.[mobileAuth]) {
        const addOn = this.config.addOns.mobileAuth[mobileAuth];
        addOnsMin += addOn.min;
        addOnsMax += addOn.max;
        breakdown.push({
          label: "Authentification / comptes",
          amount: (addOn.min + addOn.max) / 2,
        });
      } else {
        missingFields.push("mobile-auth");
      }

      const mobileFeatures = answers["mobile-features"];
      if (mobileFeatures && this.config.addOns.mobileFeatures) {
        const features = mobileFeatures.split(",").filter(Boolean);
        for (const feature of features) {
          const addOn = this.config.addOns.mobileFeatures[feature];
          if (addOn) {
            addOnsMin += addOn.min;
            addOnsMax += addOn.max;
            breakdown.push({
              label: this.getMobileFeatureLabel(feature),
              amount: (addOn.min + addOn.max) / 2,
            });
          }
        }
      }

      const mobileContent = answers["mobile-content"];
      if (
        mobileContent &&
        this.config.addOns.mobileContent?.[mobileContent]
      ) {
        const addOn = this.config.addOns.mobileContent[mobileContent];
        addOnsMin += addOn.min;
        addOnsMax += addOn.max;
        breakdown.push({
          label: "Contenu / données",
          amount: (addOn.min + addOn.max) / 2,
        });
      } else {
        missingFields.push("mobile-content");
      }

      const mobileBackoffice = answers["mobile-backoffice"];
      if (
        mobileBackoffice &&
        this.config.addOns.mobileBackoffice?.[mobileBackoffice]
      ) {
        const addOn = this.config.addOns.mobileBackoffice[mobileBackoffice];
        addOnsMin += addOn.min;
        addOnsMax += addOn.max;
        breakdown.push({
          label: "Back-office admin",
          amount: (addOn.min + addOn.max) / 2,
        });
      } else {
        missingFields.push("mobile-backoffice");
      }

      const mobileOffline = answers["mobile-offline"];
      if (
        mobileOffline &&
        this.config.addOns.mobileOffline?.[mobileOffline]
      ) {
        const addOn = this.config.addOns.mobileOffline[mobileOffline];
        addOnsMin += addOn.min;
        addOnsMax += addOn.max;
        breakdown.push({
          label: "Offline / performance",
          amount: (addOn.min + addOn.max) / 2,
        });
      } else {
        missingFields.push("mobile-offline");
      }

      const mobileDesign = answers["mobile-design"];
      if (mobileDesign && this.config.addOns.mobileDesign?.[mobileDesign]) {
        const addOn = this.config.addOns.mobileDesign[mobileDesign];
        addOnsMin += addOn.min;
        addOnsMax += addOn.max;
        breakdown.push({
          label: "Design UI mobile",
          amount: (addOn.min + addOn.max) / 2,
        });
      } else {
        missingFields.push("mobile-design");
      }

      const mobileAnalytics = answers["mobile-analytics"];
      if (
        mobileAnalytics &&
        this.config.addOns.mobileAnalytics?.[mobileAnalytics]
      ) {
        const addOn = this.config.addOns.mobileAnalytics[mobileAnalytics];
        addOnsMin += addOn.min;
        addOnsMax += addOn.max;
        breakdown.push({
          label: "Analytics / tracking",
          amount: (addOn.min + addOn.max) / 2,
        });
      } else {
        missingFields.push("mobile-analytics");
      }

      const mobilePostLaunch = answers["mobile-post-launch"];
      if (mobilePostLaunch && this.config.addOns.mobilePostLaunch) {
        const services = mobilePostLaunch.split(",").filter(Boolean);
        for (const service of services) {
          const addOn = this.config.addOns.mobilePostLaunch[service];
          if (addOn) {
            addOnsMin += addOn.min;
            addOnsMax += addOn.max;
            breakdown.push({
              label: this.getMobilePostLaunchLabel(service),
              amount: (addOn.min + addOn.max) / 2,
            });
          }
        }
      }
    }

    // 3. Calculer le total avant coefficients d'incertitude
    const totalMin = baseMin + addOnsMin;
    const totalMax = baseMax + addOnsMax;

    // 4. Appliquer les coefficients d'incertitude
    let minCoeff = this.config.uncertaintyCoefficients.min;
    let maxCoeff = this.config.uncertaintyCoefficients.max;

    const budgetAnswer = answers["budget"];
    const budgetUnknown =
      !budgetAnswer || budgetAnswer === "je-ne-sais-pas" || budgetAnswer === "unknown";

    const hasMissingImportantAnswers = missingFields.length > 0;

    if (budgetUnknown || hasMissingImportantAnswers) {
      maxCoeff = Math.max(maxCoeff, 1.18);
    }

    const finalMin = Math.round(totalMin * minCoeff);
    const finalMax = Math.round(totalMax * maxCoeff);

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

  private getToolConnectionLabel(answer: string): string {
    const labels: Record<string, string> = {
      crm: "CRM",
      emailing: "outil emailing",
      paiement: "solution de paiement",
      logistique: "outil logistique",
      agenda: "agenda",
      "notion-erp": "Notion / ERP",
    };
    return labels[answer] || answer;
  }

  private getMobileFeatureLabel(answer: string): string {
    const labels: Record<string, string> = {
      paiement: "Paiement in-app",
      "notifications-push": "Notifications push",
      geolocalisation: "Géolocalisation / carte",
      chat: "Chat / messagerie",
      "upload-media": "Upload de médias",
      reservation: "Réservation / planning",
    };
    return labels[answer] || answer;
  }

  private getMobilePostLaunchLabel(answer: string): string {
    const labels: Record<string, string> = {
      "maintenance-corrective": "Maintenance corrective",
      "maintenance-evolutive": "Maintenance évolutive",
      "rapports-statistiques": "Rapports statistiques",
      "ab-testing": "A/B testing / heatmap",
      "campagnes-publicitaires": "Campagnes publicitaires",
    };
    return labels[answer] || answer;
  }

  getBasePrice(): number {
    return this.rules.basePrice;
  }
}
