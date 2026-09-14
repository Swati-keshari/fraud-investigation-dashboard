import Link from "next/link";
import { OpsPage } from "@/components/shell/OpsPage";

export default function HelpPage() {
  return (
    <OpsPage
      title="Help"
      plain="If the screen feels busy, start at How it works, then Practice lab, then the queue."
    >
      <ol className="story-steps">
        <li className="story-step">
          <b>1</b>
          <span>
            <Link href="/" className="text-risk-info underline">
              How it works
            </Link>{" "}
            — the four-step story.
          </span>
        </li>
        <li className="story-step">
          <b>2</b>
          <span>
            <Link href="/learn/glossary" className="text-risk-info underline">
              Word list
            </Link>{" "}
            — translate labels.
          </span>
        </li>
        <li className="story-step">
          <b>3</b>
          <span>
            <Link href="/test" className="text-risk-info underline">
              Practice lab
            </Link>{" "}
            — type a fake payment.
          </span>
        </li>
      </ol>
    </OpsPage>
  );
}
