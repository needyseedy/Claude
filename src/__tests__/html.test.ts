import { describe, it, expect } from "vitest";
import { stripHtml, truncate } from "../utils/html.js";

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("removes style and script blocks", () => {
    expect(
      stripHtml("<style>body{}</style><p>text</p><script>alert(1)</script>")
    ).toBe("text");
  });

  it("decodes common HTML entities", () => {
    expect(stripHtml("&amp; &lt; &gt; &quot; &#39;")).toBe("& < > \" '");
  });

  it("collapses whitespace", () => {
    expect(stripHtml("<p>  hello   world  </p>")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(stripHtml("")).toBe("");
  });
});

describe("truncate", () => {
  it("returns short strings unchanged", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long strings with ellipsis", () => {
    expect(truncate("hello world", 8)).toBe("hello...");
  });

  it("handles exact length", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });
});
