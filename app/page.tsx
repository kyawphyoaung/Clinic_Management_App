import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { QUESTIONNAIRES } from "@/lib/constants/questionnaires";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FORM_SHORT_NAMES: Record<string, string> = {
  ehs_v1: "EHS",
  ipss_v1: "IPSS",
  adam_v1: "ADAM",
  pedt_v1: "PEDT",
  utisa_v1: "UTISA",
  oabss_v1: "OABSS",
  iciq_v1: "ICIQ",
  nih_cpsi_v1: "NIH-CPSI",
  puf_v1: "PUF",
};

export default function HomePage() {
  const forms = Object.values(QUESTIONNAIRES);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-6">
          <ClipboardList className="size-7 text-primary" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Clinical Survey Forms
            </h1>
            <p className="text-sm text-muted-foreground">
              Select a questionnaire to begin your assessment
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Link key={form.id} href={`/survey/${form.id}`} className="group">
              <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/30">
                <CardHeader>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">
                    {FORM_SHORT_NAMES[form.id] ?? form.id}
                  </div>
                  <CardTitle className="text-base leading-snug group-hover:text-primary">
                    {form.title.en}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {form.questions.length} question
                    {form.questions.length !== 1 ? "s" : ""} · English, Myanmar,
                    Chinese
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Urology Clinic Clinical Assessment Portal
      </footer>
    </div>
  );
}
