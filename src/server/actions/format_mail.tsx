import { reddit } from "@devvit/web/server";

export async function formatMail(
  message: string,
  post: any,
  removalReason: string
): Promise<string> {
  const subreddit = await reddit.getCurrentSubreddit();

  const footer =
    "\n\n---\n" +
    "*This action was performed automatically. " +
    "Please respond to this message if you have any questions or concerns.*";

  message = message
    .replace(/\{community_name}/g, post.subredditName || "")
    .replace(
      /\{community_link}/g,
      `r/${post.subredditName}` || ""
    )
    .replace(
      /\{community_description}/g,
      subreddit.description || ""
    )
    .replace(
      /\{community_rules_url}/g,
      `[https://www.reddit.com/r/${post.subredditName}/about/rules](https://www.reddit.com/r/${post.subredditName}/about/rules)` ||
        ""
    );

  return (
    `Your post from ${post.subredditName} was removed because of: '${removalReason}'` +
    "\n\n" +
    `Hi u/${post.authorName}, ${message}` +
    "\n\n" +
    `Original post: ${post.permalink}` +
    footer
  );
}