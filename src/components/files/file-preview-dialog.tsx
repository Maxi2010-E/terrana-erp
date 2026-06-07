"use client";

import { useState } from "react";

import { LinkButton } from "@/components/ui/link-button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type FilePreviewKind = "image" | "pdf";

type FilePreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url: string;
  kind: FilePreviewKind;
  fullPageHref?: string;
};

export function FilePreviewDialog({
  open,
  onOpenChange,
  title,
  url,
  kind,
  fullPageHref,
}: FilePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(calc(100vw-2rem),960px)] max-w-none">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {kind === "pdf" ? (
            <iframe
              src={url}
              title={title}
              className="h-[min(70vh,720px)] w-full rounded-xl border bg-muted/20"
            />
          ) : (
            <div className="flex justify-center rounded-xl border bg-muted/20 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={title}
                className="max-h-[min(70vh,720px)] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          )}
          {fullPageHref ? (
            <div className="flex justify-end">
              <LinkButton href={fullPageHref}>Open full</LinkButton>
            </div>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

type FilePreviewTriggerProps = {
  title: string;
  url: string;
  kind: FilePreviewKind;
  fullPageHref?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export function FilePreviewTrigger({
  title,
  url,
  kind,
  fullPageHref,
  children,
  className,
  disabled = false,
}: FilePreviewTriggerProps) {
  const [open, setOpen] = useState(false);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      <FilePreviewDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        url={url}
        kind={kind}
        fullPageHref={fullPageHref}
      />
    </>
  );
}
