const { EmbedBuilder } = require("discord.js");
const {
  HALOFUNTIME_LFG_CHANNEL_ID,
  HALOFUNTIME_MCC_LFG_CHANNEL_ID,
  HALOFUNTIME_WELCOME_CHANNEL_ID,
  PATHFINDERS_RELEASES_CHANNEL_ID,
} = require("../constants.js");

async function attemptWelcome(thread) {
  // Do not send a welcome message if the thread is not in the Welcome channel
  if (thread.parentId !== HALOFUNTIME_WELCOME_CHANNEL_ID) return;
  if (thread.sendable) {
    await thread.send({
      content:
        "https://tenor.com/view/halo-halo2-elite-sangheili-greetings-gif-25839730",
    });
  }
}

async function attemptLfgHelp(thread) {
  // Do not send an LFG Help message if the thread is not in the LFG or MCC LFG forum channel
  if (
    thread.parentId !== HALOFUNTIME_LFG_CHANNEL_ID &&
    thread.parentId !== HALOFUNTIME_MCC_LFG_CHANNEL_ID
  )
    return;
  if (thread.sendable) {
    await thread.send({
      content:
        `Thanks for making an LFG post, <@${thread.ownerId}>!\n\n` +
        "Your post is now visible to everyone. Anyone may __**follow**__ this post by commenting on it or clicking " +
        "the *Follow* bell, which will allow them to see activity updates for this post in their Discord sidebar and " +
        "get notifications from messages here that @-mention them directly or @-mention a role that they have.\n\n" +
        "You can force your friends to follow this post by @-mentioning them directly, but keep in mind that Discord " +
        "will not force people from a role to follow your post if you @-mention a role that 100 or more people have. " +
        "If Discord warns you that `Some roles were not mentioned or added to the thread`, that's what that's about.",
    });
  }
}

async function attemptReleasesEnforcement(thread) {
  // Do not enforce post restrictions if the thread is not in the Releases channel
  if (thread.parentId !== PATHFINDERS_RELEASES_CHANNEL_ID) return;
  let starterMessage;
  while (!starterMessage) {
    starterMessage = await thread
      .fetchStarterMessage({ force: true })
      .catch(() => null);
    await new Promise((r) => setTimeout(r, 1000));
  }
  const missingPictureAttachment =
    starterMessage.attachments.size === 0 ||
    starterMessage.attachments.reduce((acc, attachment) => {
      if (acc) return true;
      return !(
        attachment.contentType.includes("image") ||
        attachment.contentType.includes("video")
      );
    }, false);
  const waypointUrlRegex =
    /https:\/\/www\.halowaypoint\.com\/halo-infinite\/ugc\/(maps|modes)\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/g;
  const missingHaloWaypointLink = !waypointUrlRegex.test(
    starterMessage.content
  );
  const rulesViolated = missingPictureAttachment || missingHaloWaypointLink;
  if (rulesViolated) {
    await thread.send({
      content:
        `<@${thread.ownerId}>, this post has been automatically closed because it did not follow the guidelines.\n\n` +
        `**Posts in <#${thread.parentId}> must:**\n` +
        "1) Have at least one image or video attached\n" +
        "2) Contain a valid link to one or more files on Halo Waypoint (like https://www.halowaypoint.com/halo-infinite/ugc/modes/479923f7-f5ec-4a7c-81b9-d18449af590e)\n\n" +
        "This post will be archived when you navigate away from it. It'll be our little secret.",
    });
    await thread.setLocked(true, "Did not follow submission rules.");
    await thread.setArchived(true, "Did not follow submission rules.");
  } else {
    // Send a message to the thread that clearly lists the file IDs and posts a hyperlink to each of them
    const matches = starterMessage.content.match(waypointUrlRegex);
    let bookmarkFields = [];
    matches.forEach((match) => {
      let fileType = "FILE";
      const fileId = match.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/
      )[0];
      if (match.includes("modes")) {
        fileType = "GAME MODE";
      } else if (match.includes("maps")) {
        fileType = "MAP";
      }
      bookmarkFields.push({
        name: `**BOOKMARK THE ${fileType} HERE:**`,
        value: `[${fileId}](${match})`,
      });
    });
    await thread.send({
      content: `<@${thread.ownerId}>, thanks for submitting your file to <#${thread.parentId}>!`,
      embeds: [
        new EmbedBuilder().setColor(0x9b59b6).addFields(...bookmarkFields),
      ],
    });
  }
}

module.exports = {
  name: "threadCreate",
  async execute(thread) {
    await attemptWelcome(thread);
    await attemptLfgHelp(thread);
    await attemptReleasesEnforcement(thread);
  },
};
