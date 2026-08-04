import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Book an Appointment",
  },
};

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden">
      {children}
    </div>
  );
}
