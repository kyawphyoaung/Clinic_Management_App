import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AgentRegistrationForm } from "@/components/registration/agent-registration-form";
import { Button } from "@/components/ui/button";

export default function StaffNewAgentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href="/dashboard/agents" />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Digitize Partner Registration</h1>
          <p className="text-sm text-muted-foreground">
            Staff-only form to enter a signed paper partner registration.
          </p>
        </div>
      </div>
      <AgentRegistrationForm mode="staff" />
    </div>
  );
}
