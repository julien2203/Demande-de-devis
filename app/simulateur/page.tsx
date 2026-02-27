"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { StepRenderer } from "@/components/wizard/StepRenderer";
import { Button } from "@/components/ui/button";
import { Question, WizardAnswers } from "@/lib/types";
import questionsData from "@/data/questions.json";
import { ArrowLeft, ArrowRight } from "lucide-react";

const allQuestions = questionsData.questions as Question[];
const STORAGE_KEY = "wizardAnswers";

export default function SimulateurPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>(() => {
    // Charger les réponses depuis localStorage au démarrage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return {};
        }
      }
    }
    return {};
  });
  const [error, setError] = useState<string>("");

  const projectType = answers["type-projet"] || "";

  const questions = useMemo(() => {
    return allQuestions.filter((q) => {
      if (q.id === "type-projet") return true;
      if (!projectType) return false;
      if (!q.visibleFor || q.visibleFor.length === 0) return true;
      return q.visibleFor.includes(projectType);
    });
  }, [projectType]);

  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion.id] || "";

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    if (typeof window !== "undefined" && Object.keys(answers).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    }
  }, [answers]);

  const handleAnswer = (value: string) => {
    setError("");
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const validateAnswer = (): boolean => {
    if (currentQuestion.required && !currentAnswer.trim()) {
      setError("Ce champ est obligatoire");
      return false;
    }

    // Validation email
    if (currentQuestion.id === "contact" && currentAnswer.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(currentAnswer.trim())) {
        setError("Veuillez entrer une adresse email valide");
        return false;
      }
    }

    // Validation téléphone (optionnel mais si rempli, doit être valide)
    if (currentQuestion.id === "telephone" && currentAnswer.trim()) {
      const phoneRegex = /^[0-9\s\-\+\(\)]+$/;
      if (!phoneRegex.test(currentAnswer.trim()) || currentAnswer.trim().length < 10) {
        setError("Veuillez entrer un numéro de téléphone valide");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateAnswer()) {
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setError("");
    } else {
      // Sauvegarder les réponses dans localStorage et rediriger
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
      router.push("/resultat");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setError("");
    }
  };

  const canProceed = currentQuestion.required
    ? currentAnswer.trim() !== ""
    : true;

  return (
    <WizardLayout
      currentStep={currentStep}
      totalSteps={questions.length}
    >
      <div className="flex flex-col h-full">
        <div className="card-body flex-1 mb-10">
          <StepRenderer
            question={currentQuestion}
            value={currentAnswer}
            onChange={handleAnswer}
          />
          {error && (
            <p className="mt-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="card-footer flex justify-between items-center gap-4 pt-8 border-t border-border">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 min-w-[140px]"
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex items-center gap-2 min-w-[140px]"
            size="lg"
          >
            {currentStep === questions.length - 1 ? "Voir le résultat" : "Suivant"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </WizardLayout>
  );
}
