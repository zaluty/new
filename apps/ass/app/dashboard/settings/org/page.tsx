"use client";
import { useOrganization } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface Invitation {
  id: string;
  emailAddress: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function Organization() {
  const { organization } = useOrganization();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organization) {
      organization
        .getInvitations()
        .then((response) => {
          setInvitations(
            response.data.map((inv) => ({
              ...inv,
              createdAt: inv.createdAt.toISOString(),
            }))
          );
          setLoading(false);
        })
        .catch((error) => {
          setError("Error fetching invitations");
          setLoading(false);
          console.error(error);
        });
    }
  }, [organization]);

  if (!organization) return null;

  const formatRole = (role: string) => role.replace("org:", "");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{organization.name}</h1>
      {loading ? (
        <p>Loading invitations...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invited At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>{invitation.emailAddress}</TableCell>
                <TableCell>{formatRole(invitation.role)}</TableCell>
                <TableCell>{invitation.status}</TableCell>
                <TableCell>
                  {format(new Date(invitation.createdAt), "PPP")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
