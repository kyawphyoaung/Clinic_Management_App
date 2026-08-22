import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string; paymentId: string }>;
};

/** Legacy receipt URL → invoice-style payment receipt. */
export default async function LegacyReceiptRedirect({ params }: PageProps) {
  const { id, paymentId } = await params;
  redirect(`/dashboard/treatments/${id}/payment-receipt/${paymentId}`);
}
