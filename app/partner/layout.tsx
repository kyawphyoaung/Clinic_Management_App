import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Partner Dashboard App",
    template: "%s | Partner Dashboard App",
  },
  description: "REVIVORA partner portal for referrals and commissions.",
};

export default function PartnerLayout({
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
