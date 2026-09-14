import { AuditLogPanel } from "@/components/common/AuditLogPanel";
import { LessonBanner } from "@/components/shell/LessonBanner";

export default function AuditPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <LessonBanner
        title="Who did what"
        plain="This is the diary. Every approve, block, or case change is listed so a teacher, auditor, or manager can replay the day."
      />
      <div className="min-h-0 flex-1">
        <AuditLogPanel />
      </div>
    </div>
  );
}
