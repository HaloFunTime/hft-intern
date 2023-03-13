const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const {
  HALOFUNTIME_ID_CHANNEL_FILE_SHARE,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_8S,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_BTB,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_CUSTOMS,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_EVENTS,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_MCC_CO_OP,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_MCC_CUSTOMS,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_MCC_MATCHMAKING,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_RANKED,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_SOCIAL,
  HALOFUNTIME_ID_CHANNEL_LFG_TAG_TESTING,
  HALOFUNTIME_ID_CHANNEL_LFG,
  HALOFUNTIME_ID_CHANNEL_NEW_HALO_VC,
  HALOFUNTIME_ID_CHANNEL_WAYWO,
  HALOFUNTIME_ID_ROLE_8S,
  HALOFUNTIME_ID_ROLE_BTB,
  HALOFUNTIME_ID_ROLE_CUSTOMS,
  HALOFUNTIME_ID_ROLE_EVENTS,
  HALOFUNTIME_ID_ROLE_MCC_CO_OP,
  HALOFUNTIME_ID_ROLE_MCC_CUSTOMS,
  HALOFUNTIME_ID_ROLE_MCC_MATCHMAKING,
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
LFG_TAG_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_TAG_EVENTS] =
  HALOFUNTIME_ID_ROLE_EVENTS;
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

async function attemptLfgHelp(thread) {
  // Do not send an LFG Help message if the thread is not in the LFG forum channel
  if (thread.parentId !== HALOFUNTIME_ID_CHANNEL_LFG) return;
  if (thread.sendable) {
    let messageContent = `Thanks for making an LFG post! You can make a new VC for your group at any time by joining the <#${HALOFUNTIME_ID_CHANNEL_NEW_HALO_VC}> channel.`;
    const threadOwner = await thread.fetchOwner();
    await thread.fetchStarterMessage(); // Kludge to ensure starter message has been posted before attempting the help response
    // Get gamertag info
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const linkResponse = await axios
      .get(
        `${HALOFUNTIME_API_URL}/link/discord-to-xbox-live?discordId=${
          threadOwner.user.id
        }&discordTag=${encodeURIComponent(threadOwner.user.tag)}`,
        {
          headers: {
            Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
          },
        }
      )
      .then((response) => response.data)
      .catch(async (error) => {
        // Return the error payload directly if present
        if (error.response.data) {
          return error.response.data;
        }
        console.error(error);
      });
    let gamertag = null;
    let gamertagVerified = false;
    if ("xboxLiveGamertag" in linkResponse) {
      gamertag = linkResponse.xboxLiveGamertag;
      gamertagVerified = linkResponse.verified;
    }
    // Get game stats
    let matchmadeGamesPlayed = null;
    let customGamesPlayed = null;
    if (gamertag && gamertagVerified) {
      const statsResponse = await axios
        .get(
          `${HALOFUNTIME_API_URL}/halo-infinite/summary-stats?gamertag=${gamertag}`,
          {
            headers: {
              Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
            },
          }
        )
        .then((response) => response.data)
        .catch(async (error) => {
          // Return the error payload directly if present
          if (error.response.data) {
            return error.response.data;
          }
          console.error(error);
        });
      if ("matchmaking" in statsResponse) {
        matchmadeGamesPlayed = statsResponse.matchmaking?.gamesPlayed;
      }
      if ("custom" in statsResponse) {
        customGamesPlayed = statsResponse.custom?.gamesPlayed;
      }
    }
    // Add gamertag blurb
    if (
      gamertag &&
      matchmadeGamesPlayed !== null &&
      customGamesPlayed !== null
    ) {
      messageContent += `\n\n<@${thread.ownerId}>'s linked gamertag is \`${gamertag}\`, which has played **${matchmadeGamesPlayed}** matchmade games and **${customGamesPlayed}** custom games in Halo Infinite.`;
    } else if (gamertag) {
      messageContent += `\n\n<@${thread.ownerId}>'s linked gamertag is \`${gamertag}\`.`;
    } else {
      messageContent += `\n\n<@${thread.ownerId}>, you have not linked your gamertag on HaloFunTime. Please do so with \`/link-gamertag\` so others can use \`/gamertag\` to check your gamertag!`;
    }
    // Add tag blurb
    const pingRecommendations = [];
    for (const tag of thread.appliedTags) {
      pingRecommendations.push(`<@&${LFG_TAG_IDS_TO_ROLE_IDS[tag]}>`);
    }
    if (pingRecommendations.length > 0) {
      const roleText =
        pingRecommendations.length === 1
          ? "this LFG role"
          : "any of these LFG roles";
      messageContent +=
        "\n\n> **NOTE:** To get more eyes on your LFG post, try mentioning ";
      messageContent += `${roleText}: ${pingRecommendations.join(" ")}`;
      messageContent +=
        "\n> __***Each LFG role mention will ping hundreds of users, so please use this power responsibly!***__";
    }
    // Send the LFG Help message
    await thread.send({
      content: messageContent,
      allowedMentions: { users: [thread.ownerId] },
    });
  }
}

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

async function recordWaywoPost(thread) {
  // Do record a WAYWO post if the thread is not in the WAYWO forum channel
  if (thread.parentId !== HALOFUNTIME_ID_CHANNEL_WAYWO) return;
  const threadOwner = await thread.fetchOwner();
  // Get gamertag info
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const response = await axios
    .post(
      `${HALOFUNTIME_API_URL}/pathfinder/waywo-post`,
      {
        posterDiscordId: threadOwner.user.id,
        posterDiscordTag: threadOwner.user.tag,
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
    await attemptLfgHelp(thread);
    await attemptFileShareEnforcement(thread);
    await recordWaywoPost(thread);
  },
};
