"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deleteGeneralBoardMessage,
  postGeneralBoardMessage,
} from "@/lib/actions/office";
import { formatOfficeDateTime } from "@/lib/office/date";
import type { GeneralBoardMessageRow } from "@/lib/office/types";

type GeneralBoardPanelProps = {
  messages: GeneralBoardMessageRow[];
  canDelete: boolean;
};

export function GeneralBoardPanel({
  messages,
  canDelete,
}: GeneralBoardPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Post to company board</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            action={(formData) => {
              setError(null);
              startTransition(async () => {
                try {
                  await postGeneralBoardMessage(formData);
                  const form = document.getElementById(
                    "general-board-form",
                  ) as HTMLFormElement | null;
                  form?.reset();
                } catch (postError) {
                  setError(
                    postError instanceof Error
                      ? postError.message
                      : "Could not post message.",
                  );
                }
              });
            }}
            id="general-board-form"
          >
            <textarea
              name="body"
              required
              maxLength={2000}
              rows={3}
              placeholder="Share an update with everyone…"
              disabled={isPending}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Posting…" : "Post message"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
            No messages yet. Post the first company update above.
          </p>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className="rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{message.authorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatOfficeDateTime(message.createdAt)}
                  </p>
                </div>
                {canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      startTransition(async () => {
                        try {
                          await deleteGeneralBoardMessage(message.id);
                        } catch (deleteError) {
                          setError(
                            deleteError instanceof Error
                              ? deleteError.message
                              : "Could not delete message.",
                          );
                        }
                      });
                    }}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
