"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createPublicAppointment,
  createAppointmentViaPatientLink,
} from "@/lib/actions/appointments";
import { WeekSlotPicker } from "@/components/appointments/week-slot-picker";
import {
  CLINIC,
  type BookLang,
  formatStableTaiwanDateTime,
  getBookDict,
} from "@/lib/book-i18n";

type Doctor = {
  id: string;
  fullName: string;
  specializations: { specialization: { id: string; name: string } }[];
  weeklyAvailability: {
    dayOfWeek: number;
    startTime: number;
    endTime: number;
  }[];
};
type Service = { id: string; name: string; description: string | null };
type Prefill = {
  fullName: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  email?: string | null;
};

export type ExistingUpcoming = {
  publicId: string;
  startsAt: string;
  service: string;
  doctorName: string;
  patientName: string;
  patientFacingId: string;
};

type Props = {
  doctors: Doctor[];
  services: Service[];
  mode: "public" | "patient";
  patientToken?: string;
  prefill?: Prefill;
  existingUpcoming?: ExistingUpcoming | null;
};

type Confirmation = {
  publicId: string;
  startsAt: string;
  service: string;
  doctorName: string;
  patientName: string;
  patientFacingId: string;
};

const fieldClass =
  "border-[#c9a84c]/30 bg-[#0f0f1a] text-[#f0e6d0] placeholder:text-[#f0e6d0]/40";

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        selected
          ? "border-[#c9a84c] bg-[#c9a84c] text-[#0f0f1a]"
          : "border-[#c9a84c]/35 bg-[#0f0f1a] text-[#f0e6d0] hover:border-[#c9a84c]/70"
      }`}
    >
      {children}
    </button>
  );
}

function ReqLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <Label className="text-[#f0e6d0]">
      {children}
      {required && <span className="ml-0.5 text-red-400">*</span>}
    </Label>
  );
}

function ConfirmationCard({
  confirmation,
  t,
}: {
  confirmation: Confirmation;
  t: ReturnType<typeof getBookDict>;
}) {
  const [saving, setSaving] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(confirmation.publicId, {
      width: 280,
      margin: 1,
      color: { dark: "#0f0f1a", light: "#f0e6d0" },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [confirmation.publicId]);

  async function saveToGallery() {
    setSaving(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a6" });
      doc.setFillColor(15, 15, 26);
      doc.rect(0, 0, 105, 148, "F");
      doc.setTextColor(201, 168, 76);
      doc.setFontSize(14);
      doc.text(CLINIC.name, 10, 14);
      doc.setFontSize(12);
      doc.text(t.confirmTitle, 10, 22);
      doc.setTextColor(240, 230, 208);
      doc.setFontSize(9);
      let y = 30;
      const lines: [string, string][] = [
        [t.confirmPatientName, confirmation.patientName],
        [t.confirmPatientId, confirmation.patientFacingId],
        [t.confirmId, confirmation.publicId],
        ["When", `${formatStableTaiwanDateTime(confirmation.startsAt)} (Taiwan)`],
        ["Doctor", confirmation.doctorName],
        ["Service", confirmation.service],
      ];
      for (const [label, value] of lines) {
        doc.setTextColor(201, 168, 76);
        doc.text(label, 10, y);
        doc.setTextColor(240, 230, 208);
        const wrapped = doc.splitTextToSize(value, 55);
        doc.text(wrapped, 10, y + 4);
        y += 4 + wrapped.length * 4 + 2;
      }
      const qrUrl =
        qrDataUrl ??
        (await QRCode.toDataURL(confirmation.publicId, {
          width: 280,
          margin: 1,
        }));
      doc.addImage(qrUrl, "PNG", 68, 28, 28, 28);
      doc.setTextColor(201, 168, 76);
      doc.setFontSize(8);
      doc.text(CLINIC.address, 10, Math.min(y + 6, 130), { maxWidth: 85 });
      doc.save(`appointment-${confirmation.publicId}.pdf`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-4 rounded-xl border border-[#c9a84c]/40 bg-[#16213e] p-6 text-[#f0e6d0]">
      <h2 className="text-2xl font-semibold text-[#c9a84c]">{t.confirmTitle}</h2>
      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 flex-1 space-y-2 text-sm">
          <p>
            {t.confirmPatientName}:{" "}
            <span className="font-medium">{confirmation.patientName}</span>
          </p>
          <p>
            {t.confirmPatientId}:{" "}
            <span className="font-mono font-bold">{confirmation.patientFacingId}</span>
          </p>
          <p className="text-lg">
            {t.confirmId}:{" "}
            <span className="font-mono font-bold">{confirmation.publicId}</span>
          </p>
          <p>{formatStableTaiwanDateTime(confirmation.startsAt)} (Taiwan)</p>
          <p>{confirmation.doctorName}</p>
          <p>{confirmation.service}</p>
        </div>
        {qrDataUrl && (
          <div className="shrink-0 rounded-lg border border-[#c9a84c]/40 bg-[#f0e6d0] p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`QR ${confirmation.publicId}`}
              className="size-36"
            />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p className="font-medium text-[#c9a84c]">{CLINIC.name}</p>
        <p className="text-sm">{CLINIC.address}</p>
        <iframe
          title={t.mapsLabel}
          src={CLINIC.mapsEmbed}
          className="h-48 w-full rounded-md border border-[#c9a84c]/30"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="space-y-1 text-sm">
        <p className="font-medium">{t.contactUs}</p>
        <p>
          Line:{" "}
          <a
            href={CLINIC.lineUrl}
            className="text-[#c9a84c] underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {CLINIC.lineUrl}
          </a>
        </p>
        <p>
          Email:{" "}
          <a
            href={`mailto:${CLINIC.email}`}
            className="text-[#c9a84c] underline-offset-2 hover:underline"
          >
            {CLINIC.email}
          </a>
        </p>
      </div>
      <p className="text-sm text-[#f0e6d0]/80">{t.cancelNote}</p>
      <p className="text-sm font-medium">{t.arriveOnTime}</p>
      <p className="rounded-md border border-[#c9a84c]/40 bg-[#0f0f1a]/60 px-3 py-2 text-sm text-[#c9a84c]">
        {t.saveWarning}
      </p>
      <Button
        type="button"
        onClick={saveToGallery}
        disabled={saving}
        className="w-full bg-[#c9a84c] text-[#0f0f1a] hover:bg-[#c9a84c]/90 sm:w-auto"
      >
        {saving ? "…" : t.saveToGallery}
      </Button>
    </div>
  );
}

export function PublicBookingForm({
  doctors,
  services,
  mode,
  patientToken,
  prefill,
  existingUpcoming = null,
}: Props) {
  const [lang, setLang] = useState<BookLang>("en");
  const t = getBookDict(lang);
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [selectedService, setSelectedService] = useState(
    services[0]?.name ?? ""
  );
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [date, setDate] = useState("");
  const [slotMinutes, setSlotMinutes] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [showFormDespiteUpcoming, setShowFormDespiteUpcoming] = useState(false);
  const [keepExisting, setKeepExisting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (doctors.length && !doctorId) setDoctorId(doctors[0]!.id);
  }, [doctors, doctorId]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!doctorId) {
      setError("Select a doctor");
      return;
    }
    if (!selectedService) {
      setError("Select a service");
      return;
    }
    if (!date || slotMinutes === "") {
      setError("Select date and time");
      return;
    }
    const form = new FormData(e.currentTarget);
    const service = selectedService;
    setError(null);

    startTransition(async () => {
      if (mode === "patient" && patientToken) {
        const result = await createAppointmentViaPatientLink({
          patientToken,
          doctorId,
          date,
          slotMinutes,
          service,
          notes: String(form.get("notes") ?? ""),
          preferredLanguage,
        });
        if (!result.success) {
          setError(result.error);
          return;
        }
        setConfirmation({
          publicId: result.publicId,
          startsAt: result.startsAt,
          service: result.service,
          doctorName: result.doctorName,
          patientName: result.patientName,
          patientFacingId: result.patientFacingId,
        });
        return;
      }

      const result = await createPublicAppointment({
        fullName: String(form.get("fullName") ?? ""),
        dateOfBirth: String(form.get("dateOfBirth") ?? ""),
        gender: String(form.get("gender") ?? ""),
        phone: String(form.get("phone") ?? ""),
        email: String(form.get("email") ?? ""),
        preferredLanguage,
        notes: String(form.get("notes") ?? ""),
        referralCode: String(form.get("referralCode") ?? ""),
        service,
        doctorId,
        date,
        slotMinutes,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setConfirmation({
        publicId: result.publicId,
        startsAt: result.startsAt,
        service: result.service,
        doctorName: result.doctorName,
        patientName: result.patientName,
        patientFacingId: result.patientFacingId,
      });
    });
  }

  if (confirmation || keepExisting) {
    const card = confirmation ?? existingUpcoming!;
    return <ConfirmationCard confirmation={card} t={t} />;
  }

  if (existingUpcoming && !showFormDespiteUpcoming) {
    return (
      <div className="w-full space-y-4 rounded-xl border border-[#c9a84c]/40 bg-[#16213e] p-6 text-[#f0e6d0]">
        <div className="flex justify-end">
          <select
            className={`h-8 rounded-md border px-2 text-sm ${fieldClass}`}
            value={lang}
            onChange={(e) => setLang(e.target.value as BookLang)}
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </div>
        <h2 className="text-xl font-semibold text-[#c9a84c]">
          {t.upcomingSummary}
        </h2>
        <div className="space-y-1 text-sm">
          <p>
            {t.confirmPatientName}: {existingUpcoming.patientName}
          </p>
          <p>
            {t.confirmPatientId}:{" "}
            <span className="font-mono">{existingUpcoming.patientFacingId}</span>
          </p>
          <p>
            {t.confirmId}:{" "}
            <span className="font-mono">{existingUpcoming.publicId}</span>
          </p>
          <p>{formatStableTaiwanDateTime(existingUpcoming.startsAt)} (Taiwan)</p>
          <p>{existingUpcoming.doctorName}</p>
          <p>{existingUpcoming.service}</p>
        </div>
        <p className="text-sm">{t.bookAnother}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="bg-[#c9a84c] text-[#0f0f1a] hover:bg-[#c9a84c]/90"
            onClick={() => setShowFormDespiteUpcoming(true)}
          >
            {t.bookAnotherYes}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-[#c9a84c]/50 text-[#f0e6d0]"
            onClick={() => setKeepExisting(true)}
          >
            {t.bookAnotherNo}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs tracking-[0.2em] text-[#c9a84c] uppercase">
          {CLINIC.name}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#f0e6d0]/70">{t.language}</span>
          <select
            className={`h-8 rounded-md border px-2 text-sm ${fieldClass}`}
            value={lang}
            onChange={(e) => setLang(e.target.value as BookLang)}
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-[#c9a84c]/30 bg-[#0f0f1a]/50 p-3">
        <iframe
          title={t.mapsLabel}
          src={CLINIC.mapsEmbed}
          className="h-40 w-full rounded-md border border-[#c9a84c]/20"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <p className="text-sm text-[#f0e6d0]">{CLINIC.address}</p>
        <a
          href={CLINIC.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[#c9a84c] underline-offset-2 hover:underline"
        >
          Google Maps
        </a>
      </div>

      {mode === "public" ? (
        <>
          <div className="space-y-1.5">
            <ReqLabel required>{t.fullName}</ReqLabel>
            <Input name="fullName" required className={fieldClass} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <ReqLabel required>{t.dob}</ReqLabel>
              <Input
                name="dateOfBirth"
                type="date"
                required
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <ReqLabel required>{t.gender}</ReqLabel>
              <select
                name="gender"
                required
                className={`flex h-9 w-full rounded-md border px-3 text-sm ${fieldClass}`}
                defaultValue=""
              >
                <option value="" disabled>
                  —
                </option>
                <option value="male">{t.male}</option>
                <option value="female">{t.female}</option>
                <option value="other">{t.other}</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <ReqLabel required>{t.phone}</ReqLabel>
              <Input
                name="phone"
                type="tel"
                required
                placeholder="+886..."
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <ReqLabel required>{t.email}</ReqLabel>
              <Input name="email" type="email" required className={fieldClass} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#f0e6d0]">{t.referralCode}</Label>
            <Input name="referralCode" className={fieldClass} />
          </div>
        </>
      ) : (
        <div className="rounded-md border border-[#c9a84c]/30 bg-[#0f0f1a]/60 p-3 text-sm text-[#f0e6d0]">
          <p className="font-medium">{prefill?.fullName}</p>
          {prefill?.email && (
            <p className="text-[#f0e6d0]/70">{prefill.email}</p>
          )}
          <p className="mt-1 text-xs text-[#f0e6d0]/60">{t.prefilledHint}</p>
        </div>
      )}

      <div className="space-y-2">
        <ReqLabel>{t.preferredLanguage}</ReqLabel>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["English", t.english],
              ["Chinese", t.chinese],
              ["Burmese", t.burmese],
              ["Other", t.other],
            ] as const
          ).map(([value, label]) => (
            <Chip
              key={value}
              selected={preferredLanguage === value}
              onClick={() => setPreferredLanguage(value)}
            >
              {label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <ReqLabel required>{t.service}</ReqLabel>
        <div className="flex flex-wrap gap-2">
          {services.map((s) => (
            <Chip
              key={s.id}
              selected={selectedService === s.name}
              onClick={() => setSelectedService(s.name)}
            >
              {s.name}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <ReqLabel required>{t.doctor}</ReqLabel>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={scrollPrev}
            className="rounded-md border border-[#c9a84c]/30 px-2 py-1 text-xs text-[#f0e6d0]"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={scrollNext}
            className="rounded-md border border-[#c9a84c]/30 px-2 py-1 text-xs text-[#f0e6d0]"
          >
            Next
          </button>
        </div>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3">
            {doctors.map((d) => {
              const specs = d.specializations
                .map((x) => x.specialization.name)
                .join(", ");
              const selected = doctorId === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setDoctorId(d.id);
                    setSlotMinutes("");
                  }}
                  className={`min-w-[85%] shrink-0 rounded-xl border p-4 text-left transition sm:min-w-[45%] ${
                    selected
                      ? "border-[#c9a84c] bg-[#c9a84c]/15 ring-1 ring-[#c9a84c]"
                      : "border-[#c9a84c]/25 bg-[#0f0f1a]"
                  }`}
                >
                  <p className="font-semibold text-[#f0e6d0]">{d.fullName}</p>
                  <p className="mt-1 text-xs text-[#c9a84c]">{specs || "—"}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <ReqLabel required>{t.dateTime}</ReqLabel>
        <WeekSlotPicker
          doctorId={doctorId}
          date={date}
          slotMinutes={slotMinutes}
          onDateChange={setDate}
          onSlotChange={setSlotMinutes}
          accent="gold"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[#f0e6d0]">{t.notes}</Label>
        <Input name="notes" className={fieldClass} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button
        type="submit"
        disabled={isPending || doctors.length === 0}
        className="bg-[#c9a84c] text-[#0f0f1a] hover:bg-[#c9a84c]/90"
      >
        {isPending ? t.submitting : t.book}
      </Button>
    </form>
  );
}
