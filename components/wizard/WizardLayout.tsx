"use client";

import { ReactNode, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QuoteCard } from "@/components/quote/QuoteCard";

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
      <div className="w-full">
        <QuoteCard currentStep={currentStep} totalSteps={totalSteps}>
          {children}
        </QuoteCard>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[hsl(var(--bg-secondary))] flex items-center justify-center">
      <div className="max-w-[900px] w-full px-4 py-12 sm:py-16 lg:py-20">
        <QuoteCard currentStep={currentStep} totalSteps={totalSteps}>
          {children}
        </QuoteCard>
      </div>
    </main>
  );
}

export function WizardLayout(props: WizardLayoutProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[hsl(var(--bg-secondary))] flex items-center justify-center">
          <div className="max-w-[900px] w-full px-4 py-12 sm:py-16 lg:py-20">
            <QuoteCard
              currentStep={props.currentStep}
              totalSteps={props.totalSteps}
            >
              {props.children}
            </QuoteCard>
          </div>
        </main>
      }
    >
      <WizardLayoutContent {...props} />
    </Suspense>
  );
}
