import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

// Mock server-only so it doesn't throw in the test environment
vi.mock("server-only", () => ({}));

// Mock next/headers cookies()
const mockSet = vi.fn();
const mockCookieStore = { set: mockSet };
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  mockSet.mockClear();
});

test("createSession sets the auth-token cookie", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "test@example.com");

  expect(mockSet).toHaveBeenCalledOnce();
  const [cookieName] = mockSet.mock.calls[0];
  expect(cookieName).toBe("auth-token");
});

test("createSession produces a valid JWT containing userId and email", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-42", "hello@example.com");

  const token = mockSet.mock.calls[0][1] as string;
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("hello@example.com");
});

test("createSession sets httpOnly and correct cookie options", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "test@example.com");

  const options = mockSet.mock.calls[0][2] as Record<string, unknown>;
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession sets secure:false outside production", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "test@example.com");

  const options = mockSet.mock.calls[0][2] as Record<string, unknown>;
  expect(options.secure).toBe(false);
});

test("createSession sets secure:true in production", async () => {
  const original = process.env.NODE_ENV;
  // @ts-expect-error NODE_ENV is read-only in types but writable at runtime
  process.env.NODE_ENV = "production";
  try {
    vi.resetModules();
    const { createSession } = await import("@/lib/auth");
    await createSession("user-1", "test@example.com");

    const options = mockSet.mock.calls[0][2] as Record<string, unknown>;
    expect(options.secure).toBe(true);
  } finally {
    // @ts-expect-error
    process.env.NODE_ENV = original;
    vi.resetModules();
  }
});

test("createSession sets cookie expiry approximately 7 days from now", async () => {
  const before = Date.now();
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "test@example.com");
  const after = Date.now();

  const options = mockSet.mock.calls[0][2] as Record<string, unknown>;
  const expires = options.expires as Date;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession JWT expiry matches the cookie expiry", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "test@example.com");

  const token = mockSet.mock.calls[0][1] as string;
  const options = mockSet.mock.calls[0][2] as Record<string, unknown>;
  const { payload } = await jwtVerify(token, JWT_SECRET);

  const jwtExpMs = (payload.exp as number) * 1000;
  const cookieExpMs = (options.expires as Date).getTime();

  // Allow 5 s tolerance between the two expiry timestamps
  expect(Math.abs(jwtExpMs - cookieExpMs)).toBeLessThan(5000);
});
