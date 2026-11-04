"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { buildRoomId, generateIdSuffix } from "@/lib/projects";

interface ProjectTarget {
  id: string;
  name: string;
}

type DialogState =
  | { type: "none" }
  | { type: "create"; suffix: string }
  | ({ type: "rename" } & ProjectTarget)
  | ({ type: "delete" } & ProjectTarget);

async function readError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "error" in body) {
      const message = (body as { error: unknown }).error;
      if (typeof message === "string") return message;
    }
  } catch {
    // fall through
  }
  return "Something went wrong. Please try again.";
}

/** Manages dialog state and project create / rename / delete mutations. */
export function useProjectActions() {
  const router = useRouter();
  const pathname = usePathname();

  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomId =
    dialog.type === "create" ? buildRoomId(name, dialog.suffix) : "";
  const targetProject =
    dialog.type === "rename" || dialog.type === "delete"
      ? { id: dialog.id, name: dialog.name }
      : null;

  function openCreate() {
    setName("");
    setError(null);
    setDialog({ type: "create", suffix: generateIdSuffix() });
  }

  function openRename(project: ProjectTarget) {
    setName(project.name);
    setError(null);
    setDialog({ type: "rename", id: project.id, name: project.name });
  }

  function openDelete(project: ProjectTarget) {
    setError(null);
    setDialog({ type: "delete", id: project.id, name: project.name });
  }

  function close() {
    if (isLoading) return;
    setDialog({ type: "none" });
    setName("");
    setError(null);
  }

  /** Sends a JSON request; returns true on success, otherwise records the error. */
  async function send(url: string, method: string, body?: unknown): Promise<boolean> {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!response.ok) {
        setError(await readError(response));
        return false;
      }
      return true;
    } catch {
      setError("Network error. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function submit() {
    if (isLoading) return;
    const trimmed = name.trim();

    if (dialog.type === "create") {
      if (!trimmed) return;
      const id = buildRoomId(trimmed, dialog.suffix);
      if (!(await send("/api/projects", "POST", { id, name: trimmed }))) return;
      setDialog({ type: "none" });
      setName("");
      router.push(`/editor/${id}`);
    } else if (dialog.type === "rename") {
      if (!trimmed) return;
      if (!(await send(`/api/projects/${dialog.id}`, "PATCH", { name: trimmed }))) return;
      setDialog({ type: "none" });
      setName("");
      router.refresh();
    } else if (dialog.type === "delete") {
      const { id } = dialog;
      if (!(await send(`/api/projects/${id}`, "DELETE"))) return;
      setDialog({ type: "none" });
      if (pathname === `/editor/${id}`) {
        router.replace("/editor");
      } else {
        router.refresh();
      }
    }
  }

  return {
    dialog: dialog.type,
    targetProject,
    name,
    setName,
    roomId,
    isLoading,
    error,
    openCreate,
    openRename,
    openDelete,
    close,
    submit,
  };
}
