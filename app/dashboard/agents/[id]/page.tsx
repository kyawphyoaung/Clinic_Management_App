import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAgentByIdForAdmin } from "@/lib/actions/agents";
import { AgentApprovalActions } from "@/components/admin/agent-approval-actions";
import { AgentPasswordResetButton } from "@/components/admin/agent-password-reset-button";
import { AgentDemographics } from "@/components/admin/agent-demographics";
import { EncryptedFieldView } from "@/components/admin/encrypted-field-view";
import { MonthlyCommissionTable } from "@/components/admin/monthly-commission-table";
import { getMonthlyCommissionsForAgent } from "@/lib/actions/commission-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const agent = await getAgentByIdForAdmin(id);
  return {
    title: agent ? `${agent.fullName} - Partner` : "Partner",
  };
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const agent = await getAgentByIdForAdmin(id);
  if (!agent) notFound();

  const monthlyCommissions = await getMonthlyCommissionsForAgent(id);

  const accountCreated = Boolean(agent.passwordHash);

  const registeredSections = [
    {
      title: "Section A - Applicant Information",
      fields: [
        { label: "Full Name", value: agent.fullName },
        { label: "Company Name", value: agent.companyName ?? "—" },
        { label: "Job Title", value: agent.jobTitle ?? "—" },
        { label: "Date of Birth", value: agent.dateOfBirth?.toLocaleDateString() ?? "—" },
        { label: "Country of Residence", value: agent.countryOfResidence ?? "—" },
        { label: "Contact Address", value: "", encryptedKey: "businessAddress" },
        { label: "Mobile Number", value: "", encryptedKey: "mobileNumber" },
        { label: "WhatsApp", value: "", encryptedKey: "whatsapp" },
        { label: "LINE ID", value: "", encryptedKey: "lineId" },
        { label: "Email", value: agent.email },
        { label: "Website", value: agent.website ?? "—" },
        { label: "Facebook", value: agent.socialFacebook ?? "—" },
        { label: "Instagram", value: agent.socialInstagram ?? "—" },
        { label: "LinkedIn", value: agent.socialLinkedin ?? "—" },
        { label: "Other Social", value: agent.socialOther ?? "—" },
      ],
    },
    {
      title: "Section B - Business Profile",
      fields: [
        { label: "Business Type", value: agent.businessType.join(", ") || "—" },
        { label: "Business Type Other", value: agent.businessTypeOther ?? "—" },
        { label: "Years in Business", value: agent.yearsInBusiness ?? "—" },
        { label: "Monthly Clients", value: agent.monthlyClients ?? "—" },
      ],
    },
    {
      title: "Section C - Referral Information",
      fields: [
        { label: "Referral Services", value: agent.referralServices.join(", ") || "—" },
        { label: "Referral Services Other", value: agent.referralServicesOther ?? "—" },
        {
          label: "Patient Origin Countries",
          value: agent.patientOriginCountries.join(", ") || "—",
        },
        { label: "Patient Origin Other", value: agent.patientOriginOther ?? "—" },
        {
          label: "Estimated Monthly Referrals",
          value: agent.estimatedMonthlyReferrals ?? "—",
        },
      ],
    },
    {
      title: "Section D - Professional Standards",
      fields: [
        {
          label: "No Medical Advice",
          value: agent.confirmNoMedicalAdvice ? "Yes" : "No",
        },
        {
          label: "Custom Package Prices",
          value: agent.confirmCustomPackagePrices ? "Yes" : "No",
        },
        {
          label: "No Outcome Guarantees",
          value: agent.confirmNoOutcomeGuarantees ? "Yes" : "No",
        },
        {
          label: "Patient Privacy",
          value: agent.confirmPatientPrivacy ? "Yes" : "No",
        },
        { label: "Compliance", value: agent.confirmCompliance ? "Yes" : "No" },
      ],
    },
    {
      title: "Section E - Supporting Documents",
      fields: [
        {
          label: "Supporting Documents",
          value: agent.supportingDocuments.join(", ") || "—",
        },
      ],
    },
    {
      title: "Section F - Declaration",
      fields: [
        {
          label: "Commission Tier Preference",
          value: agent.commissionTierPreference ?? "—",
        },
        { label: "Remarks", value: agent.remarks ?? "—" },
        {
          label: "Use Master Signature",
          value: agent.useMasterSignature ? "Yes" : "No",
        },
        {
          label: "Accurate Info",
          value: agent.declarationAccurateInfo ? "Yes" : "No",
        },
        {
          label: "No Guarantee Approval",
          value: agent.declarationNoGuaranteeApproval ? "Yes" : "No",
        },
        {
          label: "Compliance Agreement",
          value: agent.declarationComplianceAgreement ? "Yes" : "No",
        },
        { label: "Applicant Name", value: agent.applicantName ?? "—" },
        {
          label: "Signature Date",
          value: agent.signatureDate?.toLocaleDateString() ?? "—",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" render={<Link href="/dashboard/agents" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{agent.fullName}</h1>
          <p className="text-sm text-muted-foreground">Partner ID: {agent.partnerId ?? "—"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{agent.status}</Badge>
          {accountCreated ? (
            <Badge className="bg-success text-success-foreground">Account Created</Badge>
          ) : (
            <Badge className="bg-destructive text-destructive-foreground">
              Not Created Yet
            </Badge>
          )}
        </div>
      </div>

      {agent.status === "PENDING" && <AgentApprovalActions agentId={agent.id} />}
      {agent.status === "ACTIVE" && <AgentPasswordResetButton agentId={agent.id} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <div>Company: {agent.companyName ?? "—"}</div>
          <div>Email: {agent.email}</div>
          <div className="flex items-center gap-2">
            <span>Phone:</span>
            <EncryptedFieldView
              endpoint={`/api/agents/${agent.id}/decrypt?field=mobileNumber`}
            />
          </div>
          <div>Country: {agent.countryOfResidence ?? "—"}</div>
          <div>Approved At: {agent.approvedAt?.toLocaleString() ?? "—"}</div>
          <div>Approved By: {agent.approvedBy ?? "—"}</div>
        </CardContent>
      </Card>

      <AgentDemographics agentId={agent.id} sections={registeredSections} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Referred Patients</CardTitle>
          <CardDescription>{agent.patients.length} patient(s)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display ID</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Treatments</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agent.patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No referred patients yet
                  </TableCell>
                </TableRow>
              ) : (
                agent.patients.map((patient) => {
                  const diagnoses = patient.treatments
                    .map((t) => t.diagnosis?.trim())
                    .filter((d): d is string => Boolean(d));
                  return (
                    <TableRow key={patient.id}>
                      <TableCell className="font-mono text-xs">
                        {patient.patientNumber ?? patient.displayId}
                      </TableCell>
                      <TableCell>{patient.fullName}</TableCell>
                      <TableCell>{patient.countryOfResidence ?? "—"}</TableCell>
                      <TableCell>{patient.status}</TableCell>
                      <TableCell>
                        {diagnoses.length > 0 ? diagnoses.join(", ") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          render={
                            <Link href={`/dashboard/patients/${patient.id}`} />
                          }
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commission Detail</CardTitle>
          <CardDescription>
            Monthly batch view — review and pay commissions by month
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <MonthlyCommissionTable rows={monthlyCommissions} />
        </CardContent>
      </Card>
    </div>
  );
}
