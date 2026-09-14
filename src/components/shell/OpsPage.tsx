import { LessonBanner } from "@/components/shell/LessonBanner";

export function OpsPage({
  title,
  plain,
  children,
}: {
  title: string;
  plain: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ops-page">
      <LessonBanner title={title} plain={plain} />
      <div className="ops-page__body">{children}</div>
    </div>
  );
}
