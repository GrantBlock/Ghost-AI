"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Collaborator {
  email: string;
  name: string | null;
  imageUrl: string | null;
}

async function request(
  projectId: string,
  method: "GET" | "POST" | "DELETE",
  email?: string
): Promise<Collaborator[]> {
  const res = await fetch(`/api/projects/${projectId}/collaborators`, {
    method,
    headers: email ? { "Content-Type": "application/json" } : undefined,
    body: email ? JSON.stringify({ email }) : undefined,
  });
  const data = (await res.json().catch(() => null)) as {
    collaborators?: Collaborator[];
    error?: string;
  } | null;
  if (!res.ok || !data?.collaborators) {
    throw new Error(data?.error ?? "Something went wrong");
  }
  return data.collaborators;
}

/** Collaborator list state + invite/remove/copy-link actions for one project. */
export function useProjectShare(projectId: string, open: boolean) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const isLoading = open && !isLoaded;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    request(projectId, "GET")
      .then((list) => !cancelled && setCollaborators(list))
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong");
        }
      })
      .finally(() => !cancelled && setIsLoaded(true));
    return () => {
      cancelled = true;
      setIsLoaded(false);
      setError(null);
    };
  }, [open, projectId]);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    []
  );

  const invite = useCallback(async () => {
    const value = email.trim();
    if (!value) return;
    setIsSubmitting(true);
    setError(null);
    try {
      setCollaborators(await request(projectId, "POST", value));
      setEmail("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }, [email, projectId]);

  const remove = useCallback(
    async (target: string) => {
      setRemovingEmail(target);
      setError(null);
      try {
        setCollaborators(await request(projectId, "DELETE", target));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setRemovingEmail(null);
      }
    },
    [projectId]
  );

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/editor/${projectId}`
      );
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy the link");
    }
  }, [projectId]);

  return {
    collaborators,
    email,
    setEmail,
    isLoading,
    isSubmitting,
    removingEmail,
    error,
    copied,
    invite,
    remove,
    copyLink,
  };
}
