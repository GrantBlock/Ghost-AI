"use client";

import { Button } from "@/components/ui/button";
import { EditorDialog } from "@/components/editor/editor-dialog";
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";
import { SHAPE_DEFAULT_SIZES, type CanvasNode } from "@/types/canvas";

const PREVIEW_WIDTH = 240;
const PREVIEW_HEIGHT = 140;
const PREVIEW_PADDING = 12;

const STROKE = "var(--border-default)";

function nodeSize(node: CanvasNode) {
  const fallback = SHAPE_DEFAULT_SIZES[node.data.shape];
  return {
    width: node.width ?? fallback.width,
    height: node.height ?? fallback.height,
  };
}

function PreviewNode({ node }: { node: CanvasNode }) {
  const { width, height } = nodeSize(node);
  const { x, y } = node.position;
  const { shape, color } = node.data;
  const common = {
    fill: color,
    stroke: STROKE,
    strokeWidth: 1,
    vectorEffect: "non-scaling-stroke" as const,
  };

  switch (shape) {
    case "circle":
      return (
        <ellipse
          cx={x + width / 2}
          cy={y + height / 2}
          rx={width / 2}
          ry={height / 2}
          {...common}
        />
      );
    case "pill":
      return (
        <rect x={x} y={y} width={width} height={height} rx={height / 2} {...common} />
      );
    case "diamond":
      return (
        <polygon
          points={`${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`}
          {...common}
        />
      );
    case "hexagon":
      return (
        <polygon
          points={`${x + width * 0.25},${y} ${x + width * 0.75},${y} ${x + width},${y + height / 2} ${x + width * 0.75},${y + height} ${x + width * 0.25},${y + height} ${x},${y + height / 2}`}
          {...common}
        />
      );
    case "cylinder": {
      const cap = height * 0.12;
      return (
        <path
          d={`M${x},${y + cap} A${width / 2},${cap} 0 0 1 ${x + width},${y + cap} V${y + height - cap} A${width / 2},${cap} 0 0 1 ${x},${y + height - cap} Z`}
          {...common}
        />
      );
    }
    default:
      return (
        <rect x={x} y={y} width={width} height={height} rx={6} {...common} />
      );
  }
}

/** Lightweight SVG diagram preview fitted to a fixed-size viewport. */
function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const { nodes, edges } = template;
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const minX = Math.min(...nodes.map((n) => n.position.x));
  const minY = Math.min(...nodes.map((n) => n.position.y));
  const maxX = Math.max(...nodes.map((n) => n.position.x + nodeSize(n).width));
  const maxY = Math.max(...nodes.map((n) => n.position.y + nodeSize(n).height));

  // Pad in diagram units so the content keeps a margin after scaling.
  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / (maxX - minX),
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / (maxY - minY)
  );
  const padX = PREVIEW_PADDING / scale;
  const padY = PREVIEW_PADDING / scale;

  return (
    <svg
      width={PREVIEW_WIDTH}
      height={PREVIEW_HEIGHT}
      viewBox={`${minX - padX} ${minY - padY} ${maxX - minX + padX * 2} ${maxY - minY + padY * 2}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${template.name} preview`}
      className="max-w-full rounded-xl bg-base"
    >
      {edges.map((e) => {
        const source = byId.get(e.source);
        const target = byId.get(e.target);
        if (!source || !target) return null;
        const s = nodeSize(source);
        const t = nodeSize(target);
        return (
          <line
            key={e.id}
            x1={source.position.x + s.width / 2}
            y1={source.position.y + s.height / 2}
            x2={target.position.x + t.width / 2}
            y2={target.position.y + t.height / 2}
            stroke="var(--text-muted)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {nodes.map((n) => (
        <PreviewNode key={n.id} node={n} />
      ))}
    </svg>
  );
}

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

/** Dialog listing starter templates with previews and an import action. */
export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  function handleImport(template: CanvasTemplate) {
    onImport(template);
    onOpenChange(false);
  }

  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Starter templates"
      description="Importing a template replaces everything on the current canvas."
      className="sm:max-w-3xl"
    >
      <div className="grid max-h-[60vh] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
        {CANVAS_TEMPLATES.map((template) => (
          <div
            key={template.id}
            className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-base p-3"
          >
            <div className="flex justify-center">
              <TemplatePreview template={template} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-copy-primary">
                {template.name}
              </h3>
              <p className="text-xs text-copy-muted">{template.description}</p>
            </div>
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => handleImport(template)}
            >
              Import
            </Button>
          </div>
        ))}
      </div>
    </EditorDialog>
  );
}
