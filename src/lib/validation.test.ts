import { describe, expect, it } from "vitest";
import { parseAccountDetails, parseNewAccount } from "./validation";

function form(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

const good = {
  parent_first_name: " Sam ",
  child_first_name: "Mia",
  avatar: "moon",
  phone: "",
  email: "Sam@Example.com ",
  password: "correct horse",
};

describe("parseNewAccount", () => {
  it("accepts valid details and tidies them", () => {
    const result = parseNewAccount(form(good));
    expect(result).toEqual({
      ok: true,
      data: {
        parentFirstName: "Sam",
        childFirstName: "Mia",
        avatar: "moon",
        phone: null,
        email: "sam@example.com",
        password: "correct horse",
      },
    });
  });

  it("explains every problem at once, in plain words", () => {
    const result = parseNewAccount(form({ ...good, parent_first_name: "", child_first_name: "", email: "sam", password: "short" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors).toEqual({
      parent_first_name: "Please enter your first name.",
      child_first_name: "Please enter your child’s first name.",
      email: "Please enter a valid email address.",
      password: "Please choose a password with at least 8 characters.",
    });
  });

  it("keeps what was typed (except the password) so it isn't lost", () => {
    const result = parseNewAccount(form({ ...good, password: "x" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.values).toMatchObject({ parent_first_name: "Sam", email: "sam@example.com" });
    expect(Object.values(result.values)).not.toContain("x");
  });
});

describe("parseAccountDetails", () => {
  it("falls back to a default picture for unknown values", () => {
    const result = parseAccountDetails(form({ ...good, avatar: "dragon" }));
    expect(result.ok && result.data.avatar).toBe("star");
  });

  it("accepts common phone formats and rejects nonsense", () => {
    expect(parseAccountDetails(form({ ...good, phone: "+44 7700 900123" })).ok).toBe(true);
    expect(parseAccountDetails(form({ ...good, phone: "(01632) 960-001" })).ok).toBe(true);
    expect(parseAccountDetails(form({ ...good, phone: "call me" })).ok).toBe(false);
  });

  it("limits name length", () => {
    expect(parseAccountDetails(form({ ...good, child_first_name: "x".repeat(41) })).ok).toBe(false);
  });
});
