import fs from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: false,
});

const asArray = (value) => (value == null ? [] : Array.isArray(value) ? value : [value]);
const text = (value) => {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value["#text"] != null) return String(value["#text"]);
  return asArray(value.r)
    .map((run) => text(run.t))
    .join("");
};
const columnIndex = (reference) => {
  const letters =
    String(reference)
      .match(/^[A-Z]+/i)?.[0]
      ?.toUpperCase() ?? "A";
  return [...letters].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
};
const decodeXml = (files, name) => {
  const file = files[name];
  if (!file) throw new Error(`Invalid XLSX: missing ${name}`);
  return parser.parse(strFromU8(file));
};

function cellValue(cell, sharedStrings) {
  const type = cell["@_t"];
  if (type === "inlineStr") return text(cell.is?.t ?? cell.is);
  const raw = text(cell.v);
  if (type === "s") return sharedStrings[Number(raw)] ?? "";
  if (type === "str") return raw;
  if (type === "b") return raw === "1";
  if (type === "e") throw new Error(`XLSX cell ${cell["@_r"]} contains error ${raw}`);
  if (raw === "") return null;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : raw;
}

export async function readXlsxRows(filePath) {
  const files = unzipSync(new Uint8Array(await fs.readFile(filePath)));
  const workbook = decodeXml(files, "xl/workbook.xml").workbook;
  const relationships = decodeXml(files, "xl/_rels/workbook.xml.rels").Relationships;
  const relationshipTargets = new Map(
    asArray(relationships.Relationship).map((item) => [item["@_Id"], item["@_Target"]]),
  );
  const sharedStringsDocument = files["xl/sharedStrings.xml"]
    ? decodeXml(files, "xl/sharedStrings.xml").sst
    : null;
  const sharedStrings = sharedStringsDocument
    ? asArray(sharedStringsDocument.si).map((item) => text(item.t ?? item))
    : [];
  const sheets = new Map();
  for (const sheet of asArray(workbook.sheets?.sheet)) {
    const target = relationshipTargets.get(sheet["@_id"]);
    const path = target?.startsWith("/")
      ? target.slice(1)
      : `xl/${String(target).replace(/^\.\//, "")}`;
    const worksheet = decodeXml(files, path).worksheet;
    const rows = asArray(worksheet.sheetData?.row).map((row) => {
      const values = [];
      for (const cell of asArray(row.c))
        values[columnIndex(cell["@_r"])] = cellValue(cell, sharedStrings);
      return values;
    });
    sheets.set(sheet["@_name"], rows);
  }
  return sheets;
}

export function rowsToObjects(rows, firstHeader) {
  const headerIndex = rows.findIndex((row) => row?.[0] === firstHeader);
  if (headerIndex < 0) throw new Error(`Missing header row starting with ${firstHeader}`);
  const headers = rows[headerIndex].map((value) => String(value ?? "").trim());
  return rows
    .slice(headerIndex + 1)
    .filter((row) => row?.[0] != null && row[0] !== "")
    .map((row) =>
      Object.fromEntries(
        headers.filter(Boolean).map((header, index) => [header, row[index] ?? null]),
      ),
    );
}
