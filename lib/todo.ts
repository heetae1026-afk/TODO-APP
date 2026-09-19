import { NextResponse } from "next/server";
import type { Todo } from "@prisma/client";

export type Priority = "HIGH" | "MEDIUM" | "LOW";

export const PRIORITIES: readonly Priority[] = ["HIGH", "MEDIUM", "LOW"];

export const DEFAULT_PRIORITY: Priority = "MEDIUM";

export interface TodoDTO {
  id: number;
  title: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
}

export function toTodoDTO(todo: Todo): TodoDTO {
  return {
    id: todo.id,
    title: todo.title,
    completed: todo.completed,
    priority: todo.priority as Priority,
    createdAt: todo.createdAt.toISOString(),
  };
}

export function jsonError(message: string, status: number): NextResponse<{ error: string }> {
  return NextResponse.json({ error: message }, { status });
}

export const TODO_TITLE_MAX_LENGTH = 200;

export function normalizeTitle(rawTitle: unknown): string | null {
  if (typeof rawTitle !== "string") {
    return null;
  }
  const trimmed = rawTitle.trim();
  if (trimmed.length === 0 || trimmed.length > TODO_TITLE_MAX_LENGTH) {
    return null;
  }
  return trimmed;
}

export function normalizePriority(rawPriority: unknown): Priority | null {
  if (typeof rawPriority !== "string") {
    return null;
  }
  return (PRIORITIES as readonly string[]).includes(rawPriority) ? (rawPriority as Priority) : null;
}
