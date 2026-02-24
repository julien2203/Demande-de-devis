import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface QuoteCardProps {
  currentStep: number;
  totalSteps: number;
  children: ReactNode;
}

export function QuoteCard({
  currentStep,
  totalSteps,
  children,
}: QuoteCardProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <Card className="bg-card border-card-border shadow-soft min-h-[500px]">
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="mb-4 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
            Simulateur Easyweb
          </p>
          <h1 className="mb-2">Simulateur de Devis</h1>
          <p className="text-subtitle max-w-2xl mx-auto">
            Répondez à quelques questions pour obtenir une estimation personnalisée
          </p>
        </div>

        <div className="mb-3 flex items-center justify-between text-xs sm:text-sm text-foreground-light">
          <span>
            Question {currentStep + 1} sur {totalSteps}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>

        <Progress
          value={progress}
          className="h-1.5 rounded-[var(--radius-lg)] bg-muted mb-6"
        />

        <CardContent className="p-0">{children}</CardContent>
      </div>
    </Card>
  );
}

