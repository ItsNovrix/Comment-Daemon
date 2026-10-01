import { settings } from "@devvit/web/server";
import { formatMessage } from "./format_message.js";

/**
 * Returns the ListPreference setting.
 */
export async function getListPreference() {
  const listPreference =
    (await settings.get("list-preference")) || ["none"];

  return Array.isArray(listPreference)
    ? String(listPreference[0])
    : String(listPreference);
}

/**
 * Returns the IgnorePreference setting.
 */
export async function getIgnorePreference() {
  const ignorePreference =
    (await settings.get("ignore-preference")) || [];

  return Array.isArray(ignorePreference)
    ? ignorePreference
    : [];
}

/**
 * Returns the CommentIgnorePreference setting.
 */
export async function getCommentIgnorePreference() {
  const ignorePreference =
    (await settings.get("comment-ignore-preference")) || ["both"];

  return Array.isArray(ignorePreference)
    ? String(ignorePreference[0])
    : String(ignorePreference);
}

/**
 * Returns the Whitelist settings.
 */
export async function getWhitelistSettings() {
  const rawTitleRegex =
    await settings.get("wl-title-regex");

  let caseSensitiveTitleRegex =
    await settings.get("wl-title-regex-case");

  caseSensitiveTitleRegex = caseSensitiveTitleRegex ? "" : "i";

  const titleRegex = rawTitleRegex
    ? RegExp(String(rawTitleRegex), caseSensitiveTitleRegex)
    : null;

  const rawBodyRegex =
    await settings.get("wl-body-regex");

  let caseSensitiveBodyRegex =
    await settings.get("wl-body-regex-case");

  caseSensitiveBodyRegex = caseSensitiveBodyRegex ? "" : "i";

  const bodyRegex = rawBodyRegex
    ? RegExp(String(rawBodyRegex), caseSensitiveBodyRegex)
    : null;

  return {
    titleRegex,
    bodyRegex,

    bodyLinkRequired:
      Boolean(await settings.get("wl-body-link")) || false,

    bodyLength:
      Number(await settings.get("wl-body-length")) || 0,

    flairTexts: (String(
      await settings.get("wl-flair-text")
    ) || "")
      .split(",")
      .map((flair) => flair.trim().toLowerCase())
      .filter((flair) => flair.length > 0),

    flairIDs: (String(
      await settings.get("wl-flair-ids")
    ) || "")
      .split(",")
      .map((flair) => flair.trim())
      .filter((flair) => flair.length > 0),

    userFlairTexts: (String(
      await settings.get("wl-user-flair-text")
    ) || "")
      .split(",")
      .map((flair) => flair.trim().toLowerCase())
      .filter((flair) => flair.length > 0),

    userFlairIDs: (String(
      await settings.get("wl-user-flair-ids")
    ) || "")
      .split(",")
      .map((flair) => flair.trim())
      .filter((flair) => flair.length > 0),
  };
}

/**
 * Returns the Blacklist settings.
 */
export async function getBlacklistSettings() {
  const rawTitleRegex =
    await settings.get("bl-title-regex");

  let caseSensitiveTitleRegex =
    await settings.get("bl-title-regex-case");

  caseSensitiveTitleRegex = caseSensitiveTitleRegex ? "" : "i";

  const titleRegex = rawTitleRegex
    ? RegExp(String(rawTitleRegex), caseSensitiveTitleRegex)
    : null;

  const rawBodyRegex =
    await settings.get("bl-body-regex");

  let caseSensitiveBodyRegex =
    await settings.get("bl-body-regex-case");

  caseSensitiveBodyRegex = caseSensitiveBodyRegex ? "" : "i";

  const bodyRegex = rawBodyRegex
    ? RegExp(String(rawBodyRegex), caseSensitiveBodyRegex)
    : null;

  return {
    titleRegex,
    bodyRegex,

    bodyLinkRequired:
      Boolean(await settings.get("bl-body-link")) || false,

    bodyLength:
      Number(await settings.get("bl-body-length")) || 0,

    flairTexts: (String(
      await settings.get("bl-flair-text")
    ) || "")
      .split(",")
      .map((flair) => flair.trim().toLowerCase())
      .filter((flair) => flair.length > 0),

    flairIDs: (String(
      await settings.get("bl-flair-ids")
    ) || "")
      .split(",")
      .map((flair) => flair.trim())
      .filter((flair) => flair.length > 0),

    userFlairTexts: (String(
      await settings.get("bl-user-flair-text")
    ) || "")
      .split(",")
      .map((flair) => flair.trim().toLowerCase())
      .filter((flair) => flair.length > 0),

    userFlairIDs: (String(
      await settings.get("bl-user-flair-ids")
    ) || "")
      .split(",")
      .map((flair) => flair.trim())
      .filter((flair) => flair.length > 0),
  };
}

