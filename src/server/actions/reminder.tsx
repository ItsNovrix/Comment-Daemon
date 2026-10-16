import { scheduler } from "@devvit/web/server";

export async function sendReminder(
  post: any,
  removeDelay: number,
  message: string,
  rawOptions: string[],
  now: Date
) {
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

  if (removeDelay > 0) {
    await scheduler.runJob({
      name: "reminder-removal",
      data: {
        commentID: comment.id,
      },
      runAt: new Date(
        now.getTime() + removeDelay * 60 * 1000
      ),
    });
  }
}