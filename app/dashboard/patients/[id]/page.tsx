import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import {
  getAgentsForAssignment,
  getClinicsForSelect,
  getPatientById,
} from "@/lib/data/patients";
import { getTreatmentsForPatient } from "@/lib/actions/treatments";
import { getAppointmentsForPatient } from "@/lib/actions/appointments";
import { getVisitsForPatient } from "@/lib/data/visits";
import { getDoctorsForSelect } from "@/lib/actions/users";
import { requireAuth } from "@/lib/session";
import { canWriteTreatments, hasPermission } from "@/lib/permissions";
import { QUESTIONNAIRES } from "@/lib/constants/questionnaires";
import { calculateScore, getLocalizedResult } from "@/lib/utils/scoring";
import { formatMoney } from "@/lib/utils/money";
import type { SupportedLanguage } from "@/lib/constants/questionnaires";
import { PatientSource, PatientStatus } from "@/prisma/generated/prisma/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getPatientStatusLabel,
  StatusBadge,
} from "@/components/admin/status-badge";
import { TreatmentStatusBadge } from "@/components/admin/treatment-status-badge";
import { PatientConsents } from "@/components/admin/patient-consents";
import { PatientActionBar } from "@/components/admin/patient-action-bar";
import { PatientDemographics } from "@/components/admin/patient-demographics";
import { PatientSurveyGenerator } from "@/components/admin/patient-survey-generator";
import { DeletePatientButton } from "@/components/admin/delete-patient-button";
import { GenerateBookingLinkButton } from "@/components/admin/generate-booking-link-button";
import { TreatmentCreateModal } from "@/components/admin/treatment-create-modal";
import { PatientAppointmentsSection } from "@/components/admin/patient-appointments-section";
import { PatientDepositsSection } from "@/components/admin/patient-deposits-section";
import { PatientVisitsSection } from "@/components/admin/patient-visits-section";
import {
  getPatientDepositBalance,
  listPatientDeposits,
  listRequestedDeposits,
} from "@/lib/actions/deposits";
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
  const patient = await getPatientById(id);
  return {
    title: patient ? `${patient.fullName} - Patient` : "Patient",
  };
}

