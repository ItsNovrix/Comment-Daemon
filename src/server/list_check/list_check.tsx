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

    } else if (
      removedByCategory === "reddit" &&
      !ignorePreference.includes("reddit")
    ) {

    } else if (
      removedByCategory === "automod_filtered" &&
      !ignorePreference.includes("filtered")
    ) {

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
    const isRemoved = comment.isRemoved() || comment.isSpam();
    const bannedAt = comment.bannedAtUtc;

    if (ignorePreference !== "none") {
      if (
        isRemoved &&
        (ignorePreference === "both" || ignorePreference === "removed")
      ) {
        continue;
      }

      if (
        bannedAt &&
        (ignorePreference === "both" || ignorePreference === "filtered")
      ) {
        continue;
      }
    }

    const commentAuthorName = comment.authorName || "";
    const commentAuthorID = comment.authorId || "";

    const isAppComment =
      appUsername.length > 0 && commentAuthorName.toLowerCase() === appUsername;

    if (isAppComment) continue;

    console.log(
      `${comment.id}: Comment scanned`,
      {
        author: commentAuthorName,
        parentId: comment.parentId,
        isAppComment: isAppComment,
        isIgnoredUser: userIgnoreList.includes(commentAuthorName.toLowerCase()),
        isOP: commentAuthorID === postAuthorID,
        checkNonOP: checkNonOP,
        checkTopLevel: checkTopLevel,
        isTopLevel: comment.parentId.startsWith("t3_")
      }
    );

    if (
      !userIgnoreList.includes(commentAuthorName.toLowerCase()) &&
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

      console.log(`${comment.id}: Passed gatekeeper checks. RegexPass: ${regexPass}, BodyLinkPass: ${bodyLinkPass}`);

      if (regexPass && bodyLinkPass) {
        console.log(`${comment.id}: Valid reply found! Returning true.`);
        return true;
      }
    }
  }

  return false;
}