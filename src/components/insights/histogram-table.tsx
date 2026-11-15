import { analysis } from "@/data/study";
import { formatNumber } from "@/lib/format";
import { DataTable } from "@/components/ui/data-table";

export function HistogramTable() {
  return (
    <details className="panel data-details">
      <summary>Inspect exact histogram counts</summary>
      <DataTable
        caption="Full-resolution paired radar backscatter difference histogram"
        columns={["Difference bin (dB)", "Pixels"]}
      >
        {analysis.histogram.map((bin) => (
          <tr key={bin.label}>
            <th scope="row">{bin.label}</th>
            <td>{formatNumber(bin.pixels)}</td>
          </tr>
        ))}
      </DataTable>
    </details>
  );
}
