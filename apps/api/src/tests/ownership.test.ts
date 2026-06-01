import { describe, expect, it } from "vitest";
import { AppError } from "../utils/AppError";
import { assertProfileBelongsToUser } from "../services/ownership";

describe("assertProfileBelongsToUser", () => {
  it("allows access when the profile belongs to the user", async () => {
    const profile = await assertProfileBelongsToUser({
      profileId: "profile-1",
      userId: "user-1",
      findProfileById: async () => ({ id: "profile-1", user_id: "user-1" }),
    });

    expect(profile.id).toBe("profile-1");
  });

  it("rejects access when profile belongs to another user", async () => {
    await expect(
      assertProfileBelongsToUser({
        profileId: "profile-1",
        userId: "user-1",
        findProfileById: async () => ({ id: "profile-1", user_id: "user-2" }),
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
