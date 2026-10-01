import type { Context } from "hono";
import { reddit } from "@devvit/web/server";

import {
  getCommentIgnorePreference,
  getCommentSettings,
} from "../settings/getters.js";

import {
  checkComments,
  checkPost,
} from "../list_check/list_check.js";

import { executeAction } from "../actions/action.js";

export const handleAction = async (c: Context) => {
  const event = await c.req.json();

  const {
    postId,
    userFlairText,
    userFlairID,
    crosspost,
  } = event.data || {};

  if (!postId) {
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
      `${postId}: Action cancelled (post no longer matches requirements)`
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
      `${postId}: Action cancelled (required comment exists)`
    );

    return c.json({ success: true });
  }

  await executeAction(
    post,
    Boolean(crosspost)
  );

  return c.json({ success: true });
};