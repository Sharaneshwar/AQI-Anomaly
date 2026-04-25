export default function ChatTable({ rows, columns }) {
  if (!rows || rows.length === 0) {
    return <div className="text-xs text-muted-foreground italic">empty</div>;
  }
  const cols = columns?.length ? columns : Object.keys(rows[0]);
  const display = (v) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "number") {
      return Number.isInteger(v) ? String(v) : v.toFixed(2);
    }
    return String(v);
  };
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-card/60 text-muted-foreground">
            {cols.map((c) => (
              <th
                key={c}
                className="text-left font-medium font-mono px-2.5 py-1.5 border-b border-border"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-card/40">
              {cols.map((c) => (
                <td
                  key={c}
                  className="px-2.5 py-1.5 border-b border-border/60 text-foreground/90"
                >
                  {display(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
