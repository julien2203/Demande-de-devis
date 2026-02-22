"use client";

import { ReactNode, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProgressBar } from "./ProgressBar";
import { Card, CardContent } from "@/components/ui/card";

interface WizardLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
}

function WizardLayoutContent({
  children,
  currentStep,
  totalSteps,
}: WizardLayoutProps) {
  const searchParams = useSearchParams();
  const isEmbed = searchParams?.get("embed") === "1" || searchParams?.get("theme") === "light";

  if (isEmbed) {
    return (
      <main className="min-h-screen bg-[hsl(var(--bg))]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-[1000px]">
          <div className="mb-6">
            <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
          </div>

          <Card className="bg-card border-card-border shadow-card rounded-xl min-h-[500px]">
            <CardContent className="p-6 sm:p-8 lg:p-10">
              {children}
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[hsl(var(--bg))]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-[1000px]">
        <div className="mb-10 sm:mb-12 text-center">
          <h1 className="mb-4">Simulateur de Devis</h1>
          <p className="text-subtitle max-w-2xl mx-auto">
            Répondez à quelques questions pour obtenir une estimation personnalisée
          </p>
        </div>

        <div className="mb-8">
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
        </div>

        <Card className="bg-card border-card-border shadow-card rounded-xl min-h-[500px]">
          <CardContent className="p-6 sm:p-8 lg:p-10">
            {children}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export function WizardLayout(props: WizardLayoutProps) {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[hsl(var(--bg))]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-[1000px]">
          <div className="mb-8">
            <ProgressBar currentStep={props.currentStep} totalSteps={props.totalSteps} />
          </div>
          <Card className="bg-card border-card-border shadow-card rounded-xl min-h-[500px]">
            <CardContent className="p-6 sm:p-8 lg:p-10">
              {props.children}
            </CardContent>
          </Card>
        </div>
      </main>
    }>
      <WizardLayoutContent {...props} />
    </Suspense>
  );
}
