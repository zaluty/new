"use client";
import { useState, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { Protect, useOrganization } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Code, Copy, Info, Key, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import React from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import Settings from "@/components/dashboard/project/settings";
import { AddApiKey } from "@/components/dashboard/add-api-key";
import { useSearchParams } from "next/navigation";
import UsageChart from "@/components/dashboard/project/usage-chart";
import EditApiKey from "@/components/dashboard/edit-api-key";
import { format } from "date-fns";
import ImportantNotice from "@/components/dashboard/important-notice";
import Link from "next/link";
import { ContactForm } from "@/components/contact";
import { useUser } from "@clerk/nextjs";
import { z } from "zod";
export const dynamic = "force-dynamic";

export default function ProjectPage({ params }: { params: { name: string } }) {
  const { organization } = useOrganization();
  const [projectId, setProjectId] = useState<Id<"projects"> | null>(null);
  const [isAddApiKeyDialogOpen, setIsAddApiKeyDialogOpen] = useState(false);
  const [isEditApiKeyDialogOpen, setIsEditApiKeyDialogOpen] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<Id<"apiKeys"> | null>(
    null
  );
  const searchParams = useSearchParams();
  const { user } = useUser();
  const project = useQuery(api.projects.getProjectByName, {
    name: decodeURIComponent(params.name),
    organizationId: organization?.id || "",
  });

  useEffect(() => {
    if (project) {
      setProjectId(project._id);
    }
  }, [project]);

  useEffect(() => {
    if (searchParams.get("addApiKey") === "true") {
      setIsAddApiKeyDialogOpen(true);
    }
  }, [searchParams]);

  const apiKeys = useQuery(
    api.apiKeys.getApiKeys,
    projectId ? { projectId } : "skip"
  );

  const [newApiKey, setNewApiKey] = useState("");
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const createApiKey = useMutation(api.apiKeys.createApiKey);
  const deleteApiKey = useMutation(api.apiKeys.deleteApiKey);

  if (project === undefined) {
    return <ProjectSkeleton />;
  }

  if (project === null) {
    return <NotFound name={params.name} />;
  }

  const handleCreateApiKey = async () => {
    try {
      await createApiKey({
        projectId: project._id,
        value: newApiKey,
        name: newApiKeyName,
      });
      setNewApiKey("");
      setNewApiKeyName("");
      toast.success("API Key created successfully");
    } catch (error) {
      toast.error("Failed to create API Key");
    }
  };

  const handleDeleteApiKey = async (apiKeyId: Id<"apiKeys">) => {
    try {
      await deleteApiKey({ apiKeyId });
      toast.success("APIKey deleted successfully");
    } catch (error) {
      toast.error("Failed to delete API Key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleEditApiKey = (apiKeyId: Id<"apiKeys">) => {
    setSelectedApiKey(apiKeyId);
    setIsEditApiKeyDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="bg-card text-card-foreground">
        <CardHeader className="flex flex-col gap-y-4 p-6 bg-card text-card-foreground rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-4xl font-extrabold">
              {project.name}
            </CardTitle>
            <ImportantNotice />
          </div>
          <p className="text-lg opacity-90">{project.description}</p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>

          {organization ? (
            <Protect
              role="org:admin"
              fallback={
                <TabsTrigger value="settings" disabled>
                  Settings (admins only)
                </TabsTrigger>
              }
            >
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </Protect>
          ) : (
            <TabsTrigger value="settings">Settings</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center justify-between">
                <div className="flex items-center">
                  <Code className="mr-2" /> API Keys
                </div>
                {organization ? (
                  <Protect role="org:admin" fallback={<></>}>
                    <AddApiKey
                      projectId={project._id}
                      isOpen={isAddApiKeyDialogOpen}
                      onOpenChange={setIsAddApiKeyDialogOpen}
                    >
                      <Button>Add API key</Button>
                    </AddApiKey>
                  </Protect>
                ) : (
                  <AddApiKey
                    projectId={project._id}
                    isOpen={isAddApiKeyDialogOpen}
                    onOpenChange={setIsAddApiKeyDialogOpen}
                  >
                    <Button>Add API key</Button>
                  </AddApiKey>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>API Key</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead> Key Environment </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        <p className="text-gray-500">
                          No API keys found add one to get started
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                  {apiKeys?.map((apiKey) => (
                    <TableRow key={apiKey._id}>
                      <TableCell className="font-mono">
                        {apiKey.apiKey.slice(0, 4)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {format(new Date(apiKey.createdAt), "PPP")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {apiKey.isServer ? (
                          <Badge variant="outline">Server</Badge>
                        ) : (
                          <Badge variant="outline">Client</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(apiKey.apiKey)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Protect
                            condition={(has) =>
                              has({
                                permission: "org:sys_memberships:manage",
                              }) || !organization
                            }
                            fallback={<></>}
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditApiKey(apiKey._id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Protect>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="usage">
          <UsageChart />
        </TabsContent>
        <TabsContent value="settings">
          <Settings project={project} />
        </TabsContent>
        <TabsContent value="logs"></TabsContent>
      </Tabs>
      {selectedApiKey && (
        <EditApiKey
          apiKeyId={selectedApiKey}
          apiKeyName={
            apiKeys?.find((ak) => ak._id === selectedApiKey)?.name ?? ""
          }
          isOpen={isEditApiKeyDialogOpen}
          onOpenChange={setIsEditApiKeyDialogOpen}
        />
      )}
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Skeleton className="h-40 w-full" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

function NotFound({ name }: { name: string }) {
  return (
    <Card className="bg-card text-card-foreground w-1/2 mx-auto mt-16">
      <CardHeader>
        <CardTitle>Project not found</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          The project <span className="font-bold underline">{name}</span> you
          are looking for does not exist. or has been deleted.
        </p>
        <p className="text-4xl font-bold text-center">404</p>
      </CardContent>
    </Card>
  );
}
