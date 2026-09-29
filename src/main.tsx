import { Devvit } from "@devvit/public-api";
import { DateTime } from "ts-luxon";

import { addSettings } from "./settings/settings.js";
import {
	getActionSettings,
	getCommentIgnorePreference,
	getCommentSettings,
	getReminderSettings
} from "./settings/getters.js";
import { checkComments, checkPost } from "./list_check/list_check.js";
import { executeAction } from "./actions/action.js";
import { sendReminder } from "./actions/reminder.js";

Devvit.configure({
	redditAPI: true
});

addSettings();

// ==========================================================
// 4. TRIGGERS
// ==========================================================

// --- NEW POST ---

Devvit.addTrigger({
	event: "PostCreate", onEvent: async(event, context) => {
		const postV2 = event.post;

		if (!postV2) {
			return;
		}

		const postId = postV2.id;
		const post = await context.reddit.getPostById(postId);

		let userFlairText = "";
		let userFlairID = "";
		const userFlair = event.author?.flair;

		if (userFlair) {
			userFlairText = userFlair.text;
			userFlairID = userFlair.templateId;
		}

		if (!(await checkPost(context, post, userFlairText, userFlairID))) {
			console.info(`${postId}: Ignoring (post doesn't match requirements)`);
			return;
		}

		console.info(`${postId}: Processing (post matches requirements)`);

		const reminderSettings = await getReminderSettings(post, context);
		const actionSettings = await getActionSettings(context);
		const now = DateTime.now();

		if (reminderSettings.enabled && reminderSettings.message) {

			if (reminderSettings.delay >= 10) {
				console.info(`${postId}: Scheduling Reminder`);
				const jobId = await context.scheduler.runJob({
					name: "reminder", data: {
						postId: postId,
						removeDelay: reminderSettings.removeDelay,
						message: reminderSettings.message,
						rawOptions: reminderSettings.options,
						userFlairText: userFlairText,
						userFlairID: userFlairID
					}, runAt: now.plus({minutes: reminderSettings.delay}).toJSDate()
				});
			} else {
				await sendReminder(context, post, reminderSettings.removeDelay, reminderSettings.message,
					reminderSettings.options, now);
			}
		}

		if (postV2.crosspostParentId && !(actionSettings.crossAction == "default")) {
			if (actionSettings.crossAction == "do_nothing") {
				return;
			}

			console.info(`${postId}: Scheduling Crosspost Action (${actionSettings.crossAction})`);
			const jobId = await context.scheduler.runJob({
				name: "action", data: {
					postId: postId, userFlairText: userFlairText, userFlairID: userFlairID, crosspost: true
				}, runAt: now.plus({minutes: actionSettings.delay}).toJSDate()
			});
		} else if (actionSettings.action && !(actionSettings.action == "do_nothing")) {
			console.info(`${postId}: Scheduling Action (${actionSettings.action})`);
			const jobId = await context.scheduler.runJob({
				name: "action", data: {
					postId: postId, userFlairText: userFlairText, userFlairID: userFlairID, crosspost: false
				}, runAt: now.plus({minutes: actionSettings.delay}).toJSDate()
			});
		}

	}
});

// --- APP INSTALL MESSAGE ---

