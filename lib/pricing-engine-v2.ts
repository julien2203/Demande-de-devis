import {
  QuoteV2,
  QuoteV2Lot,
  QuoteV2LotItem,
  UncertaintyResult,
  WizardAnswers,
} from "./types";
import pricingConfigData from "@/data/pricing-config.json";
import { PricingConfig } from "./types";

const pricingConfig = pricingConfigData as unknown as PricingConfig;

function roundToHundreds(value: number): number {
  return Math.ceil(value / 100) * 100;
}

function addItem(
  lots: Record<string, QuoteV2Lot>,
  lotName: string,
  item: QuoteV2LotItem
) {
  if (!lots[lotName]) {
    lots[lotName] = {
      lot: lotName,
      items: [],
      subtotal: 0,
    };
  }
  lots[lotName].items.push(item);
  lots[lotName].subtotal += item.amount;
}

export function computeUncertainty(answers: WizardAnswers): UncertaintyResult {
  let score = 0;

  const budget = answers["budget"];
  if (!budget || budget === "je-ne-sais-pas" || budget === "unknown") {
    score += 2;
  }

  // Questions clés manquantes (2 points chacune)
  const keyFields = [
    "type-projet",
    "content-level",
    "content-complexity",
    "design",
    "multi-lang",
    "delai",
    "maintenance",
  ];
  for (const field of keyFields) {
    if (!answers[field]) {
      score += 2;
    }
  }

  // Choix "autre"
  Object.values(answers).forEach((value) => {
    if (typeof value === "string" && value.includes("autre")) {
      score += 2;
    }
  });

  const projectType = answers["type-projet"];

  // Refonte avec contraintes techniques
  if (projectType === "refonte") {
    const constraints = answers["refonte-constraints"];
    if (!constraints || constraints !== "non") {
      score += 1;
    }
  }

  // SI / ERP
  const toolConnections = answers["tool-connections"] || "";
  const mobileContent = answers["mobile-content"];
  if (
    toolConnections.includes("notion-erp") ||
    mobileContent === "si-erp"
  ) {
    score += 1;
  }

  let minCoef: number;
  let maxCoef: number;
  let confidence: UncertaintyResult["confidence"];

  if (score <= 1) {
    minCoef = 0.97;
    maxCoef = 1.05;
    confidence = "high";
  } else if (score <= 3) {
    minCoef = 0.94;
    maxCoef = 1.1;
    confidence = "medium";
  } else {
    minCoef = 0.9;
    maxCoef = 1.18;
    confidence = "low";
  }

  return { minCoef, maxCoef, confidence, score };
}

