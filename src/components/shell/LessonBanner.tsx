export function LessonBanner({ title, plain }: { title: string; plain: string }) {
  return (
    <div className="lesson-banner">
      <p className="lesson-banner__kicker">What you are looking at</p>
      <h1 className="lesson-banner__title">{title}</h1>
      <p className="lesson-banner__plain">{plain}</p>
    </div>
  );
}
