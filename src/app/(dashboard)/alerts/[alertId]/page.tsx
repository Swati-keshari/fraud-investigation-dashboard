import Link from "next/link";
import { OpsPage } from "@/components/shell/OpsPage";
import { EvidenceDraw, RiskMeter, StampMark } from "@/components/artifacts/MotionKit";

export default async function AlertStoryPage({
  params,
}: {
  params: Promise<{ alertId: string }>;
}) {
  const { alertId } = await params;
  return (
    <OpsPage
      title={`Alert ${alertId}`}
      plain="This page is a single payment story. The number is not a verdict — it is a hint for a human."
    >
      <div className="fact-row">
        <RiskMeter score={74} />
        <StampMark text="REVIEW" />
      </div>
      <EvidenceDraw />
      <p style={{ marginTop: "1rem", maxWidth: "40rem" }}>
        Open the live queue to act on real demo alerts, or keep reading the classroom pages if this
        is your first visit.
      </p>
      <p style={{ marginTop: "0.8rem" }}>
        <Link href="/alerts" className="text-risk-info underline">
          Back to the queue
        </Link>
      </p>
    </OpsPage>
  );
}
