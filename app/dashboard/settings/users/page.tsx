import type { Metadata } from "next";
import { getUsers } from "@/lib/actions/users";
import { UsersManagement } from "@/components/admin/users-management";

export const metadata: Metadata = {
  title: "User Management",
};

export default async function UsersSettingsPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">User Management</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage Admin, Doctor, and Staff accounts
        </p>
      </div>
      <UsersManagement users={users} />
    </div>
  );
}
