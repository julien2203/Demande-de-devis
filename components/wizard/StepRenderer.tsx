"use client";

import { Question } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface StepRendererProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

export function StepRenderer({
  question,
  value,
  onChange,
}: StepRendererProps) {
  const renderInput = () => {
    switch (question.type) {
      case "radio":
        return (
          <RadioGroup value={value} onValueChange={onChange}>
            <div className="space-y-4">
              {question.options?.map((option) => (
                <div
                  key={option.value}
                  className="flex items-start space-x-3 rounded-lg border border-input p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => onChange(option.value)}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={option.value}
                      className="text-base font-medium cursor-pointer"
                    >
                      {option.label}
                    </Label>
                    {option.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case "select":
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full h-12 text-base">
              <SelectValue placeholder="Sélectionnez une option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "text":
        const inputType = question.id === "contact" 
          ? "email" 
          : question.id === "telephone" 
          ? "tel" 
          : "text";
        const placeholder = question.id === "contact"
          ? "exemple@email.com"
          : question.id === "telephone"
          ? "06 12 34 56 78"
          : "Votre réponse...";
        
        return (
          <Input
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-12 text-base"
            placeholder={placeholder}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-12 text-base"
            placeholder="Votre réponse..."
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{question.label}</h2>
      {renderInput()}
    </div>
  );
}
