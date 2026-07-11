import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SurveyNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <FileQuestion className="mx-auto size-10 text-muted-foreground" />
          <CardTitle>Form Not Found</CardTitle>
          <CardDescription>
            The requested clinical survey does not exist or may have been
            removed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/" />}>Back to Form Directory</Button>
        </CardContent>
      </Card>
    </div>
  );
}
