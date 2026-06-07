type PageHeaderProps = {
  title: string;
  description?: string;
  meta?: string;
  actions?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  meta,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {meta ? (
          <p className="text-sm text-muted-foreground">{meta}</p>
        ) : null}
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
