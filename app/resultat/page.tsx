"use client";

import { useEffect, useState, Suspense, useRef } from "react";
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

  const rootRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!isEmbed) return;
    if (typeof window === "undefined") return;
    if (window.parent === window) return;

    const sendHeight = () => {
      const height = document.body.scrollHeight;
      window.parent.postMessage(
        { type: "EASYWEB_QUOTE_HEIGHT", height },
        "*"
      );
    };

    sendHeight();
    const rafId = window.requestAnimationFrame(sendHeight);
    const timeoutId = window.setTimeout(sendHeight, 250);

    const handleResize = () => {
      window.requestAnimationFrame(sendHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [isEmbed, pricingResult, showForm, submitStatus]);

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
      <main className="min-h-screen bg-[hsl(var(--bg))] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </main>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isEmbed) {
    return (
      <div
        id="easyweb-result-root"
        className="w-full"
        ref={rootRef}
      >
        <div className="bg-card border-card-border shadow-card rounded-xl p-8 sm:p-10 lg:p-12 space-y-10">
          {/* Hero avec estimation */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-2">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="mb-4">Votre Estimation</h1>
              <p className="text-subtitle">
                Estimation basée sur vos réponses
              </p>
            </div>
            <div className="pt-4">
              <div className="inline-block px-8 py-6 bg-primary/5 rounded-2xl border-2 border-primary/20">
                <div className="text-[clamp(2rem,5vw,3.5rem)] font-bold text-primary mb-2">
                  {formatPrice(pricingResult.min)} - {formatPrice(pricingResult.max)}
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Fourchette de prix estimée
                </p>
              </div>
            </div>
          </div>

          {/* Détails du calcul */}
          <div className="border-t border-border pt-8">
            <h2 className="mb-6">
              Détail du calcul
            </h2>
            <div className="space-y-3">
              {pricingResult.breakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 bg-muted/30 rounded-lg border border-border hover:shadow-soft transition-all"
                >
                  <span className="text-base font-medium text-foreground">
                    {item.label}
                  </span>
                  <span className="text-base font-semibold text-foreground">
                    {formatPrice(item.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center p-6 bg-primary/5 rounded-xl border-2 border-primary/20 mt-6">
                <span className="text-lg font-semibold text-foreground">
                  Total estimé
                </span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(pricingResult.min)} - {formatPrice(pricingResult.max)}
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="border-t border-border pt-10 space-y-6">
            {submitStatus === "success" ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-2">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-900">
                  Demande envoyée avec succès !
                </h2>
                <p className="text-base text-green-700">
                  Votre demande a été enregistrée. Nous vous contacterons très prochainement.
                </p>
              </div>
            ) : !showForm ? (
              <div className="text-center space-y-6">
                <div>
                  <h2 className="mb-3">
                    Discutons de votre projet
                  </h2>
                  <p className="text-subtitle max-w-2xl mx-auto">
                    Cette estimation est indicative. Remplissez le formulaire pour recevoir un
                    devis personnalisé et détaillé adapté à vos besoins spécifiques.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="flex items-center gap-2 mx-auto"
                  onClick={() => setShowForm(true)}
                >
                  <Mail className="h-5 w-5" />
                  Réserver un call
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="mb-2">
                    Vos informations de contact
                  </h2>
                  <p className="text-subtitle">
                    Nous avons déjà votre email ({answers?.contact}) et téléphone ({answers?.telephone || "non renseigné"}).
                    Complétez les informations ci-dessous pour finaliser votre demande.
                  </p>
                </div>
                
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
                  <div className="bg-destructive/10 border-2 border-destructive/20 rounded-lg p-4">
                    <p className="text-sm font-medium text-destructive">{errorMessage}</p>
                  </div>
                )}

                <div className="flex gap-4">
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
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Mail className="h-5 w-5 mr-2" />
                        Envoyer ma demande
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Pas de bouton "Recommencer" en mode embed */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[hsl(var(--bg))] py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1000px]">
        <div className="mb-8">
          <Link href="/simulateur">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au simulateur
            </Button>
          </Link>
        </div>

        <div className="bg-card border-card-border shadow-card rounded-xl p-8 sm:p-10 lg:p-12 space-y-10">
          {/* Hero avec estimation */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-2">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="mb-4">Votre Estimation</h1>
              <p className="text-subtitle">
                Estimation basée sur vos réponses
              </p>
            </div>
            <div className="pt-4">
              <div className="inline-block px-8 py-6 bg-primary/5 rounded-2xl border-2 border-primary/20">
                <div className="text-[clamp(2rem,5vw,3.5rem)] font-bold text-primary mb-2">
                  {formatPrice(pricingResult.min)} - {formatPrice(pricingResult.max)}
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Fourchette de prix estimée
                </p>
              </div>
            </div>
          </div>

          {/* Détails du calcul */}
          <div className="border-t border-border pt-8">
            <h2 className="mb-6">
              Détail du calcul
            </h2>
            <div className="space-y-3">
              {pricingResult.breakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 bg-muted/30 rounded-lg border border-border hover:shadow-soft transition-all"
                >
                  <span className="text-base font-medium text-foreground">
                    {item.label}
                  </span>
                  <span className="text-base font-semibold text-foreground">
                    {formatPrice(item.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center p-6 bg-primary/5 rounded-xl border-2 border-primary/20 mt-6">
                <span className="text-lg font-semibold text-foreground">
                  Total estimé
                </span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(pricingResult.min)} - {formatPrice(pricingResult.max)}
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="border-t border-border pt-10 space-y-6">
            {submitStatus === "success" ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-2">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-900">
                  Demande envoyée avec succès !
                </h2>
                <p className="text-base text-green-700">
                  Votre demande a été enregistrée. Nous vous contacterons très prochainement.
                </p>
              </div>
            ) : !showForm ? (
              <div className="text-center space-y-6">
                <div>
                  <h2 className="mb-3">
                    Discutons de votre projet
                  </h2>
                  <p className="text-subtitle max-w-2xl mx-auto">
                    Cette estimation est indicative. Remplissez le formulaire pour recevoir un
                    devis personnalisé et détaillé adapté à vos besoins spécifiques.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="flex items-center gap-2 mx-auto"
                  onClick={() => setShowForm(true)}
                >
                  <Mail className="h-5 w-5" />
                  Réserver un call
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="mb-2">
                    Vos informations de contact
                  </h2>
                  <p className="text-subtitle">
                    Nous avons déjà votre email ({answers?.contact}) et téléphone ({answers?.telephone || "non renseigné"}).
                    Complétez les informations ci-dessous pour finaliser votre demande.
                  </p>
                </div>
                
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
                  <div className="bg-destructive/10 border-2 border-destructive/20 rounded-lg p-4">
                    <p className="text-sm font-medium text-destructive">{errorMessage}</p>
                  </div>
                )}

                <div className="flex gap-4">
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
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Mail className="h-5 w-5 mr-2" />
                        Envoyer ma demande
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            <div className="pt-6 border-t border-border">
              <Link href="/simulateur">
                <Button variant="ghost" className="w-full">
                  Recommencer le simulateur
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResultatPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[hsl(var(--bg))] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </main>
    }>
      <ResultatPageContent />
    </Suspense>
  );
}
