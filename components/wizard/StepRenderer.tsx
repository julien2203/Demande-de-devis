"use client";

import { Question } from "@/lib/types";
import { ChoiceCardGroup } from "@/components/quote/ChoiceCardGroup";
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
          <ChoiceCardGroup
            options={question.options ?? []}
            value={value}
            onChange={onChange}
          />
        );

      case "select":
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full">
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
            placeholder={placeholder}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Votre réponse..."
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-0 slide-in-from-4 duration-300">
      <div>
        <h2 className="mb-3 text-[clamp(1.375rem,3vw,2rem)] font-semibold leading-tight">
          {question.label}
        </h2>
      </div>
      <div>
        {renderInput()}
      </div>
    </div>
  );
}
