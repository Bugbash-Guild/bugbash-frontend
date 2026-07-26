import { LegalPageShell } from "@/components/LegalPageShell";
import { getLegalPage } from "@/lib/legalPages";

export default function PrepaidPage() {
  return (
    <>
      <LegalPageShell page={getLegalPage("/legal/prepaid")} />
    </>
  );
}