Devvit.addTrigger({
  event: "AppInstall",
  async onEvent(event, context) {
    console.log(`App installed on r/${event.subreddit?.name}.`);

    const subreddit = await context.reddit.getCurrentSubreddit();
    const appAccount = await context.reddit.getAppUser();

    var firstMsg = `Hello r/${subreddit.name} mods,\n\n`;

    ((firstMsg += `Thanks for installing **Comment Daemon**!\n\n`),
      (firstMsg += `Comment Daemon is a flexible app that helps mod teams drop custom comments ("Notices") on subreddit posts and can automatically take action if users don't interact with the notices.\n\n`));

    /* QUICK START */
    ((firstMsg += `**How Comment Daemon Works**\n\n\n`),
	  (firstMsg += `Comment Daemon operates on a fairly straightforward Target ➔ Notice ➔ Action workflow:\n`),
      (firstMsg += `- 1) **Target** — Choose which posts Comment Daemon should act on or ignore using flexible Whitelist and Blacklist settings (filter by post content, flairs, links, and more).\n`),
      (firstMsg += `- 2) **Notice** — Comment Daemon will automatically leave a custom comment on matching posts. You can set these notices to stay permanently, or automatically delete themselves after a set time to keep comment sections clean.\n`),
      (firstMsg += `- 3) **Action** — If enabled, Comment Daemon starts a countdown clock. If the original poster fails to reply to the post within your set timeframe, Comment Daemon automatically executes your chosen action:\n\n`));

    /* COMMON USES */
    ((firstMsg += `**Common Use Cases**\n\n\n`),
      (firstMsg += `- **Sticky Announcements & Promo** — Permanently sticky and distinguish a message on every new post promoting your community Discord, upcoming AMAs, or other important notices.\n`),
      (firstMsg += `- **Rules Reminder** — Drop a standard rule reminder on specific flairs to help reduce rule-breaking comments.\n`),
      (firstMsg += `- **Content Attribution Enforcement** — Automatically ask creators to credit their sources. If they don't reply within a set time frame, the post is automatically removed.\n`),
      (firstMsg += `- **Mandatory Interaction Gate** — Require users to explain their post (similar to r/AmITheAsshole). If they don't respond to the prompt in time, the post goes to the mod queue.\n`));

	/* CONFIGURATION */
    ((firstMsg += `**Configuring Comment Daemon**\n\n\n`),
      (firstMsg += `Comment Daemon configuration currently consists of five sections:\n`),
      (firstMsg += `- What type of filtering should the bot honor (whitelist, blacklist, both, or none)?\n`),
      (firstMsg += `- What posts should the bot act on (whitelist), and what posts should the bot ignore (blacklist)?\n`),
	  (firstMsg += `- What type of comments should Comment Daemon look for in the post and how should they be configured?\n`),
	  (firstMsg += `- Should a notice be sent to the OP?\n`),
	  (firstMsg += `- What should be done if the OP doesn't respond to their notice?\n`),
      (firstMsg += `Whether you need a simple tool to pin a Discord link, need a temporary rule reminder, or want to implement strict time-limit based enforcement for content attribution, Comment Daemon handles it all seamlessly!\n`));

    /* CONFIG LINKS */
    ((firstMsg += `**Configure now:** manage templates, auto-flair, and Discord settings here → `),
      (firstMsg += `[ Comment Daemon settings](https://developers.reddit.com/r/${subreddit.name}/apps/comment-scout)\n\n`));

    /* FOOTER */
    ((firstMsg += `[Terms & Conditions](https://www.reddit.com/r/NovrixApps/wiki/comment-scout/terms-and-conditions) | `),
      (firstMsg += `[Privacy Policy](https://www.reddit.com/r/NovrixApps/wiki/comment-scout/privacy-policy/) | `),
      (firstMsg += `[Contact](https://reddit.com/r/NovrixApps)\n\n`));

    await context.reddit.sendPrivateMessageAsSubreddit({
      fromSubredditName: subreddit.name,
      to: "comment-scout",
      subject: `Thanks for installing Comment Daemon!`,
      text: firstMsg,
    });
    console.log(`Message sent to r/${event.subreddit?.name} mods.`);

    await context.reddit.setUserFlair({
      subredditName: subreddit.name,
      username: appAccount.username,
      text: "Mod Bot 🛡️",
      textColor: "light",
      backgroundColor: "#2200ff",
    });
  },
});

// --- APP UPGRADE MESSAGE ---