export default async function PatientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [patient, clinics, agents, treatments, doctors, session, appointments, deposits, requestedDeposits, depositBalance, visits] =
    await Promise.all([
      getPatientById(id),
      getClinicsForSelect(),
      getAgentsForAssignment(),
      getTreatmentsForPatient(id),
      getDoctorsForSelect(),
      requireAuth(),
      getAppointmentsForPatient(id),
      listPatientDeposits(id),
      listRequestedDeposits(id),
      getPatientDepositBalance(id),
      getVisitsForPatient(id),
    ]);

  if (!patient) {
    notFound();
  }

  const canWrite = canWriteTreatments(session.user.role);
  const canDelete = hasPermission(session.user.role, "patients:delete");

  const statusOptions = Object.values(PatientStatus).map((status) => ({
    value: status,
    label: getPatientStatusLabel(status),
  }));

  const sourceLabel =
    patient.source === PatientSource.WALKIN
      ? "Walk-in"
      : patient.source === PatientSource.AGENT
        ? "Agent Referral"
        : "Online Registration";
  const age =
    patient.dateOfBirth
      ? Math.max(
          0,
          new Date().getFullYear() - patient.dateOfBirth.getFullYear()
        ).toString()
      : "—";
  const telemedicineLanguageMap: Record<string, string> = {
    en: "English",
    mm: "Myanmar",
    zh: "Chinese",
  };

  const medicalRecords: string[] = [];
  if (patient.hasMedicalReports) medicalRecords.push("Medical Reports");
  if (patient.hasLabResults) medicalRecords.push("Lab Results");
  if (patient.hasImaging) medicalRecords.push("Imaging");
  if (patient.hasMedicationList) medicalRecords.push("Medication List");
  if (patient.hasReferralLetter) medicalRecords.push("Referral Letter");
  if (patient.hasSurgicalRecords) medicalRecords.push("Surgical Records");
  if (patient.hasOtherMedicalDocs) medicalRecords.push("Other Medical Docs");

  const latestPaperConsent = patient.consentLogs.find((log) => log.source === "PAPER");

  const demographicSections = [
    {
      title: "Section A - Personal Information",
      fields: [
        { label: "Full Name", value: patient.fullName },
        { label: "Preferred Name", value: patient.preferredName ?? "—" },
        {
          label: "Date of Birth",
          value: patient.dateOfBirth?.toLocaleDateString() ?? "—",
        },
        { label: "Age", value: age },
        { label: "Gender", value: patient.gender ?? "—" },
        { label: "Nationality", value: patient.nationality ?? "—" },
        {
          label: "Country of Residence",
          value: patient.countryOfResidence ?? "—",
        },
        { label: "Street Address", value: "", encryptedKey: "streetAddress" },
        { label: "City", value: "", encryptedKey: "city" },
        { label: "State / Province", value: "", encryptedKey: "stateProvince" },
        { label: "Postal Code", value: "", encryptedKey: "postalCode" },
        { label: "Phone Number", value: "", encryptedKey: "mobileNumber" },
        { label: "WhatsApp", value: "", encryptedKey: "whatsapp" },
        { label: "LINE ID", value: "", encryptedKey: "lineId" },
        { label: "Email", value: "", encryptedKey: "email" },
      ],
    },
    {
      title: "Section B - Passport Information",
      fields: [
        { label: "Nationality", value: patient.nationality ?? "—" },
        { label: "Country of Residence", value: patient.countryOfResidence ?? "—" },
        { label: "Passport Number", value: "", encryptedKey: "passportNumber" },
        {
          label: "Passport Expiry",
          value: patient.passportExpiry?.toLocaleDateString() ?? "—",
        },
      ],
    },
    {
      title: "Section C - Emergency Contact",
      fields: [
        { label: "Emergency Contact Name", value: "", encryptedKey: "emergencyName" },
        { label: "Emergency Relationship", value: patient.emergencyRelationship ?? "—" },
        { label: "Emergency Phone", value: "", encryptedKey: "emergencyPhone" },
        { label: "Emergency Email", value: "", encryptedKey: "emergencyEmail" },
      ],
    },
    {
      title: "Section D - Requested Medical Service",
      fields: [
        {
          label: "Requested Medical Service Category",
          value: patient.serviceCategory ?? "—",
        },
        {
          label: "Requested Medical Service",
          value: patient.medicalServices.join(", ") || "—",
        },
        ...(patient.medicalServicesOther
          ? [{ label: "Other Service", value: patient.medicalServicesOther }]
          : []),
      ],
    },
    {
      title: "Section E - Healthcare Information",
      fields: [
        { label: "Previous Treatment", value: patient.previousTreatment === "yes" ? "Yes" : "No" },
        { label: "Under Physician Care", value: patient.underPhysicianCare === "yes" ? "Yes" : "No" },
        ...(patient.physicianName ? [{ label: "Physician Name", value: patient.physicianName }] : []),
        ...(patient.physicianCountry ? [{ label: "Physician Country", value: patient.physicianCountry }] : []),
      ],
    },
    {
      title: "Section F - Medical Records",
      fields: [
        {
          label: "Medical Records",
          value: medicalRecords.length > 0 ? medicalRecords.join(", ") : "Nothing",
        },
      ],
    },
    {
      title: "Section G - Pre-treatment Telemedicine",
      fields:
        patient.wantTelemedicine === "yes"
          ? [
              { label: "Telemedicine", value: "Yes" },
              {
                label: "Telemedicine Language",
                value:
                  patient.telemedicineLanguage === "other"
                    ? patient.telemedicineOtherLanguage ?? "Other"
                    : telemedicineLanguageMap[patient.telemedicineLanguage ?? ""] ??
                      (patient.telemedicineLanguage ?? "—"),
              },
              {
                label: "Preferred Consultation Time",
                value: patient.preferredConsultationTime ?? "—",
              },
            ]
          : [{ label: "Telemedicine", value: "No" }],
    },
    {
      title: "Section H - Travel Information",
      fields: [
        {
          label: "Preferred Travel Month",
          value: patient.preferredTravelMonth
            ? new Date(`${patient.preferredTravelMonth}-01`).toLocaleDateString(
                undefined,
                { month: "long", year: "numeric" }
              )
            : "—",
        },
        { label: "Estimated Stay", value: patient.estimatedStay ?? "—" },
        {
          label: "Travel With Companion",
          value: patient.travelWithCompanion === "yes" ? "Yes" : "No",
        },
        ...(patient.travelWithCompanion === "yes"
          ? [
              {
                label: "Companion Count",
                value: patient.companionCount?.toString() ?? "—",
              },
            ]
          : []),
        {
          label: "Assistance Required",
          value: patient.assistanceRequired.join(", ") || "—",
        },
      ],
    },
    {
      title: "Section I - Referral Information",
      fields: [
        {
          label: "Referral Source",
          value:
            patient.referralSource === "other" && patient.referralSourceOther
              ? `Other (${patient.referralSourceOther})`
              : patient.referralSource ?? "—",
        },
        ...(patient.partnerName ? [{ label: "Partner Name", value: patient.partnerName }] : []),
        ...(patient.partnerId ? [{ label: "Partner ID", value: patient.partnerId }] : []),
      ],
    },
    {
      title: "Section J - Consent & Signature",
      fields: [
        { label: "Use Master Signature", value: patient.useMasterSignature ? "Yes" : "No" },
        { label: "Consent Info Accurate", value: patient.consentInfoAccurate ? "Yes" : "No" },
        {
          label: "Consent Treatment Understanding",
          value: patient.consentTreatmentUnderstanding ? "Yes" : "No",
        },
        {
          label: "Consent Comprehensive",
          value: patient.consentComprehensive ? "Yes" : "No",
        },
        {
          label: "Consent Date",
          value: patient.consentDate?.toLocaleDateString() ?? "—",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href="/dashboard/patients" />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{patient.fullName}</h1>
          <p className="text-sm text-muted-foreground">
            Patient ID: {patient.patientNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GenerateBookingLinkButton patientId={patient.id} />
          <Badge variant="secondary">{sourceLabel}</Badge>
        </div>
      </div>

      <PatientActionBar
        patientId={patient.id}
        currentStatus={patient.status}
        currentAgentId={patient.currentAgentId}
        agents={agents}
        statusOptions={statusOptions}
      />
      <details>
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground">Survey Links</summary>
        <div className="mt-3">
          <PatientSurveyGenerator patientId={patient.id} />
        </div>
      </details>

      <PatientDepositsSection
        patientId={patient.id}
        patientName={patient.fullName}
        patientCountry={patient.countryOfResidence ?? patient.nationality ?? undefined}
        deposits={deposits}
        requestedDeposits={requestedDeposits}
        treatments={treatments.map((t) => ({ id: t.id, shortId: t.shortId }))}
        balance={depositBalance}
        canWrite={hasPermission(session.user.role, "patients:write")}
      />

      <PatientAppointmentsSection
        appointments={appointments.map((a) => ({
          id: a.id,
          publicId: a.publicId,
          startsAt: a.startsAt.toISOString(),
          status: a.status,
          doctor: a.doctor,
        }))}
        patient={{
          id: patient.id,
          fullName: patient.fullName,
          displayId: patient.displayId,
        }}
        doctors={doctors}
        canWrite={hasPermission(session.user.role, "appointments:write")}
      />

      <PatientVisitsSection
        patientId={patient.id}
        visits={visits}
        clinics={clinics}
        agents={agents}
        doctors={doctors}
        patientTreatments={treatments.map((t) => ({
          id: t.id,
          shortId: t.shortId,
          visitId: t.visitId,
        }))}
        canWrite={hasPermission(session.user.role, "patients:write")}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Treatments</h2>
          {canWrite && (
            <TreatmentCreateModal
              patientId={patient.id}
              doctors={doctors}
              visits={visits.map((v) => ({
                id: v.id,
                displayId: v.displayId,
                visitDate: v.visitDate.toISOString().slice(0, 10),
              }))}
            />
          )}
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Treatment ID</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Charges</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No treatments yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    treatments.map((treatment) => {
                      const totalCharges = treatment.charges.reduce(
                        (sum, c) => sum + Number(c.netPrice),
                        0
                      );
                      const totalPaid = treatment.payments.reduce(
                        (sum, p) => sum + Number(p.amount),
                        0
                      );
                      const balance = totalCharges - totalPaid;
                      return (
                        <TableRow key={treatment.id}>
                          <TableCell className="font-mono text-xs">
                            {treatment.shortId}
                          </TableCell>
                          <TableCell>
                            {treatment.treatmentDate.toLocaleDateString()}
                          </TableCell>
                          <TableCell>{treatment.diagnosis ?? "—"}</TableCell>
                          <TableCell>
                            {treatment.doctor?.fullName ?? "—"}
                          </TableCell>
                          <TableCell>
                            <TreatmentStatusBadge status={treatment.status} />
                          </TableCell>
                          <TableCell>{formatMoney(totalCharges)}</TableCell>
                          <TableCell>{formatMoney(totalPaid)}</TableCell>
                          <TableCell>
                            {balance <= 0 ? (
                              <span className="inline-flex items-center gap-1 text-[#10b981]">
                                {formatMoney(0)} <Check className="size-3.5" />
                              </span>
                            ) : (
                              <span className="text-[#ef4444]">
                                {formatMoney(balance)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              render={
                                <Link
                                  href={`/dashboard/treatments/${treatment.id}?from=patient`}
                                />
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
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {treatments.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No treatments yet
                </p>
              ) : (
                treatments.map((treatment) => {
                  const totalCharges = treatment.charges.reduce(
                    (sum, c) => sum + Number(c.netPrice),
                    0
                  );
                  const totalPaid = treatment.payments.reduce(
                    (sum, p) => sum + Number(p.amount),
                    0
                  );
                  const balance = totalCharges - totalPaid;
                  return (
                    <Card key={treatment.id} className="shadow-sm">
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">
                            {treatment.diagnosis ?? "Treatment"}
                          </p>
                          <TreatmentStatusBadge status={treatment.status} />
                        </div>
                        <p className="font-mono text-xs text-muted-foreground">
                          {treatment.shortId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Start: {treatment.treatmentDate.toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Doctor: {treatment.doctor?.fullName ?? "—"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Charges: {formatMoney(totalCharges)} · Paid:{" "}
                          {formatMoney(totalPaid)}
                        </p>
                        <p className="text-sm">
                          Balance:{" "}
                          {balance <= 0 ? (
                            <span className="text-[#10b981]">
                              {formatMoney(0)}
                            </span>
                          ) : (
                            <span className="text-[#ef4444]">
                              {formatMoney(balance)}
                            </span>
                          )}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          render={
                            <Link
                              href={`/dashboard/treatments/${treatment.id}?from=patient`}
                            />
                          }
                        >
                          View
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <PatientDemographics
        patientId={patient.id}
        sections={demographicSections}
        signatureAvailable={Boolean(patient.signatureImageUrl)}
      />

      <details>
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground">Consents</summary>
        <div className="mt-3">
          <PatientConsents consentLogs={patient.consentLogs} />
        </div>
      </details>

      <details>
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground">Survey Results</summary>
        <div className="mt-3 space-y-4">
          {patient.surveys.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No survey responses yet</CardContent></Card>
          ) : (
            patient.surveys.map((survey) => {
            const questionnaire = QUESTIONNAIRES[survey.formType];
            const rawAnswers = survey.rawAnswers as Record<string, unknown>;
            const scoreResult = calculateScore(survey.formType, rawAnswers);
            const language = survey.language as SupportedLanguage;
            const localized = scoreResult
              ? getLocalizedResult(scoreResult, language)
              : null;

            return (
              <Card key={survey.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">
                        {questionnaire?.title.en ?? survey.formType}
                      </CardTitle>
                      <CardDescription>
                        Submitted {survey.createdAt.toLocaleString()} · Language:{" "}
                        {language.toUpperCase()}
                      </CardDescription>
                    </div>
                    {localized && (
                      <Badge variant="secondary">
                        Score: {localized.totalScore}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {localized ? (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Severity / Diagnosis
                        </p>
                        <p className="mt-1 font-medium">{localized.severity}</p>
                      </div>
                      {localized.clinicalNote && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Clinical Note
                          </p>
                          <p className="mt-1 text-sm">{localized.clinicalNote}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Unable to calculate score for this form type.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
            })
          )}
        </div>
      </details>

      <details>
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground">Registration Info</summary>
        <Card className="mt-3">
          <CardHeader>
            <CardTitle className="text-base">Registration Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Registered</span><span>{patient.createdAt.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Last Updated</span><span>{patient.updatedAt.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Surveys</span><span>{patient.surveys.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Consents</span><span>{patient.consentLogs.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Current Status</span><StatusBadge status={patient.status} label={getPatientStatusLabel(patient.status)} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{latestPaperConsent?.physicalLocation ?? "—"}</span></div>
          </CardContent>
        </Card>
      </details>

      {canDelete && <DeletePatientButton patientId={patient.id} />}
    </div>
  );
}
