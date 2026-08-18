import { describe, it, expect } from "vitest";

type Status = "active" | "pending" | "suspended" | "banned" | null;
const canAccess = (status: Status, isAdmin = false) => isAdmin || status === "active" || status === null;

describe("access control by user.status", () => {
  it("pending user → blocked", () => {
    expect(canAccess("pending")).toBe(false);
  });
  it("banned/blocked user → blocked", () => {
    expect(canAccess("banned")).toBe(false);
  });
  it("suspended user → blocked", () => {
    expect(canAccess("suspended")).toBe(false);
  });
  it("active user → full access", () => {
    expect(canAccess("active")).toBe(true);
  });
  it("admin → always allowed regardless of status", () => {
    expect(canAccess("pending", true)).toBe(true);
    expect(canAccess("banned", true)).toBe(true);
  });
});
