import { AppError } from "../utils/AppError";
import type { DataService, Row } from "./dataService";

export type ProfileLookup = (profileId: string) => Promise<Row | null>;

export async function assertProfileBelongsToUser(input: {
  profileId: string;
  userId: string;
  findProfileById: ProfileLookup;
}): Promise<Row> {
  const profile = await input.findProfileById(input.profileId);

  if (!profile || profile.user_id !== input.userId) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Profile was not found for this user.");
  }

  return profile;
}

export class OwnershipService {
  constructor(private readonly data: DataService) {}

  async assertProfile(profileId: string, userId: string): Promise<Row> {
    return assertProfileBelongsToUser({
      profileId,
      userId,
      findProfileById: (id) => this.data.maybeRawById("profiles", id),
    });
  }

  async assertResourceProfile(
    table: string,
    id: string,
    userId: string,
    profileColumn = "profile_id",
  ): Promise<Row> {
    const record = await this.data.getRawById(table, id);
    const profileId = record[profileColumn];

    if (typeof profileId !== "string") {
      throw new AppError(500, "OWNERSHIP_COLUMN_MISSING", `Missing ${profileColumn} on ${table}.`);
    }

    await this.assertProfile(profileId, userId);
    return record;
  }

  async assertChatThread(threadId: string, userId: string): Promise<Row> {
    return this.assertResourceProfile("ai_chat_threads", threadId, userId);
  }
}
