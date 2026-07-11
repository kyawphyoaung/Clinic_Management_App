import { getAgents } from "@/lib/actions/agents";
import { AgentForm } from "@/components/admin/agent-form";
import { ShareLinkButton } from "@/components/admin/share-link-button";
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

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Agents</h1>
        <p className="text-sm text-muted-foreground">
          Manage referral agents and share read-only tracking links
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Agent</CardTitle>
          <CardDescription>
            Create an agent profile to link referred patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgentForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent List</CardTitle>
          <CardDescription>
            {agents.length} agent{agents.length !== 1 ? "s" : ""} registered
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Patients</TableHead>
                <TableHead>Share Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No agents registered yet
                  </TableCell>
                </TableRow>
              ) : (
                agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell>{agent.phone ?? "—"}</TableCell>
                    <TableCell>{agent._count.patients}</TableCell>
                    <TableCell>
                      <ShareLinkButton shareToken={agent.shareToken} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
