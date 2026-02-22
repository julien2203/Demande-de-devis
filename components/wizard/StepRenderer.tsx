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
            <div className="space-y-3">
              {question.options?.map((option) => (
                <div
                  key={option.value}
                  className="flex items-start space-x-4 rounded-xl border-2 border-input bg-card p-5 hover:border-ring hover:shadow-soft transition-all cursor-pointer group"
                  onClick={() => onChange(option.value)}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={option.value}
                      className="text-base font-semibold cursor-pointer text-foreground block"
                    >
                      {option.label}
                    </Label>
                    {option.description && (
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
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
        <h2 className="mb-3">{question.label}</h2>
      </div>
      <div>
        {renderInput()}
      </div>
    </div>
  );
}
