import { DoctorResetPasswordForm } from "@/components/admin/doctor-reset-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  return (
    <main className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
        </CardHeader>
        <CardContent>
          {token ? (
            <DoctorResetPasswordForm token={token} />
          ) : (
            <p className="text-sm text-destructive">Invalid token.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
