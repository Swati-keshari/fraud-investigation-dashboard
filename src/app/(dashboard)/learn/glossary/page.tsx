import { OpsPage } from "@/components/shell/OpsPage";

const WORDS = [
  ["Alert", "A payment that needs a human look."],
  ["Case", "A folder for a longer investigation."],
  ["Escalate", "Ask a more senior person."],
  ["Approve", "Let the payment stand."],
  ["Decline", "Stop the payment."],
  ["Audit log", "The diary of actions."],
  ["SHAP / signals", "The top reasons the model raised its hand."],
  ["Payee", "Who receives the money."],
];

export default function GlossaryPage() {
  return (
    <OpsPage
      title="Word list"
      plain="Ops tools love jargon. Here is the same idea in school English."
    >
      <table className="plain-table">
        <thead>
          <tr>
            <th>Word on the screen</th>
            <th>Plain meaning</th>
          </tr>
        </thead>
        <tbody>
          {WORDS.map(([w, m]) => (
            <tr key={w}>
              <td>{w}</td>
              <td>{m}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </OpsPage>
  );
}
