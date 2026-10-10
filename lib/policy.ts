export type Actor = { id: string; accessLevel: string; status: string };
export function isAdmin(actor: Actor) {
  return actor.status === "active" && actor.accessLevel === "administrator";
}
export function canEdit(actor: Actor, ownerId: string) {
  return actor.status === "active" && (actor.id === ownerId || isAdmin(actor));
}
export function canViewPortfolio(
  actor: Actor | null,
  item: { ownerId: string; visibility: string },
) {
  return (
    item.visibility === "public" || (!!actor && canEdit(actor, item.ownerId))
  );
}
export function canReview(actor: Actor, applicantId: string) {
  return isAdmin(actor) && actor.id !== applicantId;
}
export function isVerifiedStudent(status?: string | null) {
  return status === "approved";
}
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export function detectImage(
  bytes: Uint8Array,
): "image/png" | "image/jpeg" | null {
  if (
    bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
  )
    return "image/png";
  if (
    bytes.length >= 3 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  )
    return "image/jpeg";
  return null;
}
