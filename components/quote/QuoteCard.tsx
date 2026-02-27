import { ReactNode, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface QuoteCardProps {
  currentStep: number;
  totalSteps: number;
  children: ReactNode;
  isEmbed?: boolean;
}

export function QuoteCard({
  currentStep,
  totalSteps,
  children,
  isEmbed = false,
}: QuoteCardProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

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

    // envoi immédiat + après animation
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
  }, [isEmbed, currentStep, totalSteps]);

  return (
    <Card className="bg-card border-card-border shadow-soft min-h-[500px] w-full">
      <div className="p-6 sm:p-8 lg:p-10 quote-card space-y-6">
        <div className="card-meta space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm text-foreground-light">
            <span>
              Question {currentStep + 1} sur {totalSteps}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>

          <Progress
            value={progress}
            className="h-1.5 rounded-[var(--radius-lg)] bg-muted"
          />
        </div>

        <div className="card-body">
          <CardContent className="p-0">{children}</CardContent>
        </div>
      </div>
    </Card>
  );
}

