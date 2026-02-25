import type { UserPublic } from "@dashboard/shared-types";

export interface UserRecord extends UserPublic {
  passwordHash: string;
}
