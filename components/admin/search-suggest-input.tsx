"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SearchSuggestion = {
  id: string;
  label: string;
  matchType: string;
  href?: string;
  searchValue: string;
};

type SearchSuggestInputProps = {
  id?: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  suggest: (query: string) => Promise<SearchSuggestion[]>;
  minChars?: number;
};

export function SearchSuggestInput({
  id,
  name,
  defaultValue = "",
  placeholder = "Search...",
  className,
  suggest,
  minChars = 1,
}: SearchSuggestInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-suggestions`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [, startTransition] = useTransition();
  const requestId = useRef(0);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    const q = value.trim();
    if (q.length < minChars) {
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    const currentRequest = ++requestId.current;
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        try {
          const results = await suggest(q);
          if (currentRequest !== requestId.current) return;
          setSuggestions(results);
          setOpen(results.length > 0);
          setActiveIndex(-1);
        } catch {
          if (currentRequest !== requestId.current) return;
          setSuggestions([]);
          setOpen(false);
        }
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [value, suggest, minChars]);

  function applySuggestion(item: SearchSuggestion) {
    setValue(item.searchValue);
    setOpen(false);
    setActiveIndex(-1);
    if (item.href) {
      window.location.assign(item.href);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      applySuggestion(suggestions[activeIndex]!);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        id={inputId}
        name={name}
        value={value}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        role="combobox"
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-popover p-1 text-sm shadow-md"
        >
          {suggestions.map((item, index) => (
            <li key={`${item.id}-${item.matchType}-${item.searchValue}`} role="option">
              <button
                type="button"
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-sm px-2 py-1.5 text-left hover:bg-accent",
                  index === activeIndex && "bg-accent"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applySuggestion(item)}
              >
                <span className="font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">
                  {item.matchType}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
