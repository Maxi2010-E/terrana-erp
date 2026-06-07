"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { completeBoardTask, createBoardTask } from "@/lib/actions/office";
import { formatOfficeDate, formatOfficeDateTime } from "@/lib/office/date";
import type { OfficeTaskRow } from "@/lib/office/types";

type BoardTasksPanelProps = {
  openTasks: OfficeTaskRow[];
  completedTasks: OfficeTaskRow[];
  canManage: boolean;
};

export function BoardTasksPanel({
  openTasks,
  completedTasks,
  canManage,
}: BoardTasksPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {canManage ? (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Add daily task</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              action={(formData) => {
                setError(null);
                startTransition(async () => {
                  try {
                    await createBoardTask(formData);
                    const form = document.getElementById(
                      "board-task-form",
                    ) as HTMLFormElement | null;
                    form?.reset();
                  } catch (createError) {
                    setError(
                      createError instanceof Error
                        ? createError.message
                        : "Could not add task.",
                    );
                  }
                });
              }}
              id="board-task-form"
            >
              <input
                name="title"
                required
                maxLength={200}
                placeholder="Task title"
                disabled={isPending}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              />
              <textarea
                name="notes"
                rows={2}
                maxLength={1000}
                placeholder="Optional notes"
                disabled={isPending}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={isPending}>
                {isPending ? "Adding…" : "Add task"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <p className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Daily tasks are managed by admins. You can see what still needs doing below.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Open tasks (carry over until done)
        </h2>
        {openTasks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
            No open tasks. {canManage ? "Add one above." : ""}
          </p>
        ) : (
          openTasks.map((task) => (
            <article
              key={task.id}
              className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm"
            >
              {canManage ? (
                <input
                  type="checkbox"
                  className="mt-1 size-4 rounded border-input"
                  disabled={isPending}
                  onChange={() => {
                    startTransition(async () => {
                      try {
                        await completeBoardTask(task.id);
                      } catch (completeError) {
                        setError(
                          completeError instanceof Error
                            ? completeError.message
                            : "Could not complete task.",
                        );
                      }
                    });
                  }}
                  aria-label={`Mark ${task.title} done`}
                />
              ) : (
                <span className="mt-1 size-2 rounded-full bg-amber-500" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{task.title}</p>
                {task.notes ? (
                  <p className="mt-1 text-sm text-muted-foreground">{task.notes}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  Added {formatOfficeDate(task.originalDate)} by {task.createdByName}
                </p>
              </div>
            </article>
          ))
        )}
      </section>

      {completedTasks.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Completed today
          </h2>
          {completedTasks.map((task) => (
            <article
              key={task.id}
              className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3 text-sm"
            >
              <p className="font-medium line-through opacity-70">{task.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Done {formatOfficeDateTime(task.completedAt)} by{" "}
                {task.completedByName ?? "—"}
              </p>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
