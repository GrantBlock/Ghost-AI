"use client";

import { useState } from "react";

import { MOCK_PROJECTS, slugify, type Project } from "@/lib/projects";

type DialogState =
  | { type: "none" }
  | { type: "create" }
  | { type: "rename"; projectId: string }
  | { type: "delete"; projectId: string };

const MOCK_LATENCY_MS = 400;

/**
 * Manages dialog state, form state, loading state and the mock project list
 * for the create / rename / delete project dialogs. No API calls or persistence.
 */
export function useProjectDialogs() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const targetProject =
    dialog.type === "rename" || dialog.type === "delete"
      ? (projects.find((p) => p.id === dialog.projectId) ?? null)
      : null;

  function openCreate() {
    setName("");
    setDialog({ type: "create" });
  }

  function openRename(projectId: string) {
    const project = projects.find((p) => p.id === projectId);
    if (!project?.isOwner) return;
    setName(project.name);
    setDialog({ type: "rename", projectId });
  }

  function openDelete(projectId: string) {
    const project = projects.find((p) => p.id === projectId);
    if (!project?.isOwner) return;
    setDialog({ type: "delete", projectId });
  }

  function close() {
    if (isLoading) return;
    setDialog({ type: "none" });
    setName("");
  }

  async function submit() {
    if (isLoading) return;
    const trimmed = name.trim();
    if (dialog.type !== "delete" && trimmed.length === 0) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

    if (dialog.type === "create") {
      setProjects((prev) => [
        {
          id: crypto.randomUUID(),
          name: trimmed,
          slug: slugify(trimmed),
          isOwner: true,
        },
        ...prev,
      ]);
    } else if (dialog.type === "rename") {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === dialog.projectId
            ? { ...p, name: trimmed, slug: slugify(trimmed) }
            : p
        )
      );
    } else if (dialog.type === "delete") {
      setProjects((prev) => prev.filter((p) => p.id !== dialog.projectId));
    }

    setIsLoading(false);
    setDialog({ type: "none" });
    setName("");
  }

  return {
    ownedProjects: projects.filter((p) => p.isOwner),
    sharedProjects: projects.filter((p) => !p.isOwner),
    dialog: dialog.type,
    targetProject,
    name,
    setName,
    slug: slugify(name),
    isLoading,
    openCreate,
    openRename,
    openDelete,
    close,
    submit,
  };
}
