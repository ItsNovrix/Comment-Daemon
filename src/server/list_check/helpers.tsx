import { reddit } from "@devvit/web/server";

export function containsLink(text: string): boolean {
  const urlRegex =
    /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\b[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?)/i;

  return urlRegex.test(text);
}

export async function getPostParams(
  post: any,
  userFlairText: string,
  userFlairID: string
) {
  return {
    id: post.id,
    title: post.title || "",
    body: post.body || "",
    flairText: post.flair?.text || "",
    flairID: post.flair?.templateId || "",
    userFlairText: userFlairText || "",
    userFlairID: userFlairID || "",
  };
}

export async function fetchAllComments(post: any) {
  const comments = [];

  for await (const comment of reddit.getComments({
    postId: post.id,
    limit: 100,
  })) {
    comments.push(comment);
  }

  return comments;
}