"use client";

import { useState, useTransition } from "react";
import {
  createUser,
  resetUserPassword,
  setUserActive,
} from "@/lib/actions/users";
import type { UserRole } from "@/prisma/generated/prisma/enums";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

type UserRow = {
  id: string;
  username: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
};

type UsersManagementProps = {
  users: UserRow[];
};

export function UsersManagement({ users }: UsersManagementProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await createUser({
        username: String(formData.get("username") ?? ""),
        password: String(formData.get("password") ?? ""),
        fullName: String(formData.get("fullName") ?? ""),
        email: String(formData.get("email") ?? "") || undefined,
        role: String(formData.get("role") ?? "STAFF") as UserRole,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess("User created successfully");
      form.reset();
    });
  }

  function handleToggleActive(userId: string, isActive: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setUserActive(userId, !isActive);
      if (!result.success) setError(result.error);
    });
  }

  function handleResetPassword(userId: string) {
    const password = window.prompt("Enter new password (min 8 characters):");
    if (!password) return;
    setError(null);
    startTransition(async () => {
      const result = await resetUserPassword(userId, password);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess("Password updated");
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create User</CardTitle>
          <CardDescription>
            Admin can create accounts for Doctor and Staff roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                defaultValue="STAFF"
              >
                <option value="STAFF">Staff</option>
                <option value="DOCTOR">Doctor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" minLength={8} required />
            </div>
            {error && (
              <Alert className="border-destructive/50 md:col-span-2">
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-success/50 md:col-span-2">
                <AlertDescription className="text-success">{success}</AlertDescription>
              </Alert>
            )}
            <div className="md:col-span-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Create User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveList
            table={
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {user.username}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge className="bg-success text-success-foreground">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleResetPassword(user.id)}
                        >
                          Reset Password
                        </Button>
                        <Button
                          type="button"
                          variant={user.isActive ? "destructive" : "outline"}
                          size="sm"
                          disabled={isPending}
                          onClick={() =>
                            handleToggleActive(user.id, user.isActive)
                          }
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            }
            cards={
              <div className="space-y-3 p-4">
                {users.map((user) => (
                  <Card key={user.id} className="shadow-sm">
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{user.fullName}</p>
                        {user.isActive ? (
                          <Badge className="bg-success text-success-foreground">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                      <MobileField label="Username">
                        <span className="font-mono text-xs">{user.username}</span>
                      </MobileField>
                      <MobileField label="Role">
                        <Badge variant="secondary">{user.role}</Badge>
                      </MobileField>
                      <div className="flex flex-col gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          disabled={isPending}
                          onClick={() => handleResetPassword(user.id)}
                        >
                          Reset Password
                        </Button>
                        <Button
                          type="button"
                          variant={user.isActive ? "destructive" : "outline"}
                          size="sm"
                          className="w-full"
                          disabled={isPending}
                          onClick={() =>
                            handleToggleActive(user.id, user.isActive)
                          }
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
