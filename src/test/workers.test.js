import { describe, it, expect } from "vitest";

describe("JSON Worker Logic (Unit Tests)", () => {
  const formatJson = (jsonString) => {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  };

  const minifyJson = (jsonString) => {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed);
  };

  const validateJson = (jsonString) => {
    const parsed = JSON.parse(jsonString);
    return { valid: true, size: JSON.stringify(parsed).length };
  };

  it("formats JSON correctly", () => {
    const input = JSON.stringify({ name: "test", value: 123 });
    const result = formatJson(input);
    expect(result).toBe('{\n  "name": "test",\n  "value": 123\n}');
  });

  it("minifies JSON correctly", () => {
    const input = JSON.stringify(
      { name: "test", nested: { value: true } },
      null,
      2,
    );
    const result = minifyJson(input);
    expect(result).toBe('{"name":"test","nested":{"value":true}}');
  });

  it("validates JSON and returns metadata", () => {
    const input = JSON.stringify({ valid: true });
    const result = validateJson(input);
    expect(result.valid).toBe(true);
    expect(result.size).toBe(14);
  });

  it("throws error for invalid JSON", () => {
    expect(() => formatJson("{ invalid }")).toThrow();
  });

  it("handles nested objects", () => {
    const input = JSON.stringify({
      level1: {
        level2: {
          level3: "value",
        },
      },
    });
    const result = formatJson(input);
    expect(result).toContain("level1");
    expect(result).toContain("level2");
    expect(result).toContain("level3");
  });

  it("handles arrays", () => {
    const input = JSON.stringify([1, 2, 3, { name: "item" }]);
    const result = formatJson(input);
    expect(result).toContain("[");
    expect(result).toContain("1");
    expect(result).toContain('"name": "item"');
  });

  it("handles empty object", () => {
    const result = formatJson("{}");
    expect(result).toBe("{}");
  });

  it("handles empty array", () => {
    const result = formatJson("[]");
    expect(result).toBe("[]");
  });
});

describe("Diff Worker Logic (Unit Tests)", () => {
  const diffLines = (oldText, newText) => {
    const oldLines = oldText.split("\n");
    const newLines = newText.split("\n");

    const result = [];
    let oldI = 0,
      newI = 0;

    while (oldI < oldLines.length || newI < newLines.length) {
      if (oldI >= oldLines.length) {
        result.push({ value: newLines[newI] + "\n", added: true });
        newI++;
      } else if (newI >= newLines.length) {
        result.push({ value: oldLines[oldI] + "\n", removed: true });
        oldI++;
      } else if (oldLines[oldI] === newLines[newI]) {
        result.push({ value: oldLines[oldI] + "\n" });
        oldI++;
        newI++;
      } else {
        const oldNext = oldLines.indexOf(newLines[newI], oldI);
        const newNext = newLines.indexOf(oldLines[oldI], newI);

        if (oldNext === -1 && newNext === -1) {
          result.push({ value: oldLines[oldI] + "\n", removed: true });
          result.push({ value: newLines[newI] + "\n", added: true });
          oldI++;
          newI++;
        } else if (
          newNext !== -1 &&
          (oldNext === -1 || newNext - newI < oldNext - oldI)
        ) {
          for (let i = newI; i < newNext; i++) {
            result.push({ value: newLines[i] + "\n", added: true });
          }
          newI = newNext;
        } else {
          for (let i = oldI; i < oldNext; i++) {
            result.push({ value: oldLines[i] + "\n", removed: true });
          }
          oldI = oldNext;
        }
      }
    }

    return result;
  };

  it("detects identical lines as unchanged", () => {
    const result = diffLines("line1\nline2\nline3", "line1\nline2\nline3");
    expect(result.length).toBe(3);
    expect(result.every((part) => !part.added && !part.removed)).toBe(true);
  });

  it("detects added lines", () => {
    const result = diffLines("line1\nline2", "line1\nline2\nline3");
    const addedParts = result.filter((p) => p.added);
    expect(addedParts.length).toBeGreaterThan(0);
  });

  it("detects removed lines", () => {
    const result = diffLines("line1\nline2\nline3", "line1\nline2");
    const removedParts = result.filter((p) => p.removed);
    expect(removedParts.length).toBeGreaterThan(0);
  });

  it("handles completely different texts", () => {
    const result = diffLines("apple\nbanana", "cherry\ndate");
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles empty new input (all removed)", () => {
    const result = diffLines("content", "");
    expect(result.length).toBeGreaterThan(0);
    const removedParts = result.filter((p) => p.removed);
    expect(removedParts.length).toBe(1);
  });

  it("handles empty old input (all added)", () => {
    const result = diffLines("", "new content");
    expect(result.length).toBeGreaterThan(0);
    const addedParts = result.filter((p) => p.added);
    expect(addedParts.length).toBe(1);
  });

  it("handles partial matches", () => {
    const result = diffLines("a\nb\nc\nd", "a\nx\nc\ny");
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles single line diff", () => {
    const result = diffLines("hello", "world");
    expect(result.length).toBe(2);
    expect(result[0].removed).toBe(true);
    expect(result[1].added).toBe(true);
  });

  it("handles whitespace differences", () => {
    const result = diffLines("hello", "hello ");
    expect(result.length).toBe(2);
    expect(result[1].added).toBe(true);
  });
});
