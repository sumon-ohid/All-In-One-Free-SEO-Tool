export const dynamic = "force-dynamic";

import { Activity } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { CruxForm } from "./crux-form";

export default function CruxPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Real-user CWV (CrUX)"
        description="Real Chrome user data over the last 28 days. Unlike Lighthouse / PageSpeed (lab numbers), CrUX is what actual users experienced — the same data Google uses to rank your page experience."
        icon={Activity}
        accent="emerald"
      />
      <CruxForm />
    </div>
  );
}
