import { LegalPageShell } from "@/components/LegalPageShell";
import { getLegalPage } from "@/lib/legalPages";

export default function TokushohoPage() {
  return (
    <>
      <LegalPageShell page={getLegalPage("/legal/tokushoho")} />
    </>
  );
}
