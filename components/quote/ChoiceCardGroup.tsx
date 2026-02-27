import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface ChoiceCardGroupProps {
  options: ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
  multiple?: boolean;
}

export function ChoiceCardGroup({
  options,
  value,
  onChange,
  multiple = false,
}: ChoiceCardGroupProps) {
  const selectedValues = multiple && value ? value.split(",") : [value];

  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="grid gap-3"
    >
      {options.map((option) => {
        const isSelected = multiple
          ? selectedValues.includes(option.value)
          : value === option.value;

        return (
          <label
            key={option.value}
            htmlFor={option.value}
            className={cn(
              "group relative flex cursor-pointer rounded-[var(--radius-lg)] border bg-card p-4 sm:p-5 transition-all",
              "hover:bg-muted hover:border-input-focus",
              isSelected &&
                "border-primary bg-primary/5 ring-2 ring-primary/15 hover:bg-primary/7"
            )}
            onClick={(event) => {
              event.preventDefault();
              onChange(option.value);
            }}
            >
            <RadioGroupItem
              id={option.value}
              value={option.value}
              className="sr-only"
            />
            <div className="flex w-full items-start gap-3">
              {option.icon && (
                <span className="mt-0.5 text-primary">{option.icon}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-foreground">
                  {option.label}
                </div>
                {option.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          </label>
        );
      })}
    </RadioGroup>
  );
}

