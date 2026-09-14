import { OpsPage } from "@/components/shell/OpsPage";
import { CountUpStat, NetworkRipple } from "@/components/artifacts/MotionKit";

export default function CustomersPage() {
  return (
    <OpsPage
      title="Customers"
      plain="A customer is the person who owns the account. Age of the account and past disputes help you decide if this looks like them."
    >
      <div className="fact-row">
        <CountUpStat label="demo customers" value={86} />
        <NetworkRipple />
      </div>
      <table className="plain-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Account age</th>
            <th>Past fights about payments</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Asha Rao</td>
            <td>4 years</td>
            <td>0</td>
          </tr>
          <tr>
            <td>New wallet 19d</td>
            <td>19 days</td>
            <td>2</td>
          </tr>
          <tr>
            <td>Kiran Shah</td>
            <td>11 months</td>
            <td>1</td>
          </tr>
        </tbody>
      </table>
    </OpsPage>
  );
}
