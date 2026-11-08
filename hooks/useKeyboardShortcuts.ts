"use client";

import type { Edge, Node, ReactFlowInstance } from "@xyflow/react";
import { useEffect, useRef } from "react";

export const ZOOM_DURATION = 200;

const PASTE_OFFSET = 24;

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

interface Clipboard {
  nodes: Node[];
  edges: Edge[];
  pastes: number;
}

interface KeyboardShortcutOptions {
  reactFlow: ReactFlowInstance;
  undo: () => void;
  redo: () => void;
}

/**
 * Canvas shortcuts: history (Cmd/Ctrl+Z, Shift+Z, Y) and shape clipboard
 * (Cmd/Ctrl+C, V, X).
 */
export function useKeyboardShortcuts({
  reactFlow,
  undo,
  redo,
}: KeyboardShortcutOptions) {
  const clipboard = useRef<Clipboard | null>(null);

  useEffect(() => {
    function copy() {
      const nodes = reactFlow.getNodes().filter((n) => n.selected);
      if (nodes.length === 0) return false;
      const ids = new Set(nodes.map((n) => n.id));
      const edges = reactFlow
        .getEdges()
        .filter((e) => ids.has(e.source) && ids.has(e.target));
      clipboard.current = {
        nodes: structuredClone(nodes),
        edges: structuredClone(edges),
        pastes: 0,
      };
      return true;
    }

    function paste() {
      const clip = clipboard.current;
      if (!clip) return;
      clip.pastes += 1;
      const offset = PASTE_OFFSET * clip.pastes;
      const stamp = `${Date.now()}-${clip.pastes}`;
      const idMap = new Map<string, string>();

      const nodes = clip.nodes.map((node, i) => {
        const id = `${node.id.split("-")[0]}-${stamp}-${i}`;
        idMap.set(node.id, id);
        return {
          ...structuredClone(node),
          id,
          selected: true,
          position: {
            x: node.position.x + offset,
            y: node.position.y + offset,
          },
        };
      });
      const edges = clip.edges.map((edge, i) => ({
        ...structuredClone(edge),
        id: `edge-${stamp}-${i}`,
        source: idMap.get(edge.source)!,
        target: idMap.get(edge.target)!,
        selected: false,
      }));

      // Deselect existing nodes so only the pasted ones stay selected.
      reactFlow.setNodes((current) => [
        ...current.map((n) => (n.selected ? { ...n, selected: false } : n)),
        ...nodes,
      ]);
      if (edges.length > 0) reactFlow.addEdges(edges);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;

      switch (event.key.toLowerCase()) {
        case "z":
          event.preventDefault();
          if (event.shiftKey) redo();
          else undo();
          break;
        case "y":
          event.preventDefault();
          redo();
          break;
        case "c":
          if (copy()) event.preventDefault();
          break;
        case "x":
          if (copy()) {
            event.preventDefault();
            void reactFlow.deleteElements({
              nodes: reactFlow.getNodes().filter((n) => n.selected),
            });
          }
          break;
        case "v":
          if (clipboard.current) {
            event.preventDefault();
            paste();
          }
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reactFlow, undo, redo]);
}
