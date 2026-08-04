import type { Metadata } from "next";
import Link from "next/link";
import { getSurveyResponses } from "@/lib/actions/surveys-admin";
import { QUESTIONNAIRES } from "@/lib/constants/questionnaires";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimplePaginationBar } from "@/components/admin/simple-pagination";
import { paginateItems } from "@/lib/utils/paginate";

export const metadata: Metadata = {
  title: "Surveys",
};

type PageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function SurveysPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const surveys = await getSurveyResponses();
  const { pageItems, total, totalPages, page, pageSize } = paginateItems(
    surveys,
    Number(params.page) || 1,
    Number(params.pageSize) || 20
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Surveys</h1>
        <p className="text-sm text-muted-foreground">
          {total} submitted survey{total !== 1 ? "s" : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Survey Responses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveList
            table={
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Survey Type</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No survey responses yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((survey) => {
                      const title =
                        QUESTIONNAIRES[survey.formType]?.title.en ??
                        survey.formType;
                      return (
                        <TableRow key={survey.id}>
                          <TableCell>
                            <Link
                              href={`/dashboard/patients/${survey.patient.id}`}
                              className="font-medium underline-offset-2 hover:underline"
                            >
                              {survey.patient.fullName}
                            </Link>
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({survey.patient.displayId})
                            </span>
                          </TableCell>
                          <TableCell>{title}</TableCell>
                          <TableCell>
                            {survey.createdAt.toLocaleString()}
                          </TableCell>
                          <TableCell className="uppercase">
                            {survey.language}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              render={
                                <Link href={`/dashboard/surveys/${survey.id}`} />
                              }
                            >
                              View Answers
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            }
            cards={
              <div className="space-y-3 p-4">
                {pageItems.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No survey responses yet
                  </p>
                ) : (
                  pageItems.map((survey) => {
                    const title =
                      QUESTIONNAIRES[survey.formType]?.title.en ??
                      survey.formType;
                    return (
                      <Card key={survey.id} className="shadow-sm">
                        <CardContent className="space-y-2 p-4">
                          <p className="font-medium">
                            <Link
                              href={`/dashboard/patients/${survey.patient.id}`}
                              className="underline-offset-2 hover:underline"
                            >
                              {survey.patient.fullName}
                            </Link>
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {survey.patient.displayId}
                          </p>
                          <MobileField label="Survey">{title}</MobileField>
                          <MobileField label="Submitted">
                            {survey.createdAt.toLocaleString()}
                          </MobileField>
                          <MobileField label="Language">
                            <span className="uppercase">{survey.language}</span>
                          </MobileField>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            render={
                              <Link href={`/dashboard/surveys/${survey.id}`} />
                            }
                          >
                            View Answers
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            }
          />
          <SimplePaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            basePath="/dashboard/surveys"
            query={{ pageSize: String(pageSize) }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
