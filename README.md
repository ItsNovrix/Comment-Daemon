# Comment Daemon

Comment Daemon is a flexible app that helps mod teams drop custom comments ("Notices") on subreddit posts and can automatically take action if users don't interact with the notices. Whether you need a simple tool to pin a Discord link, need a temporary rule reminder, or want to implement strict time-limit based enforcement for content attribution, Comment Daemon handles it all seamlessly. 

Configurable criteria within the bot settings allow options for notices to be delayed before being sent, removed after a set time, distinguished, stickied, and more. Comment Daemon can then automatically filter posts, remove them, or update post flairs if users do not respond to its initial notice within a configured timeframe. Comment Daemon also includes whitelist and blacklist settings, allowing configuration based on post content, presence of links, flairs, and more, giving moderators precise control over how it acts.

While Comment Daemon can be used for a variety of purposes, the name speaks to its main goal of helping make content attribution easier. When a user submits a post, Comment Daemon can comment on the post with a configurable message requesting a source for the content. Comment Daemon will then monitor the post for a set period of time, keeping an eye out for the OP to provide a source. If a comment hasn't been made within the set period of time, the post can then be filtered or removed. Comment Daemon can provide removal reasons if these are configured in the installation settings.

## ✅ What Comment Daemon can do

Comment Daemon operates on a fairly straightforward **Target ➔ Notice ➔ Action** workflow:

1. **​Target:** Choose exactly which posts the bot should act on or ignore using flexible Whitelist and Blacklist settings (filter by post content, flairs, links, and more).

2. ​**Notice:** The bot automatically leaves a custom comment on matching posts. You can set these notices to stay permanently, or automatically delete themselves after a set time to keep comment sections clean.

3.  ​**Action:** If enabled, Comment Daemon starts a countdown clock. If the original poster fails to reply to the post within your set timeframe, the bot automatically executes your chosen action: 

	- Filter the post to the mod queue.

	- Remove the post entirely (with optional custom removal reasons).

	- Update the post flair to a status of your choice.

	- Do Nothing (perfect if you just want to leave a passive comment or let a temporary notice expire without punishing the user).

**​Common Use Cases**

- **Sticky Announcements & Promo:** Permanently sticky and distinguish a message on every new post promoting your community Discord or upcoming AMAs.

- **Rules Reminder:** Drop a standard rule reminder on specific flairs to help reduce rule-breaking comments.

- **Enforce Content Attribution:** Automatically ask creators to credit their sources. If they don't reply within 30 minutes, the post is automatically removed.

- **Mandatory Interaction Gate:** Require users to explain their post (similar to r/AmITheAsshole). If they don't respond to the prompt in time, the post goes to the mod queue.

---

# What's New?

### Devvit version update

- Comment Daemon has been updated to the latest Devvit release for continued stability.
- Updated the support subreddit link due to moving support to new subreddit.
- Added app install/upgrade triggers to provide mod teams with usefull tips/information on install/upgrade.

# What's To Come 

- Implement functionality to optionally sticky notices and removal reasons separate from 'Distinguish & Sticky' option
- Implement functionality to optionally unlock removal comments by default

[post_requirements]: https://i.imgur.com/iMZPgWd.png

[comment_requirements]: https://i.imgur.com/POEQung.png

[notice]: https://i.imgur.com/qKamT7V.png

[action]: https://i.imgur.com/6Voa0Zy.png

---

# Getting Started

Comment Daemon is quick to set up in your subreddit. Follow these steps to get it running:

1. **Install the bot**
	- Go to the Comment Daemon developer page and click **Add to community**.
	- Select the subreddit where you want Comment Daemon active.
2. **Grant permissions**
	- Approve the requested permissions when prompted.
3. **Configure your settings**
	- In the settings panel, configure the settings for whitelist/blacklist, comment requirements, notice comments, and actions. See the sections below for more details on configuration.
4. **Test the bot**
	- Submit a test post to your subreddit.
	- Verify that Comment Daemon reacts correctly.
5. **Adjust settings**
	- If needed, use the **Configuration** section to add further configuration and adjust your settings such as notice delay, auto-removal, enabling distinguishing/sticky, and more.

Once configured, Comment Daemon will automatically handle new submissions according to your preferences.

---

# Configuration

Currently, the bot settings consist of five sections:

1. What type of filtering should the bot honor (whitelist, blacklist, both, or none)?
2. What posts should the bot act on (whitelist), and what posts should the bot ignore (blacklist)?
3. What type of comments should Comment Daemon look for in the post and how should they be configured?
4. Should a notice be sent to the OP?
5. What should be done if the OP doesn't respond to their notice?

## 1. Post Requirements (White and Black List)

![post_requirements]

The whitelist configuration section allows you to customize what posts you want Comment Daemon to act on. The
blacklist does the opposite, allowing you to select what posts the Comment Daemon should ignore. You
can use either one, both or none (if you want to disable the app).

Optionally, you can choose to ignore approved, removed and/or filtered posts. 
Deleted posts are always ignored.

