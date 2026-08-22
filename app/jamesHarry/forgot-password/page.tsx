import { DoctorForgotPasswordForm } from "@/components/admin/doctor-forgot-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DoctorForgotPasswordPage() {
  return (
    <main className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Doctor password reset</CardTitle>
        </CardHeader>
        <CardContent>
          <DoctorForgotPasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
