"use client";

import { Question } from "@/lib/types";
import { ChoiceCardGroup } from "@/components/quote/ChoiceCardGroup";
import {
  Monitor,
  ShoppingBag,
  Smartphone,
  RefreshCcw,
  Layout,
  Layers,
  Globe2,
  Link2,
  Database,
  ShieldCheck,
  Bell,
  MapPin,
  MessageCircle,
  Image as ImageIcon,
  CalendarClock,
  ServerCog,
  WifiOff,
  Palette,
  LineChart,
  Rocket,
} from "lucide-react";
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
  const handleMultiSelectChange = (optionValue: string) => {
    const current = value ? value.split(",") : [];
    const exists = current.includes(optionValue);
    const next = exists
      ? current.filter((v) => v !== optionValue)
      : [...current, optionValue];
    onChange(next.join(","));
  };

  const mapOptionIcons = () => {
    if (!question.options) return question.options;

    return question.options.map((option) => {
      let icon = undefined;

      if (question.id === "type-projet") {
        if (option.value === "site-vitrine") icon = <Monitor className="h-5 w-5" />;
        if (option.value === "ecommerce") icon = <ShoppingBag className="h-5 w-5" />;
        if (option.value === "application-web") icon = <Layout className="h-5 w-5" />;
        if (option.value === "app-mobile") icon = <Smartphone className="h-5 w-5" />;
        if (option.value === "refonte") icon = <RefreshCcw className="h-5 w-5" />;
      }

      if (question.id === "fonctionnalites") {
        icon = <Layers className="h-5 w-5" />;
      }

      if (question.id === "multi-lang") {
        icon = <Globe2 className="h-5 w-5" />;
      }

      if (question.id === "tool-connections") {
        if (option.value === "crm") icon = <Database className="h-5 w-5" />;
        if (option.value === "emailing") icon = <Link2 className="h-5 w-5" />;
        if (option.value === "paiement") icon = <ShieldCheck className="h-5 w-5" />;
        if (option.value === "logistique") icon = <ServerCog className="h-5 w-5" />;
        if (option.value === "agenda") icon = <CalendarClock className="h-5 w-5" />;
        if (option.value === "notion-erp") icon = <Database className="h-5 w-5" />;
      }

      if (question.id === "mobile-features") {
        if (option.value === "paiement") icon = <ShieldCheck className="h-5 w-5" />;
        if (option.value === "notifications-push") icon = <Bell className="h-5 w-5" />;
        if (option.value === "geolocalisation") icon = <MapPin className="h-5 w-5" />;
        if (option.value === "chat") icon = <MessageCircle className="h-5 w-5" />;
        if (option.value === "upload-media") icon = <ImageIcon className="h-5 w-5" />;
        if (option.value === "reservation") icon = <CalendarClock className="h-5 w-5" />;
      }

      if (question.id === "mobile-backoffice") {
        icon = <ServerCog className="h-5 w-5" />;
      }

      if (question.id === "mobile-offline") {
        icon = <WifiOff className="h-5 w-5" />;
      }

      if (question.id === "mobile-design") {
        icon = <Palette className="h-5 w-5" />;
      }

      if (question.id === "mobile-analytics") {
        icon = <LineChart className="h-5 w-5" />;
      }

      if (question.id === "mobile-post-launch") {
        icon = <Rocket className="h-5 w-5" />;
      }

      return { ...option, icon };
    });
  };

  const renderInput = () => {
    switch (question.type) {
      case "radio":
        return (
          <ChoiceCardGroup
            options={mapOptionIcons() ?? []}
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

      case "multi-select": {
        const selectedValues = value ? value.split(",") : [];
        return (
          <ChoiceCardGroup
            options={mapOptionIcons() ?? []}
            value={selectedValues.join(",")}
            onChange={handleMultiSelectChange}
            multiple
          />
        );
      }

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
