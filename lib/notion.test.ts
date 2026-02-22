import { buildNotionProperties, CreateLeadInput } from "./notion";
import { WizardAnswers, PricingBreakdownItem } from "./types";

describe("buildNotionProperties", () => {
  const baseInput: CreateLeadInput = {
    contact: {
      name: "John Doe",
      email: "john@example.com",
      phone: "+33123456789",
      company: "Acme Corp",
    },
    answers: {
      "type-projet": "site-vitrine",
      "nombre-pages": "6-10",
      design: "non",
      fonctionnalites: "intermediaire",
      delai: "urgent",
      referencement: "oui-complet",
      budget: "10000-25000",
    },
    estimate: {
      min: 5000,
      max: 8000,
    },
    breakdown: [
      { label: "Site vitrine", amount: 2500 },
      { label: "Création design complète", amount: 2250 },
      { label: "Pages supplémentaires (6-10)", amount: 1150 },
    ],
  };

  it("devrait construire les propriétés Notion correctement", () => {
    const properties = buildNotionProperties(baseInput);

    expect(properties).toHaveProperty("Name");
    expect(properties.Name.title[0].text.content).toBe(
      "Acme Corp — Site vitrine"
    );
    expect(properties.Email.email).toBe("john@example.com");
    expect(properties.Téléphone.phone_number).toBe("+33123456789");
    expect(properties.Entreprise.rich_text[0].text.content).toBe("Acme Corp");
    expect(properties.Prestation.select.name).toBe("Site vitrine");
    expect(properties["Budget déclaré"].select.name).toBe(
      "10 000€ – 25 000€"
    );
    expect(properties["Estimation min"].number).toBe(5000);
    expect(properties["Estimation max"].number).toBe(8000);
    expect(properties.Urgence.select.name).toBe("Urgent (< 1 mois)");
    expect(properties.Statut.select.name).toBe("New");
    expect(properties.Source.select.name).toBe("Website Simulator");
  });

  it("devrait utiliser le nom si pas de company", () => {
    const inputWithoutCompany: CreateLeadInput = {
      ...baseInput,
      contact: {
        name: "Jane Smith",
        email: "jane@example.com",
      },
    };

    const properties = buildNotionProperties(inputWithoutCompany);

    expect(properties.Name.title[0].text.content).toBe(
      "Jane Smith — Site vitrine"
    );
    expect(properties.Entreprise.rich_text).toEqual([]);
  });

  it("devrait mapper correctement les types de prestation", () => {
    const prestations = [
      "site-vitrine",
      "ecommerce",
      "application-web",
      "refonte",
    ];

    prestations.forEach((prestation) => {
      const input: CreateLeadInput = {
        ...baseInput,
        answers: {
          ...baseInput.answers,
          "type-projet": prestation,
        },
      };

      const properties = buildNotionProperties(input);
      const expectedLabels: Record<string, string> = {
        "site-vitrine": "Site vitrine",
        ecommerce: "E-commerce",
        "application-web": "Application Web",
        refonte: "Refonte",
      };

      expect(properties.Prestation.select.name).toBe(
        expectedLabels[prestation]
      );
    });
  });

  it("devrait mapper correctement les budgets", () => {
    const budgets = [
      { answer: "moins-5000", expected: "< 5 000€" },
      { answer: "5000-10000", expected: "5 000€ – 10 000€" },
      { answer: "10000-25000", expected: "10 000€ – 25 000€" },
      { answer: "25000+", expected: "25 000€+" },
      { answer: "unknown", expected: "Je ne sais pas" },
    ];

    budgets.forEach(({ answer, expected }) => {
      const input: CreateLeadInput = {
        ...baseInput,
        answers: {
          ...baseInput.answers,
          budget: answer,
        },
      };

      const properties = buildNotionProperties(input);
      expect(properties["Budget déclaré"].select.name).toBe(expected);
    });
  });

  it("devrait mapper correctement l'urgence", () => {
    const urgences = [
      { answer: "urgent", expected: "Urgent (< 1 mois)" },
      { answer: "normal", expected: "1–3 mois" },
      { answer: "flexible", expected: "Flexible" },
    ];

    urgences.forEach(({ answer, expected }) => {
      const input: CreateLeadInput = {
        ...baseInput,
        answers: {
          ...baseInput.answers,
          delai: answer,
        },
      };

      const properties = buildNotionProperties(input);
      expect(properties.Urgence.select.name).toBe(expected);
    });
  });

  it("devrait tronquer les réponses JSON si > 1900 caractères", () => {
    const longAnswers: WizardAnswers = {
      "type-projet": "site-vitrine",
      "nombre-pages": "20+",
      design: "non",
      fonctionnalites: "avance",
      delai: "normal",
      referencement: "oui-complet",
      budget: "25000+",
      // Ajouter des données pour dépasser 1900 caractères
      "extra-data": "x".repeat(2000),
    };

    const input: CreateLeadInput = {
      ...baseInput,
      answers: longAnswers,
    };

    const properties = buildNotionProperties(input);
    const answersText = properties["Réponses (JSON)"].rich_text[0].text.content;

    expect(answersText.length).toBeLessThanOrEqual(1910); // 1900 + "…(truncated)"
    expect(answersText).toContain("…(truncated)");
  });

  it("devrait gérer les réponses JSON courtes sans troncature", () => {
    const properties = buildNotionProperties(baseInput);
    const answersText = properties.Réponses.rich_text[0].text.content;

    expect(answersText).not.toContain("…(truncated)");
    expect(answersText).toContain("type-projet");
  });

  it("devrait gérer l'absence de téléphone", () => {
    const inputWithoutPhone: CreateLeadInput = {
      ...baseInput,
      contact: {
        name: "John Doe",
        email: "john@example.com",
      },
    };

    const properties = buildNotionProperties(inputWithoutPhone);

    expect(properties.Téléphone.phone_number).toBeNull();
  });

  it("devrait gérer les valeurs par défaut si answers incomplets", () => {
    const minimalInput: CreateLeadInput = {
      contact: {
        name: "Test User",
        email: "test@example.com",
      },
      answers: {
        "type-projet": "site-vitrine",
      },
      estimate: {
        min: 2000,
        max: 3000,
      },
      breakdown: [],
    };

    const properties = buildNotionProperties(minimalInput);

    expect(properties.Prestation.select.name).toBe("Site vitrine");
    expect(properties["Budget déclaré"].select.name).toBe("Je ne sais pas");
    expect(properties.Urgence.select.name).toBe("1–3 mois");
  });
});
