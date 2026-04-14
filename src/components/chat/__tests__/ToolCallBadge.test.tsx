import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// --- str_replace_editor ---

test("str_replace_editor create shows 'Creating <path>'", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/App.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating src/App.tsx")).toBeDefined();
});

test("str_replace_editor str_replace shows 'Editing <path>'", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "src/Button.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing src/Button.tsx")).toBeDefined();
});

test("str_replace_editor insert shows 'Editing <path>'", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "insert", path: "src/Button.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing src/Button.tsx")).toBeDefined();
});

test("str_replace_editor view shows 'Reading <path>'", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "view", path: "src/index.ts" }}
      state="call"
    />
  );
  expect(screen.getByText("Reading src/index.ts")).toBeDefined();
});

test("str_replace_editor undo_edit shows 'Undoing edit in <path>'", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "undo_edit", path: "src/foo.ts" }}
      state="call"
    />
  );
  expect(screen.getByText("Undoing edit in src/foo.ts")).toBeDefined();
});

test("str_replace_editor strips leading slash from path", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/App.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating src/App.tsx")).toBeDefined();
});

test("str_replace_editor with no path falls back to generic label", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating file")).toBeDefined();
});

// --- file_manager ---

test("file_manager rename shows 'Renaming <path> to <new_path>'", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "src/Old.tsx", new_path: "src/New.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Renaming src/Old.tsx to src/New.tsx")).toBeDefined();
});

test("file_manager rename without new_path shows 'Renaming <path>'", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "src/Old.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Renaming src/Old.tsx")).toBeDefined();
});

test("file_manager delete shows 'Deleting <path>'", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "src/old.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Deleting src/old.tsx")).toBeDefined();
});

// --- unknown tool ---

test("unknown tool name renders raw tool name", () => {
  render(
    <ToolCallBadge
      toolName="some_other_tool"
      args={{}}
      state="call"
    />
  );
  expect(screen.getByText("some_other_tool")).toBeDefined();
});

// --- state: pending vs done ---

test("pending state renders spinner, no green dot", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/App.tsx" }}
      state="call"
    />
  );
  // Spinner svg should be present
  expect(container.querySelector("svg")).toBeDefined();
  // No green dot
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("result state with result renders green dot, no spinner", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/App.tsx" }}
      state="result"
      result="Success"
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector("svg")).toBeNull();
});

test("result state without result still renders spinner", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/App.tsx" }}
      state="result"
      result={undefined}
    />
  );
  expect(container.querySelector("svg")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});
