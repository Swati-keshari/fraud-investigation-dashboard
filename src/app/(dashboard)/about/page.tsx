import { OpsPage } from "@/components/shell/OpsPage";
import { StampMark } from "@/components/artifacts/MotionKit";

export default function AboutPage() {
  return (
    <OpsPage
      title="About"
      plain="Watch Desk is Swati Keshari’s personal fraud-investigation project: a student-readable front for a real operations workflow."
    >
      <StampMark text="SWATI" />
      <p style={{ maxWidth: "40rem", marginTop: "1rem" }}>
        The product idea is simple: rank strange payments, let a human decide, keep a diary. The
        screens on the left are the whole map — not hidden admin pages.
      </p>
      <p style={{ maxWidth: "40rem", marginTop: "0.85rem" }}>
        Production desk:{" "}
        <a className="text-risk-info underline" href="https://watch-desk-web.onrender.com/">
          watch-desk-web.onrender.com
        </a>
        . LightGBM API:{" "}
        <a className="text-risk-info underline" href="https://watch-desk-lgbm.onrender.com/">
          watch-desk-lgbm.onrender.com
        </a>
        .
      </p>
    </OpsPage>
  );
}
