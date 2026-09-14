import { OpsPage } from "@/components/shell/OpsPage";

export default function TeamPage() {
  return (
    <OpsPage
      title="Team"
      plain="Someone has to be on the desk. This page lists who is watching, in this demo as sample names."
    >
      <table className="plain-table">
        <thead>
          <tr>
            <th>Person</th>
            <th>Seat</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Swati Keshari</td>
            <td>Owner — product and UI</td>
          </tr>
          <tr>
            <td>Shift analyst A</td>
            <td>Alert queue</td>
          </tr>
          <tr>
            <td>Shift lead</td>
            <td>Escalations</td>
          </tr>
        </tbody>
      </table>
    </OpsPage>
  );
}
