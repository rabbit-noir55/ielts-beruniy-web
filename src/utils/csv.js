export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") continue;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return rows;
}

function clean(r) {
  return (r || []).map((c) => String(c ?? "").trim());
}

export function buildTable(rows) {
  const all = rows.map(clean).filter((r) => r.some((c) => c !== ""));
  if (!all.length) return null;

  const headerIdx = all.findIndex((r) =>
    r.some((c) => c.toUpperCase().includes("NAME")),
  );
  if (headerIdx < 0) return null;

  const title = all[0][0] || "";
  let subtitle = "";
  if (headerIdx >= 1) {
    const before = all[headerIdx - 1];
    if (
      before &&
      !/^\d+$/.test(before[0] || "") &&
      (before[0] || "").trim() &&
      before[0].trim() !== title
    ) {
      subtitle = before[0];
    }
  }

  const header = all[headerIdx];
  const sub = all[headerIdx + 1];
  const isTwoLevel =
    !!sub &&
    header.some((h) => /week/i.test(h)) &&
    sub.slice(2).some((c) => c !== "");

  const columns = [];
  columns.push(header[0] || "#");
  columns.push(header[1] || "NAME");

  let weekLabel = "";
  const colCount = Math.max(header.length, sub ? sub.length : 0);
  const groups = [];
  for (let c = 2; c < colCount; c++) {
    const h = header[c] || "";
    if (/week/i.test(h)) weekLabel = h.replace(/\s+/g, " ").trim();
    const s = sub ? sub[c] || "" : "";
    if (isTwoLevel) {
      if (h.trim()) {
        if (groups.length) groups[groups.length - 1].end = c - 1;
        groups.push({ label: h.trim(), start: c, end: c, subs: [s] });
      } else if (groups.length) {
        groups[groups.length - 1].end = c;
        groups[groups.length - 1].subs.push(s);
      }
      if (s) columns.push(`${weekLabel} ${s}`.trim());
      else if (h) columns.push(h);
      else columns.push("");
    } else {
      columns.push(h);
    }
  }
  if (groups.length && groups[groups.length - 1].end < colCount - 1) {
    groups[groups.length - 1].end = colCount - 1;
  }

  const startIdx = isTwoLevel ? headerIdx + 2 : headerIdx + 1;
  const data = all
    .slice(startIdx)
    .filter((r) => (r[1] || "").trim())
    .map((r) => {
      const row = [...r];
      while (row.length < columns.length) row.push("");
      return row.slice(0, columns.length);
    });

  return { title, subtitle, columns, groups, data };
}
