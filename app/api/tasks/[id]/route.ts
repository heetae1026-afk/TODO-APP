import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, normalizePriority, toTodoDTO } from "@/lib/todo";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) ? id : null;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) {
    return jsonError("Invalid id.", 400);
  }

  const existing = await prisma.todo.findUnique({ where: { id } });
  if (existing === null) {
    return jsonError("Todo not found.", 404);
  }

  const body: unknown = await request.json().catch(() => null);
  const rawPriority =
    body !== null && typeof body === "object" && "priority" in body
      ? (body as Record<string, unknown>).priority
      : undefined;

  if (rawPriority !== undefined) {
    const priority = normalizePriority(rawPriority);
    if (priority === null) {
      return jsonError("Priority must be one of HIGH, MEDIUM, LOW.", 400);
    }

    const updated = await prisma.todo.update({
      where: { id },
      data: { priority },
    });

    return NextResponse.json(toTodoDTO(updated));
  }

  const updated = await prisma.todo.update({
    where: { id },
    data: { completed: !existing.completed },
  });

  return NextResponse.json(toTodoDTO(updated));
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) {
    return jsonError("Invalid id.", 400);
  }

  const existing = await prisma.todo.findUnique({ where: { id } });
  if (existing === null) {
    return jsonError("Todo not found.", 404);
  }

  await prisma.todo.delete({ where: { id } });
  return NextResponse.json({ id });
}
