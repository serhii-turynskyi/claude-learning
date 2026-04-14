"use client";

import { Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: "partial-call" | "call" | "result";
  result?: unknown;
}

function getToolLabel(toolName: string, args: Record<string, unknown>): string {
  const path = typeof args.path === "string" ? args.path.replace(/^\//, "") : null;

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return path ? `Creating ${path}` : "Creating file";
      case "str_replace":
      case "insert":
        return path ? `Editing ${path}` : "Editing file";
      case "view":
        return path ? `Reading ${path}` : "Reading file";
      case "undo_edit":
        return path ? `Undoing edit in ${path}` : "Undoing edit";
      default:
        return path ? `Editing ${path}` : "Editing file";
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename": {
        const newPath = typeof args.new_path === "string" ? args.new_path.replace(/^\//, "") : null;
        if (path && newPath) return `Renaming ${path} to ${newPath}`;
        if (path) return `Renaming ${path}`;
        return "Renaming file";
      }
      case "delete":
        return path ? `Deleting ${path}` : "Deleting file";
      default:
        return "Managing file";
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolName, args, state, result }: ToolCallBadgeProps) {
  const label = getToolLabel(toolName, args);
  const isDone = state === "result" && result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
