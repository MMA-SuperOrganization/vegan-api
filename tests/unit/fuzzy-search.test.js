import { describe, expect, it } from "vitest";
import {
  fuzzyMongoRegex,
  fuzzyRegexSource,
  normalizeSearchText,
} from "../../src/common/utils/fuzzy-search.js";

const matches = (query, value) => new RegExp(fuzzyRegexSource(query), "i").test(value);

describe("bounded fuzzy search", () => {
  it("normalizes accents, punctuation and whitespace", () => {
    expect(normalizeSearchText("  Đậu-Hũ  ")).toBe("dau hu");
    expect(matches("dau hu", "Đậu hũ")).toBe(true);
  });

  it.each(["toffu", "tofo", "tfu"])("matches a one-edit typo: %s", (query) => {
    expect(matches(query, "Tofu")).toBe(true);
  });

  it("keeps partial matching while treating regex syntax as literal input", () => {
    expect(matches("tof", "Organic Tofu")).toBe(true);
    expect(matches(".*", "Organic Tofu")).toBe(false);
    expect(fuzzyMongoRegex("tofo")).toMatchObject({ $options: "i" });
  });

  it("does not fuzzy-expand very short searches into broad matches", () => {
    expect(matches("tx", "Tofu")).toBe(false);
  });
});
