import { reddit } from "@devvit/web/server";
import { getActionSettings } from "../settings/getters.js";

import { formatMail } from "./format_mail.js";

export async function executeAction(
  post: any,
  crosspost: boolean
) {
  const actionSettings = await getActionSettings();

  const action = crosspost
    ? actionSettings.crossAction
    : actionSettings.action;

  if (!action || action === "do_nothing") {
    return;
  }

  switch (action) {
    case "change_flair": {
      if (!actionSettings.changeFlairID) {
        await post.report({
          reason: "No flair template ID configured",
        });
        return;
      }

      try {
        await post.setFlair({
          templateId: actionSettings.changeFlairID,
        });
      } catch (error) {
        console.error(
          `${post.id}: Unable to change flair`,
          error
        );

        await post.report({
          reason: "Invalid flair template ID",
        });
      }

      return;
    }

    case "remove": {
      await removePost(post, actionSettings);
      return;
    }

    case "report": {
      await post.report({
        reason:
          actionSettings.reportReason ||
          "Comment Daemon automated report",
      });

      return;
    }

    default:
      console.warn(
        `${post.id}: Unknown action "${action}"`
      );
  }
}

async function removePost(
  post: any,
  actionSettings: {
    removalReason: string;
    notifyUserVia: string;
    options: string[];
    archiveModmail: boolean;
  }
) {
  let removalReasonText = "";

  if (actionSettings.removalReason) {
    try {
      const reasons =
        await reddit.getRemovalReasons();

      const reason = reasons.find(
        (item: any) =>
          item.title === actionSettings.removalReason ||
          item.id === actionSettings.removalReason
      );

      if (reason) {
        removalReasonText = reason.title;
        await post.remove({
          reasonId: reason.id,
          modNote: `automated removal by Comment Daemon`,
        });
      } else {
        console.warn(
          `${post.id}: Removal reason "${actionSettings.removalReason}" not found`
        );

        await post.report({
          reason: "Invalid removal reason",
        });

        return;
      }
    } catch (error) {
      console.error(
        `${post.id}: Unable to retrieve removal reasons`,
        error
      );

      await post.remove({
        modNote: `automated removal by Comment Daemon`,
      });
    }
  } else {
    await post.remove({
      modNote: `automated removal by Comment Daemon`,
    });
  }

  if (actionSettings.notifyUserVia === "comment") {
    const message = await formatMail(
      actionSettings.options.join("\n"),
      post,
      removalReasonText
    );

    const comment = await post.addComment({
      text: message,
    });

    if (actionSettings.options.includes("distinguish")) {
      await comment.distinguish();
    }

    if (actionSettings.options.includes("sticky")) {
      await comment.sticky();
    }

    if (actionSettings.options.includes("lock")) {
      await comment.lock();
    }

    return;
  }

  if (actionSettings.notifyUserVia === "modmail") {
    const message = await formatMail(
      actionSettings.options.join("\n"),
      post,
      removalReasonText
    );

    const subreddit =
      await reddit.getCurrentSubreddit();

    await reddit.modMail.createModInboxConversation({
      subredditId: subreddit.id,
      subject: "Comment Daemon: Post Removed",
      bodyMarkdown: message,
      ...(actionSettings.archiveModmail
        ? { state: "archived" }
        : {}),
    });
  }
}