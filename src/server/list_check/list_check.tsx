import { reddit } from "@devvit/web/server";

import {
  getBlacklistSettings,
  getIgnorePreference,
  getListPreference,
  getWhitelistSettings,
} from "../settings/getters.js";

import {
  containsLink,
  fetchAllComments,
  getPostParams,
} from "./helpers.js";

/**
 * Given a set of post parameters and black/whitelist settings,
 * returns whether the given post matches the given criteria.
 *
 * - whitelist: all criteria must be true.
 * - blacklist: all criteria must be false.
 */
export function checkPostParams(
  postParams: {
    id: string;
    title: string;
    body: string;
    flairText: string;
    flairID: string;
    userFlairText: string;
    userFlairID: string;
  },
  settings: {
    titleRegex: RegExp | null;
    bodyRegex: RegExp | null;
    bodyLinkRequired: boolean;
    bodyLength: number;
    flairTexts: string[];
    flairIDs: string[];
    userFlairTexts: string[];
    userFlairIDs: string[];
  },
  listPreference: string
): boolean {
  const {
    titleRegex,
    bodyRegex,
    bodyLinkRequired,
    bodyLength,
    flairTexts,
    flairIDs,
    userFlairTexts,
    userFlairIDs,
  } = settings;

  const def = listPreference === "whitelist";

  const titlePass = titleRegex
    ? titleRegex.test(postParams.title)
    : def;

  const bodyPass = bodyRegex
    ? bodyRegex.test(postParams.body)
    : def;

  const bodyLinkPass = bodyLinkRequired
    ? containsLink(postParams.body)
    : def;

  const bodyLengthPass = bodyLength
    ? postParams.body.length >= bodyLength
    : def;

  const flairTextPass =
    flairTexts.length > 0
      ? flairTexts.includes(postParams.flairText.toLowerCase())
      : def;

  const flairIDPass =
    flairIDs.length > 0
      ? flairIDs.includes(postParams.flairID)
      : def;

  const userFlairTextPass =
    userFlairTexts.length > 0
      ? userFlairTexts.includes(
          postParams.userFlairText.toLowerCase()
        )
      : def;

  const userFlairIDPass =
    userFlairIDs.length > 0
      ? userFlairIDs.includes(postParams.userFlairID)
      : def;

  console.log(
    `${def}: ${titlePass}, ${bodyPass}, ${bodyLinkPass}, ${bodyLengthPass}, ${flairTextPass}, ${flairIDPass}, ${userFlairTextPass}, ${userFlairIDPass}`
  );

  return def
    ? titlePass &&
        bodyPass &&
        bodyLinkPass &&
        bodyLengthPass &&
        flairTextPass &&
        flairIDPass &&
        userFlairTextPass &&
        userFlairIDPass
    : !(
        titlePass ||
        bodyPass ||
        bodyLinkPass ||
        bodyLengthPass ||
        flairTextPass ||
        flairIDPass ||
        userFlairTextPass ||
        userFlairIDPass
      );
}

/**
 * Given a post, compare it against the ignore preference and
 * black/whitelist settings.
 *
 * Returns true if the post should be processed further.
 */
export async function checkPost(
  post: any,
  userFlairText: string,
  userFlairID: string
) {
  const removedByCategory = post.removedByCategory;
  const ignorePreference = await getIgnorePreference();

  if (removedByCategory || post.isApproved()) {
    if (
      post.isApproved() &&
      ignorePreference.includes("approved")
    ) {
      console.info(
        `${post.id}: Ignoring (post is approved)`
      );
      return false;
    }

    if (
      (removedByCategory === "author" ||
        removedByCategory === "moderator") &&
      !ignorePreference.includes("removed")
    ) {
      // Continue processing.
    } else if (
      removedByCategory === "reddit" &&
      !ignorePreference.includes("reddit")
    ) {
      // Continue processing.
    } else if (
      removedByCategory === "automod_filtered" &&
      !ignorePreference.includes("filtered")
    ) {
      // Continue processing.
    } else {
      console.info(
        `${post.id}: Ignoring (post is removed/deleted: ${removedByCategory})`
      );
      return false;
    }
  }

  const postParams = await getPostParams(
    post,
    userFlairText,
    userFlairID
  );

  const listPreference = await getListPreference();

  if (listPreference === "whitelist") {
    return checkPostParams(
      postParams,
      await getWhitelistSettings(),
      "whitelist"
    );
  }

  if (listPreference === "blacklist") {
    return checkPostParams(
      postParams,
      await getBlacklistSettings(),
      "blacklist"
    );
  }

  if (listPreference === "both") {
    return (
      checkPostParams(
        postParams,
        await getWhitelistSettings(),
        "whitelist"
      ) &&
      checkPostParams(
        postParams,
        await getBlacklistSettings(),
        "blacklist"
      )
    );
  }

  return false;
}

/**
 * Given a post and comment requirements, check if a matching
 * comment already exists.
 */
export async function checkComments(
  post: any,
  settings: {
    checkTopLevel: boolean;
    checkNonOP: boolean;
    userIgnoreList: string[];
    commentRegex: RegExp | null;
    bodyLinkRequired: boolean;
  },
  ignorePreference: string
) {
  const {
    checkTopLevel,
    checkNonOP,
    userIgnoreList,
    commentRegex,
    bodyLinkRequired,
  } = settings;

  const postAuthorID = post.authorId || "";

  const appUser = await reddit.getAppUser();
  const appUsername = appUser?.username?.toLowerCase() || "";

  const comments = await fetchAllComments(post);

  for (const comment of comments) {
    const isRemoved =
      comment.isRemoved() || comment.isSpam();

    const bannedAt = comment.bannedAtUtc;

    if (ignorePreference !== "none") {
      if (
        isRemoved &&
        (ignorePreference === "both" ||
          ignorePreference === "removed")
      ) {
        console.info(
          `${comment.id}: Ignoring (comment removed)`
        );
        continue;
      }

      if (
        bannedAt &&
        (ignorePreference === "both" ||
          ignorePreference === "filtered")
      ) {
        console.info(
          `${comment.id}: Ignoring (comment filtered)`
        );
        continue;
      }
    }

    const commentAuthorName =
      comment.authorName || "";

    const commentAuthorID =
      comment.authorId || "";

    const isAppComment =
      appUsername.length > 0 &&
      commentAuthorName.toLowerCase() === appUsername;

    if (
      !isAppComment &&
      !userIgnoreList.includes(
        commentAuthorName.toLowerCase()
      ) &&
      (checkNonOP || commentAuthorID === postAuthorID) &&
      (checkTopLevel
        ? comment.parentId.startsWith("t3_")
        : !comment.parentId.startsWith("t3_"))
    ) {
      const regexPass = commentRegex
        ? commentRegex.test(comment.body)
        : true;

      const bodyLinkPass = bodyLinkRequired
        ? containsLink(comment.body)
        : true;

      if (regexPass && bodyLinkPass) {
        return true;
      }
    }
  }

  return false;
}