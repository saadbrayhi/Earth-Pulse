import type { WaterTransition, MapAsset } from "@/lib/observation-types";
import { formatNumber } from "@/lib/format";
import { DataTable } from "@/components/ui/data-table";

export function WaterTransitionMatrix({
  cells,
  onHighlight,
}: {
  cells: WaterTransition[];
  onHighlight: (asset: MapAsset) => void;
}) {
  function cell(key: WaterTransition["key"]) {
    const item = cells.find((c) => c.key === key);
    return item ? (
      <button
        type="button"
        className={`transition-cell transition-${key}`}
        onClick={() => onHighlight(item.asset)}
      >
        <span>{item.label}</span>
        <strong>{formatNumber(item.areaKm2, 2)} km²</strong>
        <small>
          {formatNumber(item.pixels)} pixels · {formatNumber(item.percentValidArea, 2)}% of valid
          compared area
        </small>
      </button>
    ) : null;
  }
  return (
    <DataTable
      caption="Seasonal water transition matrix — common valid classifications only"
      columns={["Dry state / wet state", "Wet: water", "Wet: non-water"]}
    >
      <tr>
        <th scope="row">Dry: water</th>
        <td>{cell("bothDates")}</td>
        <td>{cell("dryOnly")}</td>
      </tr>
      <tr>
        <th scope="row">Dry: non-water</th>
        <td>{cell("wetOnly")}</td>
        <td>{cell("neither")}</td>
      </tr>
    </DataTable>
  );
}
