import { ShieldX } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SharedAgentNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <ShieldX className="mx-auto size-10 text-muted-foreground" />
          <CardTitle>Link Not Found</CardTitle>
          <CardDescription>
            This agent tracking link is invalid or has expired. Please contact
            your clinic representative for an updated link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            This page is read-only. No login is required.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
