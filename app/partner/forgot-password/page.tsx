import { PartnerForgotPasswordForm } from "@/components/registration/partner-forgot-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerForgotPasswordPage() {
  return (
    <main className="container mx-auto max-w-[100vw] overflow-x-hidden px-3 py-8 sm:px-4 sm:py-10">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          <PartnerForgotPasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
