"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  listPrivateMessages,
  sendPrivateMessage,
} from "@/lib/actions/office";
import { formatOfficeDateTime } from "@/lib/office/date";
import type {
  OfficeUserOption,
  PrivateConversationRow,
  PrivateMessageRow,
} from "@/lib/office/types";
import { cn } from "@/lib/utils";

type PrivateMessagesPanelProps = {
  conversations: PrivateConversationRow[];
  users: OfficeUserOption[];
  activeUserId: string | null;
  initialMessages: PrivateMessageRow[];
};

export function PrivateMessagesPanel({
  conversations,
  users,
  activeUserId,
  initialMessages,
}: PrivateMessagesPanelProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function loadThread(userId: string) {
    startTransition(async () => {
      try {
        const rows = await listPrivateMessages(userId);
        setMessages(rows);
        setError(null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load messages.",
        );
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Conversations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 px-2 pb-3">
          {conversations.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              No private messages yet.
            </p>
          ) : (
            conversations.map((conversation) => (
              <Link
                key={conversation.otherUserId}
                href={`/office?view=board&channel=private&with=${conversation.otherUserId}`}
                onClick={() => loadThread(conversation.otherUserId)}
                className={cn(
                  "block rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted",
                  activeUserId === conversation.otherUserId && "bg-muted",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{conversation.otherUserName}</span>
                  {conversation.unreadCount > 0 ? (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {conversation.lastMessageBody}
                </p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">New private message</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              action={(formData) => {
                setError(null);
                startTransition(async () => {
                  try {
                    await sendPrivateMessage(formData);
                    const recipientId = String(formData.get("recipient_id"));
                    window.location.href = `/office?view=board&channel=private&with=${recipientId}`;
                  } catch (sendError) {
                    setError(
                      sendError instanceof Error
                        ? sendError.message
                        : "Could not send message.",
                    );
                  }
                });
              }}
            >
              <select
                name="recipient_id"
                required
                defaultValue={activeUserId ?? ""}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  Choose a colleague…
                </option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} ({user.email})
                  </option>
                ))}
              </select>
              <textarea
                name="body"
                required
                maxLength={2000}
                rows={3}
                placeholder="Write a private message…"
                disabled={isPending}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={isPending}>
                {isPending ? "Sending…" : "Send"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {activeUserId ? (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                {conversations.find((row) => row.otherUserId === activeUserId)
                  ?.otherUserName ??
                  users.find((user) => user.id === activeUserId)?.displayName ??
                  "Conversation"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                      message.isMine
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.body}</p>
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        message.isMine
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatOfficeDateTime(message.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : (
          <p className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
            Pick someone above or start a new private message.
          </p>
        )}
      </div>
    </div>
  );
}
