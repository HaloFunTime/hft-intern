const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const {
  HALOFUNTIME_ID_CHANNEL_FILE_SHARE,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_8S,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_BTB,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_CUSTOMS,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_MCC_CO_OP,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_MCC_CUSTOMS,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_MCC_MATCHMAKING,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_RANKED,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_SOCIAL,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_TESTING,
  HALOFUNTIME_ID_CHANNEL_LFG,
  HALOFUNTIME_ID_CHANNEL_WAYWO,
  HALOFUNTIME_ID_ROLE_8S,
  HALOFUNTIME_ID_ROLE_BTB,
  HALOFUNTIME_ID_ROLE_CUSTOMS,
  HALOFUNTIME_ID_ROLE_MCC_CO_OP,
  HALOFUNTIME_ID_ROLE_MCC_CUSTOMS,
  HALOFUNTIME_ID_ROLE_MCC_MATCHMAKING,
  HALOFUNTIME_ID_ROLE_PATHFINDER,
  HALOFUNTIME_ID_ROLE_RANKED,
  HALOFUNTIME_ID_ROLE_SOCIAL,
  HALOFUNTIME_ID_ROLE_TESTING,
} = require("../constants.js");

const LFG_TAG_IDS_TO_ROLE_IDS = {};
LFG_TAG_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_TAG_8S] =
  HALOFUNTIME_ID_ROLE_8S;
LFG_TAG_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_TAG_BTB] =
  HALOFUNTIME_ID_ROLE_BTB;
LFG_TAG_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_TAG_CUSTOMS] =
  HALOFUNTIME_ID_ROLE_CUSTOMS;
LFG_TAG_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_TAG_MCC_CO_OP] =
  HALOFUNTIME_ID_ROLE_MCC_CO_OP;
LFG_TAG_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_TAG_MCC_CUSTOMS] =
  HALOFUNTIME_ID_ROLE_MCC_CUSTOMS;
LFG_TAG_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_TAG_MCC_MATCHMAKING] =
  HALOFUNTIME_ID_ROLE_MCC_MATCHMAKING;
LFG_TAG_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_TAG_RANKED] =
  HALOFUNTIME_ID_ROLE_RANKED;
LFG_TAG_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_TAG_SOCIAL] =
  HALOFUNTIME_ID_ROLE_SOCIAL;
LFG_TAG_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_TAG_TESTING] =
  HALOFUNTIME_ID_ROLE_TESTING;

async function attemptFileShareEnforcement(thread) {
  // Do not enforce post restrictions if the thread is not in the File Share channel
  if (thread.parentId !== HALOFUNTIME_ID_CHANNEL_FILE_SHARE) return;
  let starterMessage;
  while (!starterMessage) {
    starterMessage = await thread
      .fetchStarterMessage({ force: true })
      .catch(() => null);
    await new Promise((r) => setTimeout(r, 1000));
  }
  const missingVisualAttachment =
    starterMessage.attachments.size === 0 ||
    starterMessage.attachments.reduce((acc, attachment) => {
      if (acc) return true;
      return !(
        attachment.contentType.includes("image") ||
        attachment.contentType.includes("video")
      );
    }, false);
  const youtubeUrlRegex =
    /(?:https?:)?(?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch|v|embed)(?:\.php)?(?:\?.*v=|\/))([a-zA-Z0-9\_-]{7,15})(?:[\?&][a-zA-Z0-9\_-]+=[a-zA-Z0-9\_-]+)*(?:[&\/\#].*)?/g;
  const missingYouTubeLink = !youtubeUrlRegex.test(starterMessage.content);
  const missingVisualContent = missingVisualAttachment && missingYouTubeLink;
  const waypointUrlRegex =
    /https:\/\/www\.halowaypoint\.com\/([A-Za-z]{2,4}([_-][A-Za-z]{4})?([_-]([A-Za-z]{2}|[0-9]{3}))?\/)?halo-infinite\/ugc\/(maps|modes|prefabs)\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/g;
  const missingWaypointLink = !waypointUrlRegex.test(starterMessage.content);
  const missingFileLink = missingWaypointLink;
  const rulesViolated = missingVisualContent || missingFileLink;
  if (rulesViolated) {
    await thread.send({
      content:
        `<@${thread.ownerId}>, this post has been automatically closed because it did not follow the guidelines.\n\n` +
        `**Posts in <#${thread.parentId}> must:**\n` +
        "1) Contain visual content (at least one image or video must be attached - a YouTube link is also fine)\n" +
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
        fileType = "MODE";
      } else if (match.includes("maps")) {
        fileType = "MAP";
      } else if (match.includes("prefabs")) {
        fileType = "PREFAB";
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

async function recordTestingLFGPost(thread) {
  // Do not record a Testing LFG post if the thread is not in the LFG forum channel
  if (thread.parentId !== HALOFUNTIME_ID_CHANNEL_LFG) return;
  // Do not record a Testing LFG post if the thread does not have the Testing tag
  let hasTestingTag = false;
  for (const tag of thread.appliedTags) {
    if (tag === HALOFUNTIME_ID_CHANNEL_LFG_TAG_TESTING) {
      hasTestingTag = true;
    }
  }
  if (!hasTestingTag) return;
  // Do not record a Testing LFG post if the thread owner does not have the Pathfinder role
  const threadOwner = await thread.fetchOwner();
  if (!threadOwner.guildMember.roles.cache.has(HALOFUNTIME_ID_ROLE_PATHFINDER))
    return;
  // Record data in the backend
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const response = await axios
    .post(
      `${HALOFUNTIME_API_URL}/pathfinder/testing-lfg-post`,
      {
        posterDiscordId: threadOwner.user.id,
        posterDiscordUsername: threadOwner.user.username,
        postId: thread.id,
        postTitle: thread.name,
      },
      {
        headers: {
          Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
        },
      }
    )
    .then((response) => response.data)
    .catch(async (error) => {
      console.error(error);
      // Return the error payload directly if present
      if (error.response.data) {
        return error.response.data;
      }
    });
  // Log if an error happens
  if (response.success === false || "error" in response) {
    console.log(response.error);
  }
}

async function recordWaywoPost(thread) {
  // Do not record a WAYWO post if the thread is not in the WAYWO forum channel
  if (thread.parentId !== HALOFUNTIME_ID_CHANNEL_WAYWO) return;
  const threadOwner = await thread.fetchOwner();
  // Record data in the backend
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const response = await axios
    .post(
      `${HALOFUNTIME_API_URL}/pathfinder/waywo-post`,
      {
        posterDiscordId: threadOwner.user.id,
        posterDiscordUsername: threadOwner.user.username,
        postId: thread.id,
        postTitle: thread.name,
      },
      {
        headers: {
          Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
        },
      }
    )
    .then((response) => response.data)
    .catch(async (error) => {
      console.error(error);
      // Return the error payload directly if present
      if (error.response.data) {
        return error.response.data;
      }
    });
  // Log if an error happens
  if (response.success === false || "error" in response) {
    console.log(response.error);
  }
}

module.exports = {
  name: "threadCreate",
  async execute(thread) {
    await attemptFileShareEnforcement(thread);
    await recordTestingLFGPost(thread);
    await recordWaywoPost(thread);
  },
};
