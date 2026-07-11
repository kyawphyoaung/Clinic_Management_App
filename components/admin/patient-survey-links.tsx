import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { QUESTIONNAIRES } from "@/lib/constants/questionnaires";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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

type PatientSurveyLinksProps = {
  patientId: string;
};

export function PatientSurveyLinks({ patientId }: PatientSurveyLinksProps) {
  const forms = Object.values(QUESTIONNAIRES);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pre-registered Survey Links</CardTitle>
        <CardDescription>
          Share these links with the patient. Demographics are skipped because
          the patient is already registered.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {forms.map((form) => (
          <Button
            key={form.id}
            variant="outline"
            size="sm"
            className="justify-between"
            render={
              <Link
                href={`/survey/${form.id}?patientId=${patientId}`}
                target="_blank"
              />
            }
          >
            <span>{FORM_SHORT_NAMES[form.id] ?? form.id}</span>
            <ExternalLink className="size-3 opacity-60" />
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
