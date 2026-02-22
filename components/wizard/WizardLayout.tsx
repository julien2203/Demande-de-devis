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
      <div className="bg-background">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          <div className="mb-4">
            <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
          </div>

          <Card className="min-h-[400px]">
            <CardContent className="p-6">
              {children}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Simulateur de Devis</h1>
          <p className="text-muted-foreground">
            Répondez à quelques questions pour obtenir une estimation
          </p>
        </div>

        <div className="mb-8">
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
        </div>

        <Card className="min-h-[400px]">
          <CardContent className="p-8">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function WizardLayout(props: WizardLayoutProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-8">
            <ProgressBar currentStep={props.currentStep} totalSteps={props.totalSteps} />
          </div>
          <Card className="min-h-[400px]">
            <CardContent className="p-8">
              {props.children}
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <WizardLayoutContent {...props} />
    </Suspense>
  );
}
