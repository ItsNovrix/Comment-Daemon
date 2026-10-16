import type { Context } from "hono";
import { reddit, scheduler } from "@devvit/web/server";

import {
  getCommentIgnorePreference,
  getCommentSettings,
} from "../settings/getters.js";

import {
  checkComments,
  checkPost,
} from "../list_check/list_check.js";

export const handleReminder = async (c: Context) => {
  const event = await c.req.json();

  const {
    postId,
    removeDelay,
    message,
    rawOptions,
    userFlairText,
    userFlairID,
  } = event.data || {};

  if (!postId || !message) {
    return c.json({ success: true });
  }

  const post = await reddit.getPostById(postId);

  const postMatches = await checkPost(
    post,
    userFlairText || "",
    userFlairID || ""
  );

  if (!postMatches) {
    console.info(
      `${postId}: Reminder cancelled (post no longer matches requirements)`
    );

    return c.json({ success: true });
  }

  const commentSettings = await getCommentSettings();

  const commentIgnorePreference =
    await getCommentIgnorePreference();

  const hasRequiredComment = await checkComments(
    post,
    commentSettings,
    commentIgnorePreference
  );

  if (hasRequiredComment) {
    console.info(
      `${postId}: Reminder cancelled (required comment exists)`
    );

    return c.json({ success: true });
  }

  const comment = await post.addComment({
    text: message,
  });

  const options = Array.isArray(rawOptions)
    ? rawOptions
    : [];

  const shouldDistinguish = options.includes("distinguish");
  const shouldSticky = options.includes("sticky");

  if (shouldDistinguish || shouldSticky) {
    await comment.distinguish(shouldSticky);
  }

  if (options.includes("lock")) {
    await comment.lock();
  }

  if (removeDelay && removeDelay > 0) {
    await scheduler.runJob({
      name: "reminder-removal",
      data: {
        commentID: comment.id,
      },
      runAt: new Date(
        Date.now() + removeDelay * 60 * 1000
      ),
    });
  }

  return c.json({ success: true });
};