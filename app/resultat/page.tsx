"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PricingEngine } from "@/lib/pricing-engine";
import { DeterministicPricingResult, WizardAnswers } from "@/lib/types";
import { CheckCircle2, Mail, Phone, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

function ResultatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEmbed = searchParams?.get("embed") === "1" || searchParams?.get("theme") === "light";
  
  const [pricingResult, setPricingResult] = useState<DeterministicPricingResult | null>(
    null
  );
  const [answers, setAnswers] = useState<WizardAnswers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // Formulaire
  const [formData, setFormData] = useState({
    name: "",
    company: "",
  });

  useEffect(() => {
    // Récupérer les réponses depuis localStorage (uniquement côté client)
    if (typeof window === "undefined") return;
    
    const answersJson = localStorage.getItem("wizardAnswers");
    if (!answersJson) {
      router.push("/simulateur");
      return;
    }

    try {
      const parsedAnswers: WizardAnswers = JSON.parse(answersJson);
      setAnswers(parsedAnswers);
      const engine = new PricingEngine();
      const result = engine.calculateDeterministicPrice(parsedAnswers);
      setPricingResult(result);
      
      // Pré-remplir le nom si disponible
      if (parsedAnswers.contact) {
        const email = parsedAnswers.contact;
        const nameFromEmail = email.split("@")[0];
        setFormData(prev => ({ ...prev, name: nameFromEmail }));
      }
    } catch (error) {
      console.error("Error parsing answers:", error);
      router.push("/simulateur");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!answers || !pricingResult) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact: {
            name: formData.name,
            email: answers.contact || "",
            phone: answers.telephone || undefined,
            company: formData.company || undefined,
          },
          answers,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        const errorMsg = data.message || data.error || "Erreur lors de l'envoi";
        throw new Error(errorMsg);
      }

      setSubmitStatus("success");
      setShowForm(false);
      
      // Optionnel : rediriger vers la page Notion
      // window.open(data.notionUrl, '_blank');
    } catch (error: any) {
      setSubmitStatus("error");
      const errorMsg = error.message || "Une erreur est survenue";
      setErrorMessage(errorMsg);
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !pricingResult || !answers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const containerClass = isEmbed 
    ? "bg-background container mx-auto px-4 py-4 max-w-4xl"
    : "min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 container mx-auto px-4 py-8 max-w-4xl";

  return (
    <div className={isEmbed ? "bg-background" : "min-h-screen bg-gradient-to-br from-background via-background to-secondary/20"}>
      <div className={isEmbed ? "container mx-auto px-4 py-4 max-w-4xl" : "container mx-auto px-4 py-8 max-w-4xl"}>
        {!isEmbed && (
          <div className="mb-8">
            <Link href="/simulateur">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au simulateur
              </Button>
            </Link>
          </div>
        )}

        <div className="bg-card rounded-lg border shadow-sm p-8 space-y-8">
          {/* En-tête avec estimation */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">Votre Estimation</h1>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Estimation basée sur vos réponses
              </p>
              <div className="space-y-1">
                <div className="text-5xl font-bold text-primary">
                  {formatPrice(pricingResult.min)} - {formatPrice(pricingResult.max)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Fourchette de prix estimée
                </p>
              </div>
            </div>
          </div>

          {/* Détails du calcul */}
          <div className="border-t pt-8">
            <h2 className="text-xl font-semibold mb-4">
              Détail du calcul
            </h2>
            <div className="space-y-3">
              {pricingResult.breakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-muted/50 rounded-md"
                >
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                  <span className="font-semibold">
                    {formatPrice(item.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center p-4 bg-primary/10 rounded-md border-2 border-primary/20 mt-4">
                <span className="text-base font-semibold">
                  Total estimé
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatPrice(pricingResult.min)} - {formatPrice(pricingResult.max)}
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="border-t pt-8 space-y-4">
            {submitStatus === "success" ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 mb-2">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-green-900 dark:text-green-100">
                  Demande envoyée avec succès !
                </h2>
                <p className="text-green-700 dark:text-green-300">
                  Votre demande a été enregistrée. Nous vous contacterons très prochainement.
                </p>
              </div>
            ) : !showForm ? (
              <>
                <h2 className="text-xl font-semibold">
                  Discutons de votre projet
                </h2>
                <p className="text-muted-foreground">
                  Cette estimation est indicative. Remplissez le formulaire pour recevoir un
                  devis personnalisé et détaillé adapté à vos besoins spécifiques.
                </p>
                <Button
                  size="lg"
                  className="w-full flex items-center gap-2"
                  onClick={() => setShowForm(true)}
                >
                  <Mail className="h-4 w-4" />
                  Demander un devis personnalisé
                </Button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-semibold">
                  Vos informations de contact
                </h2>
                <p className="text-sm text-muted-foreground">
                  Nous avons déjà votre email ({answers?.contact}) et téléphone ({answers?.telephone || "non renseigné"}).
                  Complétez les informations ci-dessous pour finaliser votre demande.
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nom complet <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Jean Dupont"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Entreprise (optionnel)</Label>
                  <Input
                    id="company"
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, company: e.target.value }))
                    }
                    placeholder="Ma Société"
                  />
                </div>

                {submitStatus === "error" && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    <p className="text-sm text-destructive">{errorMessage}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setSubmitStatus("idle");
                      setErrorMessage("");
                    }}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.name.trim()}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Envoyer ma demande
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            <div className="pt-4">
              <Link href="/simulateur">
                <Button variant="ghost" className="w-full">
                  Recommencer le simulateur
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <ResultatPageContent />
    </Suspense>
  );
}
