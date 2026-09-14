import { CaseBoardPage } from "@/components/cases/CaseBoardPage";
import { LessonBanner } from "@/components/shell/LessonBanner";

export default function CasesPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <LessonBanner
        title="Cases"
        plain="A case is a folder. When an alert is too serious to decide in one click, it lives here until someone finishes the investigation."
      />
      <div className="min-h-0 flex-1">
        <CaseBoardPage />
      </div>
    </div>
  );
}
