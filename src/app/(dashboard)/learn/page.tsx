import Link from "next/link";
import { OpsPage } from "@/components/shell/OpsPage";
import { ShieldScan } from "@/components/artifacts/MotionKit";

export default function LearnPage() {
  return (
    <OpsPage
      title="Classroom"
      plain="Fraud is pretending. Someone pretends to be you, or pretends a shop is real, and tries to take money. This desk is the hall monitor."
    >
      <ShieldScan />
      <p style={{ maxWidth: "40rem", marginTop: "0.8rem" }}>
        Banks see thousands of payments. Humans cannot read every one. A model (a math guesser)
        ranks them. You still make the call.
      </p>
      <p style={{ marginTop: "1rem" }}>
        <Link href="/learn/risk" className="text-risk-info underline">
          How risk scores work
        </Link>
        {" · "}
        <Link href="/learn/glossary" className="text-risk-info underline">
          Word list
        </Link>
      </p>
    </OpsPage>
  );
}
