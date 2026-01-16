import { describe, it, expect } from "vitest";
import {
  preloadLanguage,
  getAvailableLanguages,
} from "@/components/common/CodeEditor";

describe("CodeEditor Lazy Loading Utilities", () => {
  it("preloadLanguage is a function", () => {
    expect(typeof preloadLanguage).toBe("function");
  });

  it("getAvailableLanguages is a function", () => {
    expect(typeof getAvailableLanguages).toBe("function");
  });

  it("getAvailableLanguages returns array", () => {
    const languages = getAvailableLanguages();
    expect(Array.isArray(languages)).toBe(true);
  });

  it("getAvailableLanguages contains common languages", () => {
    const languages = getAvailableLanguages();
    expect(languages).toContain("json");
    expect(languages).toContain("javascript");
    expect(languages).toContain("python");
    expect(languages).toContain("sql");
    expect(languages).toContain("yaml");
  });

  it("getAvailableLanguages has sufficient options", () => {
    const languages = getAvailableLanguages();
    expect(languages.length).toBeGreaterThanOrEqual(10);
  });

  it("each language in list is a string", () => {
    const languages = getAvailableLanguages();
    languages.forEach((lang) => {
      expect(typeof lang).toBe("string");
    });
  });

  it("preloadLanguage doesn't throw for valid language", () => {
    expect(() => preloadLanguage("json")).not.toThrow();
  });

  it("preloadLanguage doesn't throw for unknown language", () => {
    expect(() => preloadLanguage("unknown-lang")).not.toThrow();
  });

  it("languages are unique (no duplicates)", () => {
    const languages = getAvailableLanguages();
    const unique = new Set(languages);
    expect(languages.length).toBe(unique.size);
  });

  it("language list includes markup for HTML/XML", () => {
    const languages = getAvailableLanguages();
    expect(languages).toContain("markup");
    expect(languages).toContain("xml");
    expect(languages).toContain("html");
  });

  it("language list includes css", () => {
    const languages = getAvailableLanguages();
    expect(languages).toContain("css");
  });

  it("language list includes typescript", () => {
    const languages = getAvailableLanguages();
    expect(languages).toContain("typescript");
  });

  it("language list includes common backend languages", () => {
    const languages = getAvailableLanguages();
    expect(languages).toContain("java");
    expect(languages).toContain("go");
    expect(languages).toContain("rust");
    expect(languages).toContain("php");
    expect(languages).toContain("ruby");
  });
});
