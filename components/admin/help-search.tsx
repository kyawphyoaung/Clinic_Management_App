"use client";

import { useMemo, useState } from "react";
import { HELP_TOPICS } from "@/lib/constants/help-topics";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HelpSearch() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HELP_TOPICS;
    return HELP_TOPICS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.includes(q)) ||
        t.explanation.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="space-y-4">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a feature, e.g. Charges"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matching topics.</p>
        ) : (
          results.map((topic) => (
            <Card key={topic.id}>
              <CardHeader>
                <CardTitle className="text-base">{topic.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{topic.explanation}</p>
                <p className="text-muted-foreground">How to get there:</p>
                <ul className="list-disc space-y-1 pl-5">
                  {topic.paths.map((path) => (
                    <li key={path}>{path}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
