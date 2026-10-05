"""Read the source workbook without Excel or third-party Python packages."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser()
parser.add_argument("workbook", type=Path)
args = parser.parse_args()
ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
with zipfile.ZipFile(args.workbook) as archive:
    strings = []
    if "xl/sharedStrings.xml" in archive.namelist():
        strings = ["".join(si.itertext()) for si in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall("m:si", ns)]
    relationships = {r.attrib["Id"]: r.attrib["Target"] for r in ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))}
    cases = []
    for sheet in ET.fromstring(archive.read("xl/workbook.xml")).findall("m:sheets/m:sheet", ns):
        if sheet.attrib["name"] not in ("API Cases", "Backend E2E", "Security NFR"):
            continue
        target = relationships[sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
        target = target.lstrip("/") if target.startswith("/") else "xl/" + target
        for row in ET.fromstring(archive.read(target)).findall("m:sheetData/m:row", ns):
            cells = {}
            for cell in row.findall("m:c", ns):
                ref = "".join(c for c in cell.attrib["r"] if c.isalpha())
                value = cell.find("m:v", ns)
                inline = cell.find("m:is", ns)
                cells[ref] = strings[int(value.text)] if cell.attrib.get("t") == "s" else "".join(inline.itertext()) if inline is not None else value.text if value is not None else ""
            if not cells.get("A", "").startswith(("API-", "BIZ-", "NFR-")):
                continue
            fields = ("id", "module", "feature", "type", "priority", "actor", "preconditions", "data", "steps", "expected")
            cases.append({"sheet": sheet.attrib["name"], "row": int(row.attrib["r"]), **{field: cells.get(chr(65 + i), "") for i, field in enumerate(fields)}})
result = {"source": args.workbook.name, "sha256": hashlib.sha256(args.workbook.read_bytes()).hexdigest(), "cases": cases}
output = Path(__file__).resolve().parents[1] / "tests/playwright/cases.json"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Imported {len(cases)} cases into {output}")
