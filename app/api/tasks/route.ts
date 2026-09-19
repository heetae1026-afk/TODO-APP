import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRIORITY, jsonError, normalizePriority, normalizeTitle, toTodoDTO } from "@/lib/todo";

export async function GET() {
  const todos = await prisma.todo.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(todos.map(toTodoDTO));
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const rawTitle =
    body !== null && typeof body === "object" && "title" in body
      ? (body as Record<string, unknown>).title
      : undefined;
  const rawPriority =
    body !== null && typeof body === "object" && "priority" in body
      ? (body as Record<string, unknown>).priority
      : undefined;

  const title = normalizeTitle(rawTitle);
  if (title === null) {
    return jsonError("Title is required and must be 1-200 characters.", 400);
  }

  const priority = rawPriority === undefined ? DEFAULT_PRIORITY : normalizePriority(rawPriority);
  if (priority === null) {
    return jsonError("Priority must be one of HIGH, MEDIUM, LOW.", 400);
  }

  const todo = await prisma.todo.create({ data: { title, priority } });
  return NextResponse.json(toTodoDTO(todo), { status: 201 });
}
