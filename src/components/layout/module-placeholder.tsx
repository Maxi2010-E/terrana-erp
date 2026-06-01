import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ModulePlaceholderProps = {
  title: string;
  description?: string;
  phase?: number;
};

export function ModulePlaceholder({
  title,
  description,
  phase,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {phase ? <Badge variant="secondary">Phase {phase}</Badge> : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming in a later phase</CardTitle>
          <CardDescription>
            {description ??
              "This module is planned in the Terrana ERP roadmap. Phase 0 provides navigation and access control only."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          We build one module at a time to keep the system stable and traceable.
        </CardContent>
      </Card>
    </div>
  );
}