/**
 * Returns the Comment settings.
 */
export async function getCommentSettings() {
  const checkTopLevel =
    Boolean(await settings.get("comment-level")) || false;

  const checkNonOP =
    Boolean(await settings.get("comment-author")) || false;

  const userIgnoreList =
    (String(
      await settings.get("comment-user-ignore")
    ) || "")
      .split(",")
      .map((flair) => flair.trim().toLowerCase())
      .filter((flair) => flair.length > 0);

  const acceptAnyComment =
    Boolean(await settings.get("accept-any-comment")) || false;

  if (acceptAnyComment) {
    return {
      checkTopLevel,
      checkNonOP,
      userIgnoreList,
      commentRegex: null,
      bodyLinkRequired: false,
    };
  }

  const rawCommentRegex =
    await settings.get("comment-body-regex");

  let caseSensitiveRegex =
    await settings.get("comment-regex-case");

  caseSensitiveRegex = caseSensitiveRegex ? "" : "i";

  const commentRegex = rawCommentRegex
    ? RegExp(String(rawCommentRegex), caseSensitiveRegex)
    : null;

  return {
    checkTopLevel,
    checkNonOP,
    userIgnoreList,
    commentRegex,
    bodyLinkRequired:
      Boolean(
        await settings.get("comment-body-link")
      ) || false,
  };
}

/**
 * Returns the Notice/Reminder settings.
 */
export async function getReminderSettings(post: any) {
  const rawMessage =
    String(await settings.get("reminder-message")) || "";

  const random =
    (String(await settings.get("reminder-random")) || "")
      .split(";")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

  const message =
    rawMessage.length > 0
      ? await formatMessage(rawMessage, random, post)
      : "";

  const rawOptions =
    (await settings.get("reminder-options")) || [];

  const options = Array.isArray(rawOptions)
    ? rawOptions
    : [];

  return {
    enabled:
      Boolean(
        await settings.get("reminder-enable")
      ) || false,

    delay:
      parseInt(
        String(await settings.get("reminder-delay"))
      ) || 5,

    removeDelay:
      parseInt(
        String(
          await settings.get("reminder-remove-delay")
        )
      ) || 0,

    message,
    options,
  };
}

/**
 * Returns the Action settings.
 */
export async function getActionSettings() {
  const rawOptions =
    (await settings.get("action-notify-options")) || [];

  const options = Array.isArray(rawOptions)
    ? rawOptions
    : [];

  return {
    action:
      String(
        await settings.get("missing-link-action")
      ) || "",

    crossAction:
      String(
        await settings.get("missing-link-cross-action")
      ) || "",

    delay:
      parseInt(
        String(
          await settings.get("missing-link-delay")
        )
      ) || 10,

    reportReason:
      String(
        await settings.get("report-reason")
      ) || "",

    changeFlairID:
      String(
        await settings.get("change-flair-id")
      ) || "",

    removalReason:
      String(
        await settings.get("removal-reason")
      ) || "",

    notifyUserVia:
      String(
        await settings.get("notify-user-via")
      ) || "do_nothing",

    options,

    archiveModmail:
      Boolean(
        await settings.get("modmail-archive")
      ) || false,
  };
}