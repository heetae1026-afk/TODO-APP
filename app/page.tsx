"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PRIORITIES, type Priority, type TodoDTO } from "@/lib/todo";

const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: "높음",
  MEDIUM: "중간",
  LOW: "낮음",
};

const PRIORITY_BADGE_CLASSES: Record<Priority, string> = {
  HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export default function Home() {
  const [todos, setTodos] = useState<TodoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTodos() {
      const res = await fetch("/api/tasks");
      const data: TodoDTO[] = await res.json();
      setTodos(data);
      setLoading(false);
    }

    void loadTodos();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priority }),
    });

    if (!res.ok) {
      const data: { error: string } = await res.json();
      setError(data.error);
      return;
    }

    const created: TodoDTO = await res.json();
    setTodos((prev) => [...prev, created]);
    setTitle("");
    setPriority("MEDIUM");
  }

  async function handleToggle(id: number) {
    const res = await fetch(`/api/tasks/${id}`, { method: "PATCH" });

    if (res.status === 404) {
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
      return;
    }

    const updated: TodoDTO = await res.json();
    setTodos((prev) => prev.map((todo) => (todo.id === id ? updated : todo)));
  }

  async function handlePriorityChange(id: number, nextPriority: Priority) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: nextPriority }),
    });

    if (res.status === 404) {
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
      return;
    }

    const updated: TodoDTO = await res.json();
    setTodos((prev) => prev.map((todo) => (todo.id === id ? updated : todo)));
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });

    if (res.ok || res.status === 404) {
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-16">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          할 일 목록
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="할 일을 입력하세요"
              className="flex-1 rounded border border-black/[.1] bg-white px-3 py-2 text-black dark:border-white/[.15] dark:bg-black dark:text-zinc-50"
            />
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as Priority)}
              className="rounded border border-black/[.1] bg-white px-2 py-2 text-black dark:border-white/[.15] dark:bg-black dark:text-zinc-50"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded bg-foreground px-4 py-2 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              추가
            </button>
          </div>
          {error !== null && <p className="text-sm text-red-600">{error}</p>}
        </form>

        {loading ? (
          <p className="text-zinc-500">불러오는 중...</p>
        ) : todos.length === 0 ? (
          <p className="text-zinc-500">아직 할 일이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo.id)}
                  className="h-4 w-4"
                />
                <span
                  className={
                    todo.completed
                      ? "flex-1 text-zinc-400 line-through"
                      : "flex-1 text-black dark:text-zinc-50"
                  }
                >
                  {todo.title}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE_CLASSES[todo.priority]}`}
                >
                  {PRIORITY_LABELS[todo.priority]}
                </span>
                <select
                  value={todo.priority}
                  onChange={(event) => handlePriorityChange(todo.id, event.target.value as Priority)}
                  className="rounded border border-black/[.1] bg-white px-1 py-1 text-xs text-black dark:border-white/[.15] dark:bg-black dark:text-zinc-50"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleDelete(todo.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
