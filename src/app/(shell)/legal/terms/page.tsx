import { LegalPageShell } from "@/components/LegalPageShell";
import { getLegalPage } from "@/lib/legalPages";

export default function TermsPage() {
  return (
    <>
      <LegalPageShell page={getLegalPage("/legal/terms")} />
    </>
  );
}
