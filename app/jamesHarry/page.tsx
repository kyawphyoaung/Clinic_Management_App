import { LoginForm } from "@/components/admin/login-form";
import { Stethoscope } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Stethoscope className="size-10 text-primary" />
          <h1 className="text-2xl font-semibold">Clinic Management</h1>
          <p className="text-sm text-muted-foreground">Staff access only</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
