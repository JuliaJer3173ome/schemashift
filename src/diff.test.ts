import { describe, it, expect } from "vitest";
import { diffSchemas } from "./diff";

describe("diffSchemas", () => {
  it("returns empty array for identical schemas", () => {
    const schema = { type: "object" as const, properties: { name: { type: "string" as const } } };
    expect(diffSchemas(schema, schema)).toEqual([]);
  });

  it("detects top-level type change", () => {
    const before = { type: "string" as const };
    const after = { type: "number" as const };
    const changes = diffSchemas(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe("type_changed");
    expect(changes[0].before).toBe("string");
    expect(changes[0].after).toBe("number");
  });

  it("detects added property", () => {
    const before = { type: "object" as const, properties: {} };
    const after = { type: "object" as const, properties: { age: { type: "integer" as const } } };
    const changes = diffSchemas(before, after);
    const added = changes.find((c) => c.type === "added" && c.path.includes("age"));
    expect(added).toBeDefined();
  });

  it("detects removed property", () => {
    const before = { type: "object" as const, properties: { age: { type: "integer" as const } } };
    const after = { type: "object" as const, properties: {} };
    const changes = diffSchemas(before, after);
    const removed = changes.find((c) => c.type === "removed" && c.path.includes("age"));
    expect(removed).toBeDefined();
  });

  it("detects required field added", () => {
    const before = { type: "object" as const };
    const after = { type: "object" as const, required: ["email"] };
    const changes = diffSchemas(before, after);
    const reqAdded = changes.find((c) => c.type === "required_added");
    expect(reqAdded).toBeDefined();
    expect(reqAdded?.description).toContain("email");
  });

  it("detects required field removed", () => {
    const before = { type: "object" as const, required: ["email"] };
    const after = { type: "object" as const };
    const changes = diffSchemas(before, after);
    const reqRemoved = changes.find((c) => c.type === "required_removed");
    expect(reqRemoved).toBeDefined();
  });

  it("detects nested property type change", () => {
    const before = { type: "object" as const, properties: { age: { type: "string" as const } } };
    const after = { type: "object" as const, properties: { age: { type: "integer" as const } } };
    const changes = diffSchemas(before, after);
    const typeChange = changes.find((c) => c.type === "type_changed");
    expect(typeChange).toBeDefined();
    expect(typeChange?.path).toContain("properties.age");
  });

  it("includes human-readable description in each change", () => {
    const before = { title: "Old Title" };
    const after = { title: "New Title" };
    const changes = diffSchemas(before, after);
    expect(changes[0].description).toMatch(/title/);
    expect(changes[0].description).toMatch(/Old Title/);
    expect(changes[0].description).toMatch(/New Title/);
  });
});
