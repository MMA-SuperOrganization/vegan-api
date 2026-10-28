const STRIP_HTML = /<[^>]*>/g;
const UNSAFE_FILE_WORDS =
  /\b(icon|logo|map|flag|diagram|drawing|illustration|seal|symbol|coat of arms|meat|beef|pork|bacon|ham|chicken|turkey|fish|seafood|jellyfish|halibut|herring|clupea|sausage|mettwurst|carnitas|hot dog|corn dog|cheese|cream|egg)\b/i;
const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const QUERY_STOP_WORDS = new Set([
  "and",
  "with",
  "food",
  "dish",
  "fresh",
  "assortment",
  "vegan",
  "style",
]);

export const normalizeImageQuery = (value) =>
  value
    .replace(/ı/g, "i")
    .replace(/ß/g, "ss")
    .replace(/[øØ]/g, "o")
    .replace(/[łŁ]/g, "l")
    .replace(/[đĐ]/g, "d")
    .replace(/[æÆ]/g, "ae")
    .replace(/[œŒ]/g, "oe")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, " ")
    .replace(/[^a-zA-Z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const foodImageQuery = (name) => {
  const base = normalizeImageQuery(name.split(",")[0]);
  return base
    .replace(
      /\b(raw|cooked|canned|dried|frozen|boiled|drained|prepared|unprepared|sweetened|unsweetened)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
};

const metadataValue = (metadata, key) => metadata?.[key]?.value?.trim() || undefined;
const plainText = (value) =>
  value
    ?.replace(STRIP_HTML, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

export const isReusableLicense = (license) =>
  !/\b(?:NC|ND)\b/i.test(license ?? "") &&
  /^(cc0|public domain|cc[- ]by(?:[- ]sa)?)(?:\s|$)/i.test(license?.trim() ?? "");

export const parseCommonsPage = (page, retrievedAt = new Date()) => {
  const info = page?.imageinfo?.[0];
  const license = metadataValue(info?.extmetadata, "LicenseShortName");
  const displayUrl = info?.thumburl ?? info?.url;
  if (
    !page?.title ||
    !displayUrl ||
    !IMAGE_MIMES.has(info?.mime) ||
    (info?.width ?? 0) < 480 ||
    UNSAFE_FILE_WORDS.test(page.title) ||
    !isReusableLicense(license)
  )
    return null;
  return {
    imageUrl: displayUrl,
    attribution: {
      provider: "Wikimedia Commons",
      sourceUrl:
        page.canonicalurl ??
        `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
      author: plainText(metadataValue(info.extmetadata, "Artist"))?.slice(0, 500),
      license,
      licenseUrl: metadataValue(info.extmetadata, "LicenseUrl"),
      retrievedAt,
    },
  };
};

const queryTokens = (query) =>
  normalizeImageQuery(query)
    .toLowerCase()
    .split(" ")
    .filter((token) => token.length >= 4 && !QUERY_STOP_WORDS.has(token));

const relevanceScore = (page, query) => {
  const info = page?.imageinfo?.[0];
  const title = normalizeImageQuery(page?.title ?? "").toLowerCase();
  const searchable = normalizeImageQuery(
    [
      page?.title,
      plainText(metadataValue(info?.extmetadata, "ObjectName")),
      plainText(metadataValue(info?.extmetadata, "ImageDescription")),
    ]
      .filter(Boolean)
      .join(" "),
  ).toLowerCase();
  const tokens = queryTokens(query);
  return {
    title: tokens.filter((token) => title.includes(token)).length,
    total: tokens.filter((token) => searchable.includes(token)).length,
    tokenCount: tokens.length,
  };
};

export const pickCommonsImage = (payload, query = "", retrievedAt = new Date()) => {
  const candidates = Object.values(payload?.query?.pages ?? {})
    .map((page) => ({
      image: parseCommonsPage(page, retrievedAt),
      score: relevanceScore(page, query),
    }))
    .filter(
      ({ image, score }) =>
        image &&
        (score.tokenCount === 0 ||
          (score.tokenCount === 1 ? score.total >= 1 : score.title >= 1 && score.total >= 2)),
    )
    .sort((left, right) => right.score.total - left.score.total);
  return candidates[0]?.image ?? null;
};
