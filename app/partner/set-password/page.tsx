import { PartnerSetPasswordForm } from "@/components/registration/partner-set-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function PartnerSetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  return (
    <main className="container mx-auto max-w-[100vw] overflow-x-hidden px-3 py-8 sm:px-4 sm:py-10">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Set Partner Password</CardTitle>
        </CardHeader>
        <CardContent>
          {token ? (
            <PartnerSetPasswordForm token={token} />
          ) : (
            <p className="text-sm text-destructive">Invalid token.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
