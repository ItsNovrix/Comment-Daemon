import type { Context } from 'hono';
import { reddit, scheduler } from '@devvit/web/server';
import { DateTime } from 'ts-luxon';
import { getActionSettings, getReminderSettings } from '../settings/getters.js';
import { checkPost } from '../list_check/list_check.js';
import { sendReminder } from '../actions/reminder.js';

export const handlePostCreate = async (c: Context) => {
  const event = await c.req.json();

  const postV2 = event.post;

  if (!postV2) {
    return c.json({ success: true });
  }

  const postId = postV2.id;
  const post = await reddit.getPostById(postId);

  let userFlairText = '';
  let userFlairID = '';

  const userFlair = event.author?.flair;

  if (userFlair) {
    userFlairText = userFlair.text;
    userFlairID = userFlair.templateId;
  }

  if (!(await checkPost(post, userFlairText, userFlairID))) {
    console.info(
      `${postId}: Ignoring (post doesn't match requirements)`
    );

    return c.json({ success: true });
  }

  console.info(
    `${postId}: Processing (post matches requirements)`
  );

  const reminderSettings = await getReminderSettings(post);
  const actionSettings = await getActionSettings();

  const now = DateTime.now();

  if (reminderSettings.enabled && reminderSettings.message) {
    if (reminderSettings.delay >= 10) {
      console.info(`${postId}: Scheduling Reminder`);

      await scheduler.runJob({
        name: 'reminder',
        data: {
          postId,
          removeDelay: reminderSettings.removeDelay,
          message: reminderSettings.message,
          rawOptions: reminderSettings.options,
          userFlairText,
          userFlairID,
        },
        runAt: now
          .plus({ minutes: reminderSettings.delay })
          .toJSDate(),
      });
    } else {
      await sendReminder(
        post,
        reminderSettings.removeDelay,
        reminderSettings.message,
        reminderSettings.options,
        now.toJSDate()
      );
    }
  }

  if (
    postV2.crosspostParentId &&
    actionSettings.crossAction !== 'default'
  ) {
    if (actionSettings.crossAction === 'do_nothing') {
      return c.json({ success: true });
    }

    console.info(
      `${postId}: Scheduling Crosspost Action (${actionSettings.crossAction})`
    );

    await scheduler.runJob({
      name: 'action',
      data: {
        postId,
        userFlairText,
        userFlairID,
        crosspost: true,
      },
      runAt: now
        .plus({ minutes: actionSettings.delay })
        .toJSDate(),
    });
  } else if (
    actionSettings.action &&
    actionSettings.action !== 'do_nothing'
  ) {
    console.info(
      `${postId}: Scheduling Action (${actionSettings.action})`
    );

    await scheduler.runJob({
      name: 'action',
      data: {
        postId,
        userFlairText,
        userFlairID,
        crosspost: false,
      },
      runAt: now
        .plus({ minutes: actionSettings.delay })
        .toJSDate(),
    });
  }

  return c.json({ success: true });
};