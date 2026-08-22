import type { Metadata } from "next";
import { HelpSearch } from "@/components/admin/help-search";

export const metadata: Metadata = { title: "Help" };

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Help</h1>
        <p className="text-sm text-muted-foreground">
          Search for a feature to see what it means and how to navigate there.
        </p>
      </div>
      <HelpSearch />
    </div>
  );
}