Currently, you can set:

- **A Regex pattern that the post title must match.**
	- Refer to your favourite Regex editor (e.g. https://regexr.com/).

- **A requirement for a link in the post body.**
	- This mainly applies to text posts that contain links - Link/Image posts
	  don't count.
	- Gallery/Multi-image posts are their own can of worms but long story
	  short, this also doesn't apply to the Caption and URL fields of those.

- **A requirement for minimum/maximum post body length.**

- **A list of post flairs, one of which the post must have.**
	- Flair Text or Flair Template ID can be used

- **A list of user flairs, one of which the user must have.**
	- Flair Text or Flair Template ID can be used
	- Note that due to technical constraints, the user flair is checked
	  **only** once when the post is first created. Unlike other
	  options, Comment Daemon won't know if the user flair has been changed after a
	  notice is submitted and/or before an action is taken.

## 2. Comment Requirements

![comment_requirements]

If a post matches the whitelist or blacklist, Comment Daemon will next look for a comment
matching certain criteria before sending a notice or performing an action as
described in the following sections.

Optionally, you can choose to ignore removed and or filtered comments.
Deleted comments are always ignored.

Currently, you can set:

- **A "check top-level comments" toggle if you want Comment Daemon to check
  comments made as top-level-comments.**
	- The default setting is for Comment Daemon to check non-top-level comments, requiring users to
	  respond to the Comment Daemon notice rather than making a new top-level comment. 

- **A "check non-OP comments" toggle if you want Comment Daemon to check
  comments made by users other than the OP.**
	- An Ignore List of users can be configured, with comments made by Comment Daemon
	  being ignored by default.

- **An "accept all comments" overwrite that tells Comment Daemon to accept any
  comment, bypassing all comment requirements (except the above)**

- **A Regex pattern that the comment body must match.**

- **A requirement for a link in the comment body.**

If such a comment is not found, Comment Daemon will send a notice comment
and/or take the given action.

## 3. Notice Comment

![notice]

You can use this feature if you want Comment Daemon to make a comment to inform users
to take a specific action to match the requirements of your subreddit. Comment Daemon
will check the post and comments both before scheduling the notice and before
sending the comment. Notices are unlocked by default, but can be locked if desired.

Some placeholders have been implemented:

- Most [AutoModerator placeholders](https://www.reddit.com/r/reddit.com/wiki/automoderator/full-documentation/)
have been added except media placeholders,
match placeholders and ``{{author_flair_template_id}}``.

- ``{{random}}`` can be used to choose a random value from multiple given
  ones.

Currently, you can set:

- **The delay before sending the notice (in minutes).**
  - Tasks (notices, notice removals, actions) with delays under 10-15 minutes
    can occasionally fail to execute. To alleviate this, notices with a delay of
    under 10 minutes will instead be sent immediately. If you are experiencing problems,
    please try a larger delay. 

- **The delay before removing the notice (in minutes).**

- **The contents of the notice comment.**

- **Whether the notice should be distinguished, stickied and distinguished, or locked.**

## 4. Action on Missing Link/Comment

![action]

Here you decide what the app should do if the OP doesn't update their posts
or a comment isn't made to match the requirements. The app checks the post and
comments both before scheduling the action and before executing it.

Currently, you can set:

- **The type of action you want the app to take.**
	- Report Post: a custom report reason can be given.
	- Change Post Flair: a flair template ID is required.
	- Remove Post: a name of a removal reason can be given, and the user can
	  be notified via a comment or modmail.
		- Some placeholders are supported: `{community_name}`,
		  `{community_link}`,
		  `{community_rules_url}`
		- `{community_description}` seems to be giving the Old Reddit sidebar
		  instead, which may be a bug.

- **The delay before taking the action (in minutes).**
  - Tasks (notices, notice removals, actions) with delays under 10-15 minutes
    can occasionally fail to execute. To alleviate this, notices with a delay of
    under 10 minutes will instead be sent immediately. If you are experiencing problems,
    please try a larger delay. 

The post will be reported instead if an invalid Flair Template ID or Removal
Reason Name is given.

Optionally, you can also set a different action to be executed for crossposts.

---

## 🧾 Source & License

The source code for Comment Daemon is available on [GitHub](https://github.com/ItsNovrix/Comment-Daemon).

This project is licensed under the [BSD-3-Clause License](https://opensource.org/licenses/BSD-3-Clause).
This app was developed in compliance with [Reddit's Developer Terms](https://www.redditinc.com/policies/developer-terms) and adheres to the guidelines for the Devvit platform.

---

# 🆘 Feedback & Support

If you have any feedback/suggestions or need support, visit [r/NovrixApps](https://www.reddit.com/r/NovrixApps).

---

# 🚀 Changelog

* v0.0.1: Initial app code upload
* v0.0.2: Updated app to latest Devvit version
* v0.0.3: Migrated app from Devvit Blocks to Devvit Web

Thanks for using **Comment Daemon**!
