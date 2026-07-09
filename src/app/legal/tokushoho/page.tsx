import { LegalPageShell } from "@/components/LegalPageShell";
import { MainWrapper } from "@/components/MainWrapper";
import { getLegalPage } from "@/lib/legalPages";

export default function TokushohoPage() {
  return (
    <MainWrapper>
      <LegalPageShell page={getLegalPage("/legal/tokushoho")} />
    </MainWrapper>
  );
}
