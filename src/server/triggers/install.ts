import type { Context } from 'hono';
import { reddit, settings, scheduler } from "@devvit/web/server";

export const handleAppInstall = async (c: Context) => {
  try {
    const event = await c.req.json();
    console.log(`App install payload received.`);

    const subreddit = await reddit.getCurrentSubreddit();
    const appAccount = await reddit.getAppUser();

    let firstMsg = `Hello r/${subreddit.name} mods,\n\n`;

    firstMsg += `Thanks for installing **Comment Daemon**!\n\n`;
    firstMsg += `Comment Daemon provides automated comment workflows for your subreddit.\n\n`;

    /* QUICK START */
    firstMsg += `**How to use Comment Daemon:**\n\n\n`;
    firstMsg += `1) Open **Comment Daemon's app settings → [Comment Daemon settings](https://developers.reddit.com/r/${subreddit.name}/apps/comment-daemon)\n`;
    firstMsg += `2) Configure the app's settings, such as the comment you want Comment Daemon to make on posts, comment delay time, auto-removal, enabling distinguishing/sticky, and more.\n`;
    firstMsg += `3) Submit a test post to your subreddit as necessary to verify that Comment Daemon is responding as you've configured it.\n\n`;
    firstMsg += `**Note:** The comment removal workflow is completely optional! Many subreddits choose to use Comment Daemon simply for automated comment notices on posts.\n\n`;

    /* DEFAULTS & NOTIFICATIONS */
    firstMsg += `**Defaults & notifications:**\n\n\n`;
    firstMsg += `- An **internal mod note** is added automatically after all actions performed by Comment Daemon\n`;
    firstMsg += `- **Reply notifications are OFF by default** but can easily be enabled in the app settings.\n`;
    firstMsg += `- **Discord notifications** are supported if you add a webhook in settings. Heads-up: very long posts may hit Discord payload limits.\n\n`;

    /* FEATURES */
    firstMsg += `**Common Use Cases for Comment Daemon**\n\n\n`;
    firstMsg += `- **Sticky Announcements & Promos** — Permanently sticky and distinguish a message on every new post. Useful for promoting community Discords, upcoming AMAs, and more!.\n`;
    firstMsg += `- **Rules Reminder** — Drop a standard rule reminder on specific flairs to help reduce rule-breaking comments.\n`;
    firstMsg += `- **Enforce Content Attribution** — Automatically ask creators to credit their sources. If they don't reply within 30 minutes, the post is automatically removed.\n`;
    firstMsg += `- **Mandatory Interaction Gate** — Require users to explain their post (similar to r/AmITheAsshole). If they don't respond to the prompt in time, the post goes to the mod queue.\n\n`;

    /* CONFIG LINKS */
    firstMsg += `**Configure now:** manage comments, regex, removal reasons, and more settings here → `;
    firstMsg += `[Comment Daemon settings](https://developers.reddit.com/r/${subreddit.name}/apps/comment-daemon)\n\n`;

    /* FOOTER */
    firstMsg += `[Terms & Conditions](https://www.reddit.com/r/NovrixApps/wiki/comment-daemon/terms-and-conditions) | `;
    firstMsg += `[Privacy Policy](https://www.reddit.com/r/NovrixApps/wiki/comment-daemon/privacy-policy/) | `;
    firstMsg += `[Contact](https://www.reddit.com/r/NovrixApps/)\n\n`;

    await reddit.sendPrivateMessageAsSubreddit({
      fromSubredditName: subreddit.name,
      to: "comment-daemon",
      subject: `Thanks for installing Comment Daemon!`,
      text: firstMsg,
    });
    console.log(`Message sent to r/${subreddit.name} mods.`);

      await reddit.setUserFlair({
        subredditName: subreddit.name,
        username: appAccount!.username,
        text: "Mod Team 🛡️",
        textColor: "light",
        backgroundColor: "#2200ff",
      });

      try {
        await scheduler.runJob({
          name: 'upgrade_notifier_job',
          cron: '*/30 * * * *',
        });
        console.log("30-minute upgrade checker timer started.");
      } catch (e) {
        console.error("Failed to start timer:", e);
      }

    return c.json({ success: true });
  } catch (error) {
    console.error("Crash prevented in AppInstall trigger:", error);
    return c.json({ success: false, error: String(error) }); 
  }
};