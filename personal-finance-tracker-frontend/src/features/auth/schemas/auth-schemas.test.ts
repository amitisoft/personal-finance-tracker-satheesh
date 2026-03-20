import { loginSchema, registerSchema } from "@/features/auth/schemas/auth-schemas";

describe("auth schemas", () => {
  it("rejects invalid login email", () => {
    const result = loginSchema.safeParse({ email: "bad", password: "Password1" });
    expect(result.success).toBe(false);
  });

  it("rejects weak registration password", () => {
    const result = registerSchema.safeParse({ displayName: "A", email: "a@test.com", password: "weak" });
    expect(result.success).toBe(false);
  });
});