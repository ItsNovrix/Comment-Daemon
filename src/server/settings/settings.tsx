import { Devvit } from "@devvit/public-api";

const addSettings = () => {
	Devvit.addSettings([
		{ // Selection for Whitelist, Blacklist, Both or None (disable the app)
			type: "select",
			name: "list-preference",
			required: true,
			defaultValue: ["whitelist"], // Default option
			label: "List Preference",
			helpText: "Choose whether to use the whitelist, blacklist, both or none (disable the app).",
			options: [
				{label: "Whitelist", value: "whitelist"},
				{label: "Blacklist", value: "blacklist"},
				{label: "Both", value: "both"},
				{label: "None", value: "none"}
			]
		}, { // Ignore approved, removed and/or filtered posts
			type: "select",
			name: "ignore-preference",
			multiSelect: true,
			label: "Ignore Posts?",
			helpText: "Select whether to ignore posts that have been approved, removed or ones filtered by"
			          + " AutoModerator.",
			options: [
				{label: "Approved", value: "approved"},
				{label: "Removed", value: "removed"},
				{label: "Removed by Reddit (e.g. crowd control)", value: "reddit"},
				{label: "Filtered", value: "filtered"}
			]
		}, // Whitelist Settings
		{
			type: "group",
			label: "Whitelist",
			helpText: "Requirements for posts on which the bot will act on (all"
			          + " non-empty requirements given must be true).",
			fields: [
				{
					type: "string",
					name: "wl-title-regex",
					label: "Title Regex",
					helpText: "Regex pattern for post titles to act on.",
					onValidate: (event) => validateRegex(event.value)
				}, {
					type: "boolean", name: "wl-title-regex-case", label: "Case sensitive Title Regex?", defaultValue: false
				}, {
					type: "string",
					name: "wl-body-regex",
					label: "Body Regex",
					helpText: "Regex pattern for post body to act on.",
					onValidate: (event) => validateRegex(event.value)
				}, {
					type: "boolean", name: "wl-body-regex-case", label: "Case sensitive Body Regex?", defaultValue: false
				}, {
					type: "boolean",
					name: "wl-body-link",
					label: "Post body contains a link?",
					helpText: "Enable to act on posts with a link in the post body."
				}, {
					type: "number",
					name: "wl-body-length",
					label: "Minimum Post Body Length",
					helpText: "Specify the minimum number of characters required in the post body (the number of"
					          + " characters must be greater than or equal to the given number).",
					onValidate: (event) => {
						if (event.value && event.value < 0) {
							return "Body length must be a positive number.";
						}
					}
				}, {
					type: "paragraph",
					name: "wl-flair-text",
					label: "Flair Text",
					helpText: "Comma-separated flair text to whitelist (e.g. \"Discussion, Announcement\") - an exact"
					          + " but non-case-sensitive match is required (\"Off-topic\" and \"off-topic\" is fine).",
					onValidate: (event) => validateCommaSeparatedList(event.value)
				}, {
					type: "paragraph",
					name: "wl-flair-ids",
					label: "Flair IDs",
					helpText: "Comma-separated flair IDs to whitelist.",
					onValidate: (event) => validateCommaSeparatedList(event.value)
				}, {
					type: "paragraph",
					name: "wl-user-flair-text",
					label: "User Flair Text",
					helpText: "Comma-separated user flair text to whitelist - an exact but non-case-sensitive match"
					          + " is required.",
					onValidate: (event) => validateCommaSeparatedList(event.value)
				}, {
					type: "paragraph",
					name: "wl-user-flair-ids",
					label: "User Flair IDs",
					helpText: "Comma-separated user flair IDs to whitelist.",
					onValidate: (event) => validateCommaSeparatedList(event.value)
				}
			]
		}, // Blacklist Settings
		{
			type: "group",
			label: "Blacklist",
			helpText: "Requirements for posts posts on which the bot will NOT act"
			          + " on (all non-empty requirements given must be false).",
			fields: [
				{
					type: "string",
					name: "bl-title-regex",
					label: "Title Regex",
					helpText: "Regex pattern for post titles to exclude.",
					onValidate: (event) => validateRegex(event.value)
				}, {
					type: "boolean", name: "bl-title-regex-case", label: "Case sensitive Title Regex?", defaultValue: false
				}, {
					type: "string",
					name: "bl-body-regex",
					label: "Body Regex",
					helpText: "Regex pattern for post bodies to exclude.",
					onValidate: (event) => validateRegex(event.value)
				}, {
					type: "boolean", name: "bl-body-regex-case", label: "Case sensitive Body Regex?", defaultValue: false
				}, {
					type: "boolean",
					name: "bl-body-link",
					label: "Post body contains a link?",
					helpText: "Enable to exclude posts with a link in their body."
				}, {
					type: "number",
					name: "bl-body-length",
					label: "Post Body Length Limit",
					helpText: "Exclude posts that contain a number of characters greater than or equal to the one given",
					onValidate: (event) => {
						if (event.value && event.value < 1) {
							return "Body length must be a positive number.";
						}
					}
				}, {
					type: "paragraph",
					name: "bl-flair-text",
					label: "Flair Text",
					helpText: "Comma-separated flair text to blacklist (e.g. \"Meme, Off-topic\") - an exact, but "
					          + "non-case-sensitive match is required (\"Off-topic\" and \"off-topic\" is fine).",
					onValidate: (event) => validateCommaSeparatedList(event.value)
				}, {
					type: "paragraph",
					name: "bl-flair-ids",
					label: "Flair IDs",
					helpText: "Comma-separated flair IDs to blacklist.",
					onValidate: (event) => validateCommaSeparatedList(event.value)
				}, {
					type: "paragraph",
					name: "bl-user-flair-text",
					label: "User Flair Text",
					helpText: "Comma-separated user flair text to blacklist - an exact but non-case-sensitive match"
					          + " is required.",
					onValidate: (event) => validateCommaSeparatedList(event.value)
				}, {
					type: "paragraph",
					name: "bl-user-flair-ids",
					label: "User Flair IDs",
					helpText: "Comma-separated user flair IDs to blacklist.",
					onValidate: (event) => validateCommaSeparatedList(event.value)
				}
			]
		}, // Comment Requirements
		{
			type: "group",
			label: "Comment Requirements",
			helpText: "Configure the requirements for the comment that should be made.",
			fields: [
				{
					type: "select",
					name: "comment-ignore-preference",
					required: true,
					defaultValue: ["both"],
					label: "Ignore Removed/Filtered Comments?",
					helpText: "Select whether to ignore removed comments, ones filtered by AutoModerator, or both.",
					options: [
						{label: "None", value: "none"},
						{label: "Removed", value: "removed"},
						{label: "Filtered", value: "filtered"},
						{label: "Both", value: "both"}
					]
				}, {
					type: "boolean",
					name: "comment-level",
					label: "Check top-level comments?",
					helpText: "Enable this to check top-level comments."
				}, {
					type: "boolean",
					name: "comment-author",
					label: "Check non-OP comments?",
					helpText: "Enable this to check comments made by users other than the author of the post."
				}, {
					type: "string",
					name: "comment-user-ignore",
					label: "Ignore List",
					helpText: "Comma-separated usernames to ignore (without the u/ prefix).",
					defaultValue: "AutoModerator",
					onValidate: (event) => validateCommaSeparatedList(event.value) // Ensure valid regex
				}, {
					type: "boolean",
					name: "accept-any-comment",
					label: "Accept Any Comment?",
					helpText: "Enable this to bypass all comment requirements (except the above) and accept any"
					          + " comment."
				}, {
					type: "string",
					name: "comment-body-regex",
					label: "Comment Body Regex",
					helpText: "Regex pattern that the comment body must match. Ignored if \"Accept Any Comment\" is enabled.",
					onValidate: (event) => validateRegex(event.value) // Ensure valid regex
				}, {
					type: "boolean", name: "comment-regex-case", label: "Case sensitive Regex?", defaultValue: false
				}, {
					type: "boolean",
					name: "comment-body-link",
					label: "Require a Link in Comment Body?",
					helpText: "Enable to enforce the presence of a link in the comment body. Ignored if \"Accept Any Comment\" is enabled."
				}
			]
		}, // Notice Comment Settings
		{
			type: "group",
			label: "Notice Comment Settings",
			helpText: "Settings for the notice comment to be made under posts that match the Post Requirements but"
			          + " lack the required comment.",
			fields: [
				{
					type: "boolean",
					name: "reminder-enable",
					required: true,
					defaultValue: false,
					label: "Enable Notice?",
					helpText: "Enable to send a notice comment."
				}, {
					type: "number",
					name: "reminder-delay",
					label: "Notice Delay (minutes)",
					helpText: "Time (in minutes) to wait before sending the notice. Notices with a delay of under"
					          + " 10 minutes will instead be sent immediately.",
					onValidate: (event) => {
						if (event.value && event.value < 1) {
							return "Notice delay must be a positive number.";
						}
					}
				}, {
					type: "number",
					name: "reminder-remove-delay",
					label: "Notice Removal Delay (minutes)",
					helpText: "Time (in minutes) to wait before removing the notice after it has been sent. The notice won't be removed if the value is 0.",
					onValidate: (event) => {
						if (event.value && event.value < 0) {
							return "Notice removal delay must be a positive number or 0.";
						}
					}
				}, {
					type: "paragraph",
					name: "reminder-message",
					label: "Custom Notice Message",
					helpText: "The message to send as a notice - e.g., \"Please update your post or add a"
					          + " comment!\". Certain AutoModerator placeholders are supported; use {{random}} "
					          + "to insert a random value from the ones given.)."
				}, {
					type: "paragraph",
					name: "reminder-random",
					label: "Random Placeholder Values",
					helpText: "Enter semi-colon separated values to be randomly selected for the {{random}}"
					          + " placeholder (e.g. \"Value1; Value2; Value3\").",
					onValidate: (event) => {
						if (event.value && !/^([^;]+)(;[^;]+)*$/.test(event.value)) {
							return "Invalid format. Values must be separated by semicolons (e.g. \"Value1; Value2\").";
						}
					}
				}, {
					type: "select",
					multiSelect: true,
					name: "reminder-options",
					label: "Notice Options",
					helpText: "Select moderator settings for the notice comment (comment is unlocked by default).",
					options: [
						{label: "Distinguish", value: "distinguish"}, {label: "Distinguish & Sticky", value: "sticky"}, { label: "Lock Comment", value: "lock" }
					]
				}
			]
		}, // Action Settings
		{
			type: "group",
			label: "Action Settings",
			helpText: "Settings for the action to take if the post is not updated or no comment is made.",
			fields: [
				{
					type: "select",
					name: "missing-link-action",
					required: true,
					defaultValue: ["do_nothing"],
					label: "Action to Take",
					helpText: "What type of action to take.",
					options: [
						{label: "Do Nothing", value: "do_nothing"},
						{label: "Report Post", value: "report"},
						{label: "Change Post Flair", value: "flair"},
						{label: "Remove Post", value: "remove"}
					]
				}, {
					type: "select",
					name: "missing-link-cross-action",
					required: true,
					defaultValue: ["default"],
					label: "Action to Take (crossposts)",
					helpText: "What type of action to take for crossposts.",
					options: [
						{label: "Default", value: "default"},
						{label: "Do Nothing", value: "do_nothing"},
						{label: "Report Post", value: "report"},
						{label: "Change Post Flair", value: "flair"},
						{label: "Remove Post", value: "remove"}
					]
				}, {
					type: "number",
					name: "missing-link-delay",
					label: "Action Delay (minutes)",
					helpText: "Time (in minutes) to wait before taking the action.",
					onValidate: (event) => {
						if (event.value && event.value < 1) {
							return "Action delay must be a positive number.";
						}
					}
				}, {
					type: "string",
					name: "report-reason",
					label: "Custom Report Reason",
					helpText: "What report reason to use if the report action is selected?"
				}, {
					type: "string",
					name: "change-flair-id",
					label: "Flair Template ID",
					helpText: "If Change Post Flair is selected, what's the ID of the flair template that should be"
					          + " applied?"
				}, {
					type: "string",
					name: "removal-reason",
					label: "Removal Reason Name",
					helpText: "If Remove Post is selected, what's the exact name of the removal reason template that"
					          + " should be used if any?"
				}, {
					type: "select",
					name: "notify-user-via",
					defaultValue: ["do_nothing"],
					required: true,
					label: "Notify User via",
					helpText: "If a removal reason is given, how should the user be notified?",
					options: [
						{label: "Don't Notify", value: "do_nothing"},
						{label: "Comment", value: "comment"},
						{label: "ModMail", value: "modmail"}
					]
				}, {
					type: "select",
					multiSelect: true,
					name: "action-notify-options",
					label: "Notify Comment Options",
					helpText: "If notify via comment is selected, what moderator settings should be used for the"
					          + " comment (comment is locked by default)?",
					options: [
						{label: "Distinguish", value: "distinguish"}, {label: "Distinguish & Sticky", value: "sticky"}
					]
				}, {
					type: "boolean",
					name: "modmail-archive",
					defaultValue: false,
					label: "Archive ModMail?",
					helpText: "If notify via ModMail is selected, should the conversation be archived?"
				}
			]
		}
	]);
};

/**
 * Check the correctness of a Regex pattern.
 */
function validateRegex(value: string | undefined) {
	const input = value ?? ""; // If value is undefined, use an empty string
	try {
		new RegExp(input); // Test the regex pattern
	} catch {
		return "Invalid regex pattern.";
	}
}

/**
 * Check the correctness of a comma-separated list of strings.
 */
function validateCommaSeparatedList(value: string | undefined) {
	const input = value ?? ""; // If value is undefined, use an empty string

	if (input && !/^[^,]+(,[^,]+)*$/.test(input)) {
		return "Invalid format. Must be comma-separated list (e.g., \"Value1, Value2\").";
	}
}

export { addSettings };
