const escapeCsvCell = (value) => {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * @param {Array<{ key: string, label: string }>} columns
 * @param {Array<Object>} rows
 */
const arrayToCsv = (columns, rows) => {
  const header = columns.map((col) => escapeCsvCell(col.label)).join(",");
  const body = rows
    .map((row) => columns.map((col) => escapeCsvCell(row[col.key])).join(","))
    .join("\n");
  return `${header}\n${body}`;
};

export default arrayToCsv;
