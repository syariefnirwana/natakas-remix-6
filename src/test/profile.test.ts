import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), maybeSingle: vi.fn(), signed: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({ useQuery: (options: unknown) => options }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getUser: mocks.getUser },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }) }),
  storage: { from: () => ({ createSignedUrl: mocks.signed }) },
} }));

import { useAvatarUrl, useProfile, useUser } from "@/lib/data";
const query = (value: unknown) => (value as { queryFn: () => Promise<unknown> }).queryFn();

describe("profile persistence errors", () => {
  beforeEach(() => vi.clearAllMocks());
  it("reports denied profile reads rather than presenting an empty profile", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "owner" } } });
    const error = new Error("permission denied for table profiles");
    mocks.maybeSingle.mockResolvedValue({ data: null, error });
    await expect(query(useProfile())).rejects.toThrow(error.message);
  });
  it("reads the persisted name and avatar", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "owner" } } });
    const profile = { id: "owner", display_name: "Nama tersimpan", avatar_url: "owner/photo.jpg" };
    mocks.maybeSingle.mockResolvedValue({ data: profile, error: null });
    await expect(query(useProfile())).resolves.toEqual(profile);
  });
  it("reports avatar access failures", async () => {
    mocks.signed.mockResolvedValue({ data: null, error: new Error("Avatar access denied") });
    await expect(query(useAvatarUrl("owner/photo.jpg"))).rejects.toThrow("Avatar access denied");
  });
  it("reports an expired session instead of hiding the auth error", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error("Session expired") });
    await expect(query(useUser())).rejects.toThrow("Session expired");
  });
});