import Link from "next/link";
import type { Metadata } from "next";
import { getAgents } from "@/lib/actions/agents";
import { ShareLinkButton } from "@/components/admin/share-link-button";
import { CopyRegistrationLinkButton } from "@/components/admin/copy-registration-link-button";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SimplePaginationBar } from "@/components/admin/simple-pagination";
import { paginateItems } from "@/lib/utils/paginate";

export const metadata: Metadata = {
  title: "Agents List",
};

type PageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function AgentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const agents = await getAgents();
  const { pageItems, total, totalPages, page, pageSize } = paginateItems(
    agents,
    Number(params.page) || 1,
    Number(params.pageSize) || 20
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agents</h1>
          <p className="text-sm text-muted-foreground">
            Manage referral agents and copy partner referral links
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <CopyRegistrationLinkButton
            path="/partner/register"
            label="Copy Partner Registration Link"
            successMessage="Partner registration link copied to clipboard!"
          />
          <Button
            className="w-full sm:w-auto"
            render={<Link href="/dashboard/agents/new" />}
          >
            Digitize Registration
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent List</CardTitle>
          <CardDescription>
            {total} agent{total !== 1 ? "s" : ""} registered
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveList
            table={
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Patients</TableHead>
                    <TableHead>Referral Link</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No agents registered yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-mono text-xs">
                          {agent.partnerId ?? "—"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {agent.fullName}
                        </TableCell>
                        <TableCell>{agent.companyName ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{agent.status}</Badge>
                        </TableCell>
                        <TableCell>{agent._count.patients}</TableCell>
                        <TableCell>
                          <ShareLinkButton partnerId={agent.partnerId} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            render={
                              <Link href={`/dashboard/agents/${agent.id}`} />
                            }
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            }
            cards={
              <div className="space-y-3 p-4">
                {pageItems.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No agents registered yet
                  </p>
                ) : (
                  pageItems.map((agent) => (
                    <Card key={agent.id} className="shadow-sm">
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-mono text-xs text-muted-foreground">
                            {agent.partnerId ?? "—"}
                          </p>
                          <Badge variant="secondary">{agent.status}</Badge>
                        </div>
                        <p className="font-medium">{agent.fullName}</p>
                        <MobileField label="Company">
                          {agent.companyName ?? "—"}
                        </MobileField>
                        <MobileField label="Patients">
                          {agent._count.patients}
                        </MobileField>
                        <div className="pt-1">
                          <ShareLinkButton partnerId={agent.partnerId} />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          render={
                            <Link href={`/dashboard/agents/${agent.id}`} />
                          }
                        >
                          View
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            }
          />
          <SimplePaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            basePath="/dashboard/agents"
            query={{ pageSize: String(pageSize) }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
