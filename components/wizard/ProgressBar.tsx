"use client";

import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-center text-sm font-medium">
        <span className="text-foreground-light">Question {currentStep + 1} sur {totalSteps}</span>
        <span className="text-foreground-light">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} />
    </div>
  );
}
