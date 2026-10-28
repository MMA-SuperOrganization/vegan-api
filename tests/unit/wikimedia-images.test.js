import { describe, expect, it } from "vitest";
import {
  foodImageQuery,
  isReusableLicense,
  normalizeImageQuery,
  parseCommonsPage,
  pickCommonsImage,
} from "../../scripts/lib/wikimedia-images.js";

describe("Wikimedia image catalog helpers", () => {
  it("normalizes international recipe names without dropping meaningful words", () => {
    expect(normalizeImageQuery("İmam Bayıldı (Stuffed Eggplant)")).toBe(
      "Imam Bayildi Stuffed Eggplant",
    );
  });

  it("groups prepared USDA variants under a useful food query", () => {
    expect(foodImageQuery("Apples, frozen, unsweetened, heated")).toBe("Apples");
    expect(foodImageQuery("Artichokes, (globe or french), cooked")).toBe("Artichokes");
  });

  it("accepts attribution-friendly licenses and rejects non-commercial ones", () => {
    expect(isReusableLicense("CC BY-SA 4.0")).toBe(true);
    expect(isReusableLicense("Public domain")).toBe(true);
    expect(isReusableLicense("CC BY-NC 4.0")).toBe(false);
  });

  it("returns the image URL and attribution from Commons metadata", () => {
    const result = parseCommonsPage({
      title: "File:Falafel.jpg",
      canonicalurl: "https://commons.wikimedia.org/wiki/File:Falafel.jpg",
      imageinfo: [
        {
          mime: "image/jpeg",
          width: 1600,
          url: "https://upload.wikimedia.org/falafel.jpg",
          thumburl: "https://upload.wikimedia.org/falafel-1200.jpg",
          extmetadata: {
            Artist: { value: "<b>Example author</b>" },
            LicenseShortName: { value: "CC BY-SA 4.0" },
            LicenseUrl: { value: "https://creativecommons.org/licenses/by-sa/4.0" },
          },
        },
      ],
    });
    expect(result).toMatchObject({
      imageUrl: "https://upload.wikimedia.org/falafel-1200.jpg",
      attribution: {
        author: "Example author",
        license: "CC BY-SA 4.0",
      },
    });
  });

  it("rejects an unrelated search result instead of assigning a misleading dish image", () => {
    const payload = {
      query: {
        pages: [
          {
            title: "File:Lontong Sayur.jpg",
            imageinfo: [
              {
                mime: "image/jpeg",
                width: 1600,
                url: "https://upload.wikimedia.org/lontong.jpg",
                extmetadata: {
                  ImageDescription: { value: "An Indonesian rice cake and vegetable soup" },
                  LicenseShortName: { value: "CC BY-SA 4.0" },
                },
              },
            ],
          },
        ],
      },
    };
    expect(pickCommonsImage(payload, "Tempeh Rendang")).toBeNull();
  });
});
