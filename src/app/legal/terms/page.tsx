import { LegalPageShell } from "@/components/LegalPageShell";
import { MainWrapper } from "@/components/MainWrapper";
import { getLegalPage } from "@/lib/legalPages";

export default function TermsPage() {
  return (
    <MainWrapper>
      <LegalPageShell page={getLegalPage("/legal/terms")} />
    </MainWrapper>
  );
}
