import { NextResponse } from "next/server";
import { getAvailableSlotsForDate } from "@/lib/utils/appointment-slots";
import { minutesToTimeLabel } from "@/lib/utils/taiwan-time";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date");

  if (!doctorId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "doctorId and date (YYYY-MM-DD) are required" },
      { status: 400 }
    );
  }

  try {
    const slots = await getAvailableSlotsForDate(doctorId, date);
    return NextResponse.json({
      slots: slots.map((s) => ({
        startMinutes: s.startMinutes,
        label: s.label ?? minutesToTimeLabel(s.startMinutes),
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load slots" }, { status: 500 });
  }
}