export function calculateQuoteV2(answers: WizardAnswers): QuoteV2 {
  const lotsMap: Record<string, QuoteV2Lot> = {};
  let baseTotal = 0;
  const assumptions: string[] = [];
  const exclusions: string[] = [];
  const nextSteps: string[] = [];

  const projectType = answers["type-projet"];

  // 1. Base projet par type
  if (projectType && pricingConfig.basePrices[projectType]) {
    const basePrice = pricingConfig.basePrices[projectType];
    const labelMap: Record<string, string> = {
      "site-vitrine": "Site vitrine",
      ecommerce: "Site e-commerce",
      "application-web": "Application web",
      "app-mobile": "Application mobile",
      refonte: "Refonte de site",
    };
    addItem(lotsMap, "Développement", {
      label: labelMap[projectType] || "Projet digital",
      amount: basePrice,
    });
    baseTotal += basePrice;
  } else {
    assumptions.push(
      "Type de projet non renseigné : estimation basée sur un projet web standard."
    );
  }

  // 2. Contenu & cadrage
  const contentLevel = answers["content-level"];
  if (contentLevel && pricingConfig.addOns.contentLevel?.[contentLevel]) {
    const cfg = pricingConfig.addOns.contentLevel[contentLevel];
    const amount = (cfg.min + cfg.max) / 2;
    addItem(lotsMap, "Cadrage", {
      label: "Accompagnement contenu",
      amount,
    });
    baseTotal += amount;
  }

  const contentComplexity = answers["content-complexity"];
  if (contentComplexity) {
    const map: Record<string, number> = {
      simple: 0,
      standard: 800,
      complexe: 2000,
    };
    const amount = map[contentComplexity] ?? 0;
    if (amount > 0) {
      addItem(lotsMap, "Cadrage", {
        label: "Complexité des contenus",
        amount,
      });
      baseTotal += amount;
    }
  } else {
    assumptions.push(
      "Complexité des contenus estimée standard (pas de rédaction technique lourde)."
    );
  }

  const workshops = answers["workshops"];
  if (workshops) {
    const map: Record<string, { qty: number; amount: number }> = {
      aucun: { qty: 0, amount: 0 },
      "1-atelier": { qty: 1, amount: 800 },
      "2-3-ateliers": { qty: 3, amount: 2100 },
    };
    const conf = map[workshops];
    if (conf && conf.amount > 0) {
      addItem(lotsMap, "Cadrage", {
        label: "Ateliers de cadrage",
        qty: conf.qty,
        unit: "atelier",
        amount: conf.amount,
      });
      baseTotal += conf.amount;
    }
  }

  // 3. UX / UI & gabarits (web)
  const webTemplates = answers["web-templates"];
  if (webTemplates) {
    const map: Record<string, number> = {
      "1-2": 800,
      "3-5": 2000,
      "6+": 4000,
    };
    const amount = map[webTemplates] ?? 0;
    if (amount > 0) {
      addItem(lotsMap, "UX/UI", {
        label: "Conception de gabarits",
        amount,
      });
      baseTotal += amount;
    }
  }

  const designAnswer = answers["design"];
  if (designAnswer && pricingConfig.addOns.design?.[designAnswer]) {
    const addOn = pricingConfig.addOns.design[designAnswer];
    const amount = (addOn.min + addOn.max) / 2;
    if (amount > 0) {
      addItem(lotsMap, "UX/UI", {
        label: "Design UI & maquettes",
        amount,
      });
      baseTotal += amount;
    }
  }

  // 4. Développement web / mobile
  const pages = answers["nombre-pages"];
  if (
    pages &&
    pricingConfig.addOns.pages?.[pages] &&
    projectType !== "app-mobile"
  ) {
    const addOn = pricingConfig.addOns.pages[pages];
    const amount = (addOn.min + addOn.max) / 2;
    if (amount > 0) {
      addItem(lotsMap, "Développement", {
        label: `Pages supplémentaires (${pages})`,
        amount,
      });
      baseTotal += amount;
    }
  }

  const fonctionnelles = answers["fonctionnalites"];
  if (
    fonctionnelles &&
    pricingConfig.addOns.integrations?.[fonctionnelles]
  ) {
    const addOn = pricingConfig.addOns.integrations[fonctionnelles];
    const amount = (addOn.min + addOn.max) / 2;
    if (amount > 0) {
      addItem(lotsMap, "Développement", {
        label: "Fonctionnalités métier",
        amount,
      });
      baseTotal += amount;
    }
  }

  // Mobile-specific
  if (projectType === "app-mobile") {
    const mobileScreens = answers["mobile-screens"];
    if (mobileScreens && pricingConfig.addOns.mobileScreens?.[mobileScreens]) {
      const addOn = pricingConfig.addOns.mobileScreens[mobileScreens];
      const amount = (addOn.min + addOn.max) / 2;
      addItem(lotsMap, "Développement", {
        label: "Écrans de l'application",
        amount,
      });
      baseTotal += amount;
    }

    const mobilePlatforms = answers["mobile-platforms"];
    if (
      mobilePlatforms &&
      pricingConfig.addOns.mobilePlatforms?.[mobilePlatforms]
    ) {
      const addOn = pricingConfig.addOns.mobilePlatforms[mobilePlatforms];
      const amount = (addOn.min + addOn.max) / 2;
      addItem(lotsMap, "Développement", {
        label: "Plateformes (iOS / Android)",
        amount,
      });
      baseTotal += amount;
    }

    const mobileStack = answers["mobile-stack"];
    if (mobileStack) {
      const map: Record<string, number> = {
        "cross-platform": 0,
        natif: 8000,
      };
      const amount = map[mobileStack] ?? 0;
      if (amount > 0) {
        addItem(lotsMap, "Développement", {
          label: "Stack mobile (natif)",
          amount,
        });
        baseTotal += amount;
      }
    }

    const mobileAuth = answers["mobile-auth"];
    if (mobileAuth && pricingConfig.addOns.mobileAuth?.[mobileAuth]) {
      const addOn = pricingConfig.addOns.mobileAuth[mobileAuth];
      const amount = (addOn.min + addOn.max) / 2;
      addItem(lotsMap, "Développement", {
        label: "Comptes & authentification",
        amount,
      });
      baseTotal += amount;
    }

    const mobileRoles = answers["mobile-roles"];
    if (mobileRoles) {
      const map: Record<string, number> = {
        aucun: 0,
        utilisateurs: 1500,
        "admin-roles": 4000,
      };
      const amount = map[mobileRoles] ?? 0;
      if (amount > 0) {
        addItem(lotsMap, "Développement", {
          label: "Rôles & permissions",
          amount,
        });
        baseTotal += amount;
      }
    }

    const mobileFeatures = answers["mobile-features"];
    if (mobileFeatures && pricingConfig.addOns.mobileFeatures) {
      const features = mobileFeatures.split(",").filter(Boolean);
      for (const feature of features) {
        const addOn = pricingConfig.addOns.mobileFeatures[feature];
        if (addOn) {
          const amount = (addOn.min + addOn.max) / 2;
          addItem(lotsMap, "Intégrations", {
            label: `Feature mobile : ${feature}`,
            amount,
          });
          baseTotal += amount;
        }
      }
    }

    const notificationsLevel = answers["mobile-notifications"];
    if (notificationsLevel) {
      const map: Record<string, number> = {
        basique: 800,
        segmentees: 2000,
        automatisees: 3500,
      };
      const amount = map[notificationsLevel] ?? 0;
      if (amount > 0) {
        addItem(lotsMap, "Intégrations", {
          label: "Notifications push",
          amount,
        });
        baseTotal += amount;
      }
    }

    const backendScope = answers["backend-scope"];
    if (backendScope) {
      const map: Record<string, number> = {
        aucun: 0,
        simple: 4000,
        avance: 9000,
      };
      const amount = map[backendScope] ?? 0;
      if (amount > 0) {
        addItem(lotsMap, "Développement", {
          label: "Backend & API",
          amount,
        });
        baseTotal += amount;
      }
    }

    const storePublishing = answers["store-publishing"];
    if (storePublishing === "oui") {
      const amount = 2500;
      addItem(lotsMap, "QA & Livraison", {
        label: "Publication App Store / Play Store",
        amount,
      });
      baseTotal += amount;
    }
  }

  // 5. CMS & e-commerce (web)
  const cmsNeeded = answers["cms-needed"];
  if (cmsNeeded) {
    const map: Record<string, number> = {
      non: 0,
      "oui-simple": 1500,
      "oui-avance": 3500,
    };
    const amount = map[cmsNeeded] ?? 0;
    if (amount > 0) {
      addItem(lotsMap, "Intégrations", {
        label: "CMS / gestion de contenu",
        amount,
      });
      baseTotal += amount;
    }
  }

  if (projectType === "ecommerce") {
    const ecomProducts = answers["ecom-products"];
    if (ecomProducts) {
      const map: Record<string, number> = {
        "0-20": 1500,
        "20-100": 3000,
        "100-500": 5000,
        "500+": 8000,
      };
      const amount = map[ecomProducts] ?? 0;
      if (amount > 0) {
        addItem(lotsMap, "Développement", {
          label: "Catalogue produits",
          amount,
        });
        baseTotal += amount;
      }
    }

    const ecomPayment = answers["ecom-payment"];
    if (ecomPayment) {
      const map: Record<string, number> = {
        stripe: 2000,
        multi: 4000,
      };
      const amount = map[ecomPayment] ?? 0;
      if (amount > 0) {
        addItem(lotsMap, "Intégrations", {
          label: "Paiement en ligne",
          amount,
        });
        baseTotal += amount;
      }
    }

    const ecomShipping = answers["ecom-shipping"];
    if (ecomShipping) {
      const map: Record<string, number> = {
        simple: 1500,
        complexe: 3500,
      };
      const amount = map[ecomShipping] ?? 0;
      if (amount > 0) {
        addItem(lotsMap, "Intégrations", {
          label: "Livraison & logistique",
          amount,
        });
        baseTotal += amount;
      }
    }

    const ecomInvoicing = answers["ecom-invoicing"];
    if (ecomInvoicing === "oui") {
      const amount = 2000;
      addItem(lotsMap, "Intégrations", {
        label: "Facturation & documents",
        amount,
      });
      baseTotal += amount;
    }
  }

  // 6. Refonte spécifique
  if (projectType === "refonte") {
    if (answers["refonte-seo"] === "oui") {
      const amount = 2500;
      addItem(lotsMap, "SEO/Tracking", {
        label: "Migration SEO",
        amount,
      });
      baseTotal += amount;
    }
    if (answers["refonte-content"] === "oui") {
      const amount = 2000;
      addItem(lotsMap, "Cadrage", {
        label: "Reprise et nettoyage de contenu",
        amount,
      });
      baseTotal += amount;
    }
    if (answers["refonte-redesign"] === "oui") {
      const amount = 3000;
      addItem(lotsMap, "UX/UI", {
        label: "Redesign complet",
        amount,
      });
      baseTotal += amount;
    }
  }

  // 7. SEO & tracking
  const seoAnswer = answers["referencement"];
  if (seoAnswer && pricingConfig.addOns.seo?.[seoAnswer]) {
    const addOn = pricingConfig.addOns.seo[seoAnswer];
    const amount = (addOn.min + addOn.max) / 2;
    if (amount > 0) {
      addItem(lotsMap, "SEO/Tracking", {
        label: "Référencement SEO",
        amount,
      });
      baseTotal += amount;
    }
  }

  const trackingNeeded =
    fonctionnelles === "avance" || projectType === "ecommerce"
      ? "oui"
      : "non";
  if (pricingConfig.addOns.tracking?.[trackingNeeded]) {
    const addOn = pricingConfig.addOns.tracking[trackingNeeded];
    const amount = (addOn.min + addOn.max) / 2;
    if (amount > 0) {
      addItem(lotsMap, "SEO/Tracking", {
        label: "Analytics & tracking",
        amount,
      });
      baseTotal += amount;
    }
  }

  const analyticsLevel = answers["mobile-analytics"];
  if (
    projectType === "app-mobile" &&
    analyticsLevel &&
    pricingConfig.addOns.mobileAnalytics?.[analyticsLevel]
  ) {
    const addOn = pricingConfig.addOns.mobileAnalytics[analyticsLevel];
    const amount = (addOn.min + addOn.max) / 2;
    addItem(lotsMap, "SEO/Tracking", {
      label: "Analytics mobile",
      amount,
    });
    baseTotal += amount;
  }

  // 8. QA & livraison
  const qaLevel = answers["qa-level"];
  if (qaLevel) {
    const map: Record<string, number> = {
      basique: 0,
      standard: 1500,
      renforce: 3500,
    };
    const amount = map[qaLevel] ?? 0;
    if (amount > 0) {
      addItem(lotsMap, "QA & Livraison", {
        label: "Tests & recettes",
        amount,
      });
      baseTotal += amount;
    }
  } else {
    assumptions.push(
      "Niveau de QA estimé standard (tests principaux desktop + mobile)."
    );
  }

  // 9. Post-lancement / formation
  const training = answers["training"];
  if (training) {
    const map: Record<string, { qty: number; amount: number }> = {
      aucune: { qty: 0, amount: 0 },
      "1h": { qty: 1, amount: 400 },
      "2-3h": { qty: 3, amount: 900 },
    };
    const conf = map[training];
    if (conf && conf.amount > 0) {
      addItem(lotsMap, "Post-lancement", {
        label: "Formation des équipes",
        qty: conf.qty,
        unit: "heure",
        amount: conf.amount,
      });
      baseTotal += conf.amount;
    }
  }

  if (projectType === "app-mobile") {
    const mobilePostLaunch = answers["mobile-post-launch"];
    if (mobilePostLaunch && pricingConfig.addOns.mobilePostLaunch) {
      const services = mobilePostLaunch.split(",").filter(Boolean);
      for (const service of services) {
        const addOn = pricingConfig.addOns.mobilePostLaunch[service];
        if (addOn) {
          const amount = (addOn.min + addOn.max) / 2;
          addItem(lotsMap, "Post-lancement", {
            label: service,
            amount,
          });
          baseTotal += amount;
        }
      }
    }
  }

  // 10. Maintenance
  const maintenance = answers["maintenance"];
  if (maintenance) {
    const map: Record<string, number> = {
      "oui-mensuel": 2500,
      "oui-ponctuel": 1000,
      non: 0,
    };
    const amount = map[maintenance] ?? 0;
    if (amount > 0) {
      addItem(lotsMap, "Post-lancement", {
        label: "Maintenance",
        amount,
      });
      baseTotal += amount;
    }
  }

  // 11. Calcul incertitude
  const uncertainty = computeUncertainty(answers);
  const min = roundToHundreds(baseTotal * uncertainty.minCoef);
  const max = roundToHundreds(baseTotal * uncertainty.maxCoef);

  // 12. Exclusions génériques
  exclusions.push(
    "Frais publicitaires (Google Ads, Meta Ads, etc.) non inclus.",
    "Abonnements aux outils tiers (CRM, emailing, analytics avancés, hébergement, Apple / Google developer, etc.) non inclus.",
    "Production de contenus (shooting, vidéo, voix-off) hors rédaction web standard non incluse."
  );
  if (projectType === "app-mobile") {
    exclusions.push(
      "Création et gestion du compte Apple Developer / Google Play non incluse."
    );
  }

  // 13. Next steps
  nextSteps.push(
    "Planifier un atelier de cadrage (1h) pour valider le périmètre détaillé.",
    "Finaliser un devis contractuel basé sur ce chiffrage prévisionnel.",
    "Aligner le planning et les jalons de livraison."
  );

  const lots = Object.values(lotsMap);

  return {
    min,
    max,
    confidence: uncertainty.confidence,
    lots,
    assumptions,
    exclusions,
    nextSteps,
    uncertaintyScore: uncertainty.score,
  };
}

