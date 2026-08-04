"use client";

import { Check } from "lucide-react";
import type { FormSection } from "@/lib/constants/form-types";
import { getSectionLetter, isSectionComplete } from "@/lib/utils/config-driven-form";
import { cn } from "@/lib/utils";

type SectionTabBarProps = {
  sections: FormSection[];
  activeIndex: number;
  values: Record<string, unknown>;
  errors: Record<string, unknown>;
  onTabClick: (index: number) => void;
};

export function SectionTabBar({
  sections,
  activeIndex,
  values,
  errors,
  onTabClick,
}: SectionTabBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sections.map((section, index) => {
        const letter = getSectionLetter(index);
        const isActive = index === activeIndex;
        const complete = isSectionComplete(section, values, errors);

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onTabClick(index)}
            className={cn(
              "flex size-10 items-center justify-center rounded-full border text-sm font-medium transition-colors",
              isActive &&
                "border-amber-400 bg-amber-400/10 text-amber-300 ring-2 ring-amber-400/40",
              !isActive && complete && "border-green-500/50 text-green-400",
              !isActive &&
                !complete &&
                "border-border text-muted-foreground hover:border-amber-400/40"
            )}
            aria-label={section.title.en}
            aria-current={isActive ? "step" : undefined}
          >
            {complete && !isActive ? (
              <Check className="size-4" />
            ) : (
              letter
            )}
          </button>
        );
      })}
    </div>
  );
}
