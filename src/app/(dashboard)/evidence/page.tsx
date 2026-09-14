import { OpsPage } from "@/components/shell/OpsPage";
import { EvidenceDraw, NetworkRipple } from "@/components/artifacts/MotionKit";

export default function EvidencePage() {
  return (
    <OpsPage
      title="Evidence"
      plain="Evidence is a clue, not a punishment. A new shop, a night-time transfer, or many payments in one hour are clues stacked together."
    >
      <NetworkRipple />
      <EvidenceDraw />
      <table className="plain-table" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>Clue</th>
            <th>Plain meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>New payee</td>
            <td>Money is going to someone this account never paid before.</td>
          </tr>
          <tr>
            <td>Night hour</td>
            <td>Most people sleep. Thieves often work then.</td>
          </tr>
          <tr>
            <td>Velocity</td>
            <td>How many payments happened in a short time.</td>
          </tr>
          <tr>
            <td>Country jump</td>
            <td>The shop or bank is far from the customer’s usual places.</td>
          </tr>
        </tbody>
      </table>
    </OpsPage>
  );
}
