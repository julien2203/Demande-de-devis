import { PricingEngine } from "./pricing-engine";
import { WizardAnswers } from "./types";

describe("PricingEngine", () => {
  let engine: PricingEngine;

  beforeEach(() => {
    engine = new PricingEngine();
  });

  describe("calculateDeterministicPrice", () => {
    it("devrait calculer le prix pour un site vitrine basique", () => {
      const answers: WizardAnswers = {
        "type-projet": "site-vitrine",
        "nombre-pages": "1-5",
        design: "oui-complet",
        fonctionnalites: "basique",
        delai: "normal",
        referencement: "non",
      };

      const result = engine.calculateDeterministicPrice(answers);

      expect(result).toHaveProperty("min");
      expect(result).toHaveProperty("max");
      expect(result).toHaveProperty("breakdown");
      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
      expect(Array.isArray(result.breakdown)).toBe(true);
    });

    it("devrait calculer le prix pour un e-commerce avec toutes les options", () => {
      const answers: WizardAnswers = {
        "type-projet": "ecommerce",
        "nombre-pages": "11-20",
        design: "non",
        fonctionnalites: "avance",
        delai: "urgent",
        referencement: "oui-complet",
      };

      const result = engine.calculateDeterministicPrice(answers);

      expect(result.min).toBeGreaterThan(5000);
      expect(result.max).toBeGreaterThan(result.min);
      expect(result.breakdown.length).toBeGreaterThan(4);
      
      // Vérifier que le basePrice e-commerce est inclus
      const ecommerceItem = result.breakdown.find((item) =>
        item.label.includes("E-commerce")
      );
      expect(ecommerceItem).toBeDefined();
    });

    it("devrait inclure le design dans le breakdown si nécessaire", () => {
      const answers: WizardAnswers = {
        "type-projet": "site-vitrine",
        "nombre-pages": "1-5",
        design: "non",
        fonctionnalites: "basique",
        delai: "normal",
        referencement: "non",
      };

      const result = engine.calculateDeterministicPrice(answers);

      const designItem = result.breakdown.find((item) =>
        item.label.includes("design")
      );
      expect(designItem).toBeDefined();
      expect(designItem?.amount).toBeGreaterThan(0);
    });

    it("devrait appliquer une réduction pour délai flexible", () => {
      const answers: WizardAnswers = {
        "type-projet": "site-vitrine",
        "nombre-pages": "1-5",
        design: "oui-complet",
        fonctionnalites: "basique",
        delai: "flexible",
        referencement: "non",
      };

      const result = engine.calculateDeterministicPrice(answers);

      // Le prix devrait être inférieur à celui avec délai normal
      const answersNormal: WizardAnswers = {
        ...answers,
        delai: "normal",
      };
      const resultNormal = engine.calculateDeterministicPrice(answersNormal);

      expect(result.min).toBeLessThan(resultNormal.min);
      expect(result.max).toBeLessThan(resultNormal.max);
    });

    it("devrait appliquer une majoration pour délai urgent", () => {
      const answers: WizardAnswers = {
        "type-projet": "site-vitrine",
        "nombre-pages": "1-5",
        design: "oui-complet",
        fonctionnalites: "basique",
        delai: "urgent",
        referencement: "non",
      };

      const result = engine.calculateDeterministicPrice(answers);

      const answersNormal: WizardAnswers = {
        ...answers,
        delai: "normal",
      };
      const resultNormal = engine.calculateDeterministicPrice(answersNormal);

      expect(result.min).toBeGreaterThan(resultNormal.min);
      expect(result.max).toBeGreaterThan(resultNormal.max);
    });

    it("devrait calculer correctement les pages supplémentaires", () => {
      const answers: WizardAnswers = {
        "type-projet": "site-vitrine",
        "nombre-pages": "20+",
        design: "oui-complet",
        fonctionnalites: "basique",
        delai: "normal",
        referencement: "non",
      };

      const result = engine.calculateDeterministicPrice(answers);

      const pagesItem = result.breakdown.find((item) =>
        item.label.includes("Pages")
      );
      expect(pagesItem).toBeDefined();
      expect(pagesItem?.amount).toBeGreaterThan(0);
    });

    it("devrait inclure le SEO dans le breakdown si demandé", () => {
      const answers: WizardAnswers = {
        "type-projet": "site-vitrine",
        "nombre-pages": "1-5",
        design: "oui-complet",
        fonctionnalites: "basique",
        delai: "normal",
        referencement: "oui-complet",
      };

      const result = engine.calculateDeterministicPrice(answers);

      const seoItem = result.breakdown.find((item) =>
        item.label.includes("SEO")
      );
      expect(seoItem).toBeDefined();
      expect(seoItem?.amount).toBeGreaterThan(0);
    });

    it("devrait toujours retourner min < max", () => {
      const answers: WizardAnswers = {
        "type-projet": "application-web",
        "nombre-pages": "20+",
        design: "non",
        fonctionnalites: "avance",
        delai: "urgent",
        referencement: "oui-complet",
      };

      const result = engine.calculateDeterministicPrice(answers);

      expect(result.min).toBeLessThan(result.max);
    });

    it("devrait arrondir les prix à la centaine", () => {
      const answers: WizardAnswers = {
        "type-projet": "site-vitrine",
        "nombre-pages": "1-5",
        design: "oui-complet",
        fonctionnalites: "basique",
        delai: "normal",
        referencement: "non",
      };

      const result = engine.calculateDeterministicPrice(answers);

      expect(result.min % 100).toBe(0);
      expect(result.max % 100).toBe(0);
    });

    it("devrait calculer un prix pour une application mobile basique", () => {
      const answers: WizardAnswers = {
        "type-projet": "app-mobile",
        "nombre-pages": "1-5",
        design: "oui-complet",
        fonctionnalites: "basique",
        "content-level": "fourni",
        "multi-lang": "1",
        delai: "normal",
        referencement: "non",
        budget: "5000-10000",
        "mobile-screens": "1-5",
        "mobile-platforms": "ios",
        "mobile-auth": "none",
        "mobile-content": "fixe",
        "mobile-backoffice": "none",
        "mobile-offline": "non",
        "mobile-design": "template",
        "mobile-analytics": "basique",
      };

      const result = engine.calculateDeterministicPrice(answers);

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
      const projectItem = result.breakdown.find((item) =>
        item.label.includes("Application mobile")
      );
      expect(projectItem).toBeDefined();
    });

    it("devrait calculer un prix pour une application mobile complexe", () => {
      const answers: WizardAnswers = {
        "type-projet": "app-mobile",
        "nombre-pages": "20+",
        design: "non",
        fonctionnalites: "avance",
        "content-level": "a-produire",
        "multi-lang": "3+",
        "tool-connections": "crm,paiement,notion-erp",
        delai: "urgent",
        referencement: "oui-complet",
        budget: "25000+",
        "mobile-screens": "21-40",
        "mobile-platforms": "ios-android",
        "mobile-auth": "sso",
        "mobile-features": "paiement,notifications-push,geolocalisation,chat",
        "mobile-content": "si-erp",
        "mobile-backoffice": "avance",
        "mobile-offline": "oui",
        "mobile-design": "design-system",
        "mobile-analytics": "avance",
        "mobile-post-launch":
          "maintenance-corrective,maintenance-evolutive,rapports-statistiques,ab-testing,campagnes-publicitaires",
      };

      const result = engine.calculateDeterministicPrice(answers);

      expect(result.min).toBeGreaterThan(15000);
      expect(result.max).toBeGreaterThan(result.min);
      expect(result.breakdown.length).toBeGreaterThan(8);
    });

    it("devrait avoir une fourchette resserrée quand les réponses sont complètes", () => {
      const answers: WizardAnswers = {
        "type-projet": "site-vitrine",
        "nombre-pages": "6-10",
        design: "oui-partiel",
        fonctionnalites: "intermediaire",
        "content-level": "mixte",
        "multi-lang": "2",
        "tool-connections": "crm,emailing",
        delai: "normal",
        referencement: "oui-basique",
        budget: "5000-10000",
      };

      const result = engine.calculateDeterministicPrice(answers);

      const ratio = result.max / result.min;
      expect(ratio).toBeLessThan(1.25);
    });

    it("devrait élargir la fourchette si budget inconnu ou réponses manquantes", () => {
      const baseAnswers: WizardAnswers = {
        "type-projet": "site-vitrine",
        "nombre-pages": "6-10",
        design: "oui-partiel",
        fonctionnalites: "intermediaire",
        "content-level": "mixte",
        "multi-lang": "2",
        delai: "normal",
        referencement: "oui-basique",
      };

      const withBudget: WizardAnswers = {
        ...baseAnswers,
        budget: "5000-10000",
      };

      const withoutBudget: WizardAnswers = {
        ...baseAnswers,
        budget: "je-ne-sais-pas",
      };

      const resultWithBudget = engine.calculateDeterministicPrice(withBudget);
      const resultWithoutBudget =
        engine.calculateDeterministicPrice(withoutBudget);

      const ratioWith = resultWithBudget.max / resultWithBudget.min;
      const ratioWithout = resultWithoutBudget.max / resultWithoutBudget.min;

      expect(ratioWithout).toBeGreaterThanOrEqual(ratioWith);
    });
  });
});
