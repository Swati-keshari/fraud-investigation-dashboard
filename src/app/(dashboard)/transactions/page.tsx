import { OpsPage } from "@/components/shell/OpsPage";
import { MoneyFlow, Sparkline } from "@/components/artifacts/MotionKit";

export default function TransactionsPage() {
  return (
    <OpsPage
      title="Payments"
      plain="A payment has an amount, a time, a shop type, and a country. Fraud is often ‘this payment does not match the person’s usual pattern’."
    >
      <MoneyFlow />
      <Sparkline />
      <table className="plain-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Amount</th>
            <th>Shop type</th>
            <th>Looks like</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>14:02</td>
            <td>₹240</td>
            <td>Grocery</td>
            <td>Everyday</td>
          </tr>
          <tr>
            <td>02:11</td>
            <td>₹48,200</td>
            <td>Jewellery</td>
            <td>Worth a second look</td>
          </tr>
          <tr>
            <td>19:40</td>
            <td>₹2,500</td>
            <td>Electronics</td>
            <td>Maybe fine, maybe not</td>
          </tr>
        </tbody>
      </table>
    </OpsPage>
  );
}
