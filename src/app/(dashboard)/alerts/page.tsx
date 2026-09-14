import { AlertQueuePage } from "@/components/alerts/AlertQueuePage";
import { LessonBanner } from "@/components/shell/LessonBanner";

export default function AlertsPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <LessonBanner
        title="Alert queue"
        plain="Each row is a payment the computer thinks might be fraud. Red is urgent. Green can wait. Click a row to see the clues."
      />
      <div className="min-h-0 flex-1">
        <AlertQueuePage />
      </div>
    </div>
  );
}
