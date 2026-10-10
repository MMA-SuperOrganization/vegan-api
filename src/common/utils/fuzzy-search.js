import { escapeRegex } from "../domain.js";

const MAX_FUZZY_LENGTH = 32;
const MIN_FUZZY_LENGTH = 3;
const WILDCARD = Symbol("single-character wildcard");
const accentClasses = {
  a: "[aàáạảãâầấậẩẫăằắặẳẵ]",
  d: "[dđ]",
  e: "[eèéẹẻẽêềếệểễ]",
  i: "[iìíịỉĩ]",
  o: "[oòóọỏõôồốộổỗơờớợởỡ]",
  u: "[uùúụủũưừứựửữ]",
  y: "[yỳýỵỷỹ]",
};

export const normalizeSearchText = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const tokenPattern = (token) => {
  if (token === WILDCARD) return ".";
  if (token === " ") return "[\\s_-]+";
  return accentClasses[token] ?? escapeRegex(token);
};

const patternFor = (tokens) => tokens.map(tokenPattern).join("");

export function fuzzyRegexSource(value) {
  const normalized = normalizeSearchText(value);
  if (!normalized) return escapeRegex(String(value ?? "").trim());
  const characters = [...normalized];
  const patterns = new Set([patternFor(characters)]);
  if (characters.length < MIN_FUZZY_LENGTH || characters.length > MAX_FUZZY_LENGTH)
    return [...patterns].join("|");

  for (let index = 0; index < characters.length; index++) {
    if (characters.length > MIN_FUZZY_LENGTH)
      patterns.add(patternFor([...characters.slice(0, index), ...characters.slice(index + 1)]));
    patterns.add(
      patternFor([...characters.slice(0, index), WILDCARD, ...characters.slice(index + 1)]),
    );
  }
  for (let index = 0; index <= characters.length; index++)
    patterns.add(patternFor([...characters.slice(0, index), WILDCARD, ...characters.slice(index)]));

  return `(?:${[...patterns].join("|")})`;
}

export const fuzzyMongoRegex = (value) => ({
  $regex: fuzzyRegexSource(value),
  $options: "i",
});