Devvit.addTrigger({
  event: "AppUpgrade",
  async onEvent(event, context) {
    console.log(`App updated on r/${event.subreddit?.name}.`);

    const subreddit = await context.reddit.getCurrentSubreddit();
    const appAccount = await context.reddit.getAppUser();

    var firstMsg = `Hello r/${subreddit.name} mods,\n\n`;

    ((firstMsg += `Thanks for updating **Comment Daemon**!\n\n`),
      (firstMsg += `Comment Daemon is a flexible app that helps mod teams drop custom comments ("Notices") on subreddit posts and can automatically take action if users don't interact with the notices.\n\n`));

    /* WHAT'S NEW */
    ((firstMsg += `**What's new (highlights):**\n\n\n`),
      (firstMsg += `- **Devvit Update** — Comment Daemon has been updated to the latest Devvit release for continued functionality and stability.\n`),
      (firstMsg += `- **App Triggers Update** — Added app install/upgrade triggers to provide mod teams with usefull tips/information on install/upgrade (like this message!).\n`),
      (firstMsg += `- **Updated support subreddit links** — r/CommentScout has been sunset, support subreddit has been moved to [r/NovrixApps](https://www.reddit.com/r/NovrixApps).\n\n`));

    /* REMINDERS */
    ((firstMsg += `**Good to know / reminders:**\n\n\n`),
      (firstMsg += `Comment Daemon configuration currently consists of five sections:\n`),
      (firstMsg += `- What type of filtering should the bot honor (whitelist, blacklist, both, or none)?\n`),
      (firstMsg += `- What posts should the bot act on (whitelist), and what posts should the bot ignore (blacklist)?\n`),
	  (firstMsg += `- What type of comments should Comment Daemon look for in the post and how should they be configured?\n`),
	  (firstMsg += `- Should a notice be sent to the OP?\n`),
	  (firstMsg += `- What should be done if the OP doesn't respond to their notice?\n`),
      (firstMsg += `Whether you need a simple tool to pin a Discord link, need a temporary rule reminder, or want to implement strict time-limit based enforcement for content attribution, Comment Daemon handles it all seamlessly!\n`));

    /* CONFIG LINKS */
    ((firstMsg += `**Configure now:** manage templates, scheduling, notifications, and more settings here → [Comment Daemon settings](https://developers.reddit.com/r/${subreddit.name}/apps/comment-scout)\n\n\n`));

    /* FOOTER */
    ((firstMsg += `[Terms & Conditions](https://www.reddit.com/r/NovrixApps/wiki/comment-scout/terms-and-conditions) | `),
      (firstMsg += `[Privacy Policy](https://www.reddit.com/r/NovrixApps/wiki/comment-scout/privacy-policy/) | `),
      (firstMsg += `[Contact](https://reddit.com/r/NovrixApps)\n\n`));

    await context.reddit.sendPrivateMessageAsSubreddit({
      fromSubredditName: subreddit.name,
      to: "comment-scout",
      subject: `Comment Daemon: App Update`,
      text: firstMsg,
    });
    console.log(`Message sent to r/${event.subreddit?.name} mods.`);
    await context.reddit.setUserFlair({
      subredditName: subreddit.name,
      username: appAccount.username,
      text: "Mod Bot 🛡️",
      textColor: "light",
      backgroundColor: "#2200ff",
    });
  },
});

Devvit.addSchedulerJob({
	name: "reminder", onRun: async(event, context) => {
		const {postId, removeDelay, message, rawOptions, userFlairText, userFlairID} = event.data!;

		console.info(`${postId}: Processing Reminder`);

		if (!postId || !message) {
			return;
		}

		const post = await context.reddit.getPostById(postId.toString());

		if (!(await checkPost(context, post, String(userFlairText), String(userFlairID))) || await checkComments(
			context, post, await getCommentSettings(context), await getCommentIgnorePreference(context))) {
			console.info(`${postId}: Reminder Cancelled (post doesn't match requirements)`);
			return;
		}

		console.info(`${postId}: Sending Reminder`);

		const comment = await post.addComment({
			text: message.toString()
		});

		const options = Array.isArray(rawOptions) ? rawOptions : [];
		await comment.lock();

		// Set mod options
		if (options.length > 0) {
			if (options.includes("sticky")) {
				await comment.distinguish(true);
			} else if (options.includes("distinguish")) {
				await comment.distinguish(false);
			}
                        if (options.includes("lock")) {
				await comment.lock();
                     }
		}

		if (Number(removeDelay) > 0) {
			console.info(`${postId}: Scheduling Reminder Removal (${comment.id})`);
			const now = DateTime.now();

			const jobId = await context.scheduler.runJob({
				name: "reminder-removal", data: {
					commentID: comment.id.toString()
				}, runAt: now.plus({minutes: Number(removeDelay)}).toJSDate()
			});
		}
	}
});

Devvit.addSchedulerJob({
	name: "reminder-removal", onRun: async(event, context) => {
		const {commentID} = event.data!;

		console.info(`${commentID}: Processing Reminder Removal`);

		if (!commentID) {
			return;
		}

		const comment = await context.reddit.getCommentById(commentID.toString());

		if (comment.isRemoved() || comment.isSpam() || comment.bannedAtUtc) {
			console.error(`${commentID}: Reminder Already Removed`);
			return;
		}

		await comment.remove(false);
		console.info(`${commentID}: Reminder Removed`);
	}
});

Devvit.addSchedulerJob({
	name: "action", onRun: async(event, context) => {
		const {postId, userFlairText, userFlairID, crosspost} = event.data!;

		console.info(`${postId}: Processing Action`);

		if (!postId) {
			return;
		}

		const post = await context.reddit.getPostById(postId.toString());

		if (!(await checkPost(context, post, String(userFlairText), String(userFlairID))) || await checkComments(
			context, post, await getCommentSettings(context), await getCommentIgnorePreference(context))) {
			console.info(`${postId}: Action Cancelled (post doesn't match requirements)`);
			return;
		}

		console.info(`${postId}: Executing Action`);
		await executeAction(context, post, Boolean(crosspost));
	}
});

export default Devvit;
