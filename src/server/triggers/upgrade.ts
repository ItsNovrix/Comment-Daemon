import type { Context } from 'hono';
import { reddit, settings, scheduler } from "@devvit/web/server";

export const handleAppUpgrade = async (c: Context) => {
  try {
    const event = await c.req.json();
    console.log(`App upgrade payload received.`);

    const subreddit = await reddit.getCurrentSubreddit();
    const appAccount = await reddit.getAppUser();

    let firstMsg = `Hello r/${subreddit.name} mods,\n\n`;

    firstMsg += `Thanks for updating **Comment Daemon**!\n\n`;
    firstMsg += `Comment Daemon provides automated comment workflows for your subreddit.\n\n`;

    /* WHAT'S NEW */
    firstMsg += `**What's new (highlights):**\n\n\n`;
    firstMsg += `- **Devvit Version Update** — Comment Daemon has been updated to the latest Devvit release (0.14.6).\n`;
    firstMsg += `- **App Upgrade Notifier** — Comment Daemon now has an app upgrade notifier to alert mod teams when an upgrade is available for Comment Daemon (this can be toggled off in the app settings).\n\n`;

    /* REMINDERS */
    firstMsg += `**Good to know / reminders:**\n\n\n`;
    firstMsg += `- An **internal mod note** is added automatically after all actions performed by Comment Daemon\n`;
    firstMsg += `- **Reply notifications are OFF by default** but can easily be enabled in the app settings.\n`;
    firstMsg += `- To use the app, you need **Post** or **Everything** permissions.\n\n`;

    /* CONFIG LINKS */
    firstMsg += `**Configure now:** manage comments, regex, removal reasons, and more settings here → [Comment Daemon settings](https://developers.reddit.com/r/${subreddit.name}/apps/comment-daemon)\n\n\n`;

    /* FOOTER */
    firstMsg += `[Terms & Conditions](https://www.reddit.com/r/NovrixApps/wiki/comment-daemon/terms-and-conditions) | `;
    firstMsg += `[Privacy Policy](https://www.reddit.com/r/NovrixApps/wiki/comment-daemon/privacy-policy/) | `;
    firstMsg += `[Contact](https://www.reddit.com/r/NovrixApps/)\n\n`;

    await reddit.sendPrivateMessageAsSubreddit({
      fromSubredditName: subreddit.name,
      to: "comment-daemon",
      subject: `Comment Daemon: App Update`,
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
    console.error("Crash prevented in AppUpgrade trigger:", error);
    return c.json({ success: false, error: String(error) });
  }
};