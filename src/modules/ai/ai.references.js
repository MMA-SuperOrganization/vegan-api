const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escapeMarkdownLabel = (value) => value.replace(/([\\[\]])/g, "\\$1");

const catalogReferences = (catalog) => [
  ...(catalog?.recipes ?? []).map(({ id, title }) => ({
    id: String(id),
    label: String(title),
    href: `veganapp://recipe/${id}`,
  })),
  ...(catalog?.foods ?? []).map(({ id, name }) => ({
    id: String(id),
    label: String(name),
    href: `veganapp://food/${id}`,
  })),
];

function linkReference(line, reference) {
  if (!line.includes(reference.id) || line.includes(reference.href)) return line;

  const escapedId = escapeRegExp(reference.id);
  const idLabel = new RegExp(`\\s*[([{]?\\s*ID\\s*:\\s*\`?${escapedId}\`?\\s*[)\\]}]?`, "gi");
  const rawId = new RegExp(`\`?${escapedId}\`?`, "g");
  const label = `[${escapeMarkdownLabel(reference.label)}](${reference.href})`;
  const labelPattern = new RegExp(escapeRegExp(reference.label), "i");
  const hasLabel = labelPattern.test(line);

  let linked;
  if (hasLabel) {
    linked = line.replace(idLabel, "").replace(rawId, "").replace(labelPattern, label);
  } else {
    linked = line.replace(idLabel, label);
    if (!linked.includes(reference.href)) linked = linked.replace(rawId, label);
  }
  return linked
    .replace(/\(\s*\)/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trimEnd();
}

/** Converts provider-facing catalog IDs into tappable app links before persistence. */
export function linkAiCatalogReferences(content, catalog) {
  const references = catalogReferences(catalog);
  return String(content)
    .split("\n")
    .map((line) =>
      references.reduce((linkedLine, reference) => linkReference(linkedLine, reference), line),
    )
    .join("\n");
}
