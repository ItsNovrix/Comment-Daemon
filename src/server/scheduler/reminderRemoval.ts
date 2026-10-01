import type { Context } from "hono";
import { reddit } from "@devvit/web/server";

export const handleReminderRemoval = async (c: Context) => {
  const event = await c.req.json();

  const { commentID } = event.data || {};

  if (!commentID) {
    return c.json({ success: true });
  }

  const comment = await reddit.getCommentById(commentID);

  if (!comment) {
    return c.json({ success: true });
  }

  if (
    comment.isRemoved() ||
    comment.isSpam() ||
    comment.bannedAtUtc
  ) {
    return c.json({ success: true });
  }

  await comment.remove();

  return c.json({ success: true });
};