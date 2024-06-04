const fs = require("node:fs");
const path = require("node:path");
const {
  HALOFUNTIME_ID,
  HALOFUNTIME_ID_CHANNEL_COMMUNITY,
  HALOFUNTIME_ID_CHANNEL_PATHFINDERS_VC_1,
  HALOFUNTIME_ID_CHANNEL_PATHFINDERS_VC_2,
  HALOFUNTIME_ID_ROLE_STAFF,
} = require("../constants.js");

async function listMembersConnectedToVC(client, guildId, channelId) {
  try {
    let guild = client.guilds.cache.get(guildId);
    let voiceChannel = await guild.channels.fetch(channelId, { force: true });

    return voiceChannel.members;
  } catch (error) {
    logger.error(
      `Error listing members connected to VC ${channelId} in server ${guildId}:`
    );
    console.log(error);
  }
}

const attemptRandomGossip = async (client) => {
  console.log("Gossip attempt!");
  const gossipsPath = path.join(__dirname, "gossips");
  const randomGossipFiles = fs
    .readdirSync(gossipsPath)
    .filter((file) => file.endsWith(".wav") && !file.startsWith("joke"));
  if (randomGossipFiles.length === 0) {
    console.log("Gossip attempt failed. No gossip files found.");
    return;
  }

  const communityGossips = randomGossipFiles.filter(
    (file) => !file.startsWith("forgers")
  );
  const forgeGossips = randomGossipFiles.filter((file) =>
    file.startsWith("forgers")
  );

  // Roll for gossip type (Community or Forge)
  let gossipType;
  if (Math.random() >= forgeGossips.length / randomGossipFiles.length) {
    gossipType = "Community";
  } else {
    gossipType = "Forge";
  }

  // Channel check
  let channelId, vcMembers;
  if (gossipType === "Community") {
    channelId = HALOFUNTIME_ID_CHANNEL_COMMUNITY;
    vcMembers = await listMembersConnectedToVC(
      client,
      HALOFUNTIME_ID,
      channelId
    );
  } else if (gossipType === "Forge") {
    for (let id of [
      HALOFUNTIME_ID_CHANNEL_PATHFINDERS_VC_1,
      HALOFUNTIME_ID_CHANNEL_PATHFINDERS_VC_2,
    ]) {
      channelId = id;
      vcMembers = await listMembersConnectedToVC(
        client,
        HALOFUNTIME_ID,
        channelId
      );
    }
  } else {
    console.log(
      `Gossip attempt failed. Gossip type "${gossipType}" is not handled.`
    );
    return;
  }
  if (vcMembers.size === 0) {
    console.log(
      `Gossip attempt failed. No members connected to a ${gossipType} VC.`
    );
    return;
  }

  // Validate no Staff are present
  let staffPresent = false;
  for (const [id, member] of vcMembers.entries()) {
    if (member.roles.cache.has(HALOFUNTIME_ID_ROLE_STAFF)) {
      staffPresent = true;
      break;
    }
  }
  if (staffPresent) {
    console.log("Gossip attempt failed. Staff is present.");
    return;
  }

  // Select a gossip file
  let gossipFile;
  if (gossipType === "Community") {
    gossipFile =
      communityGossips[Math.floor(Math.random() * communityGossips.length)];
  } else if (gossipType === "Forge") {
    gossipFile = forgeGossips[Math.floor(Math.random() * forgeGossips.length)];
  }
  if (!gossipFile) {
    console.log("Gossip attempt failed. Could not select gossip file.");
    return;
  }

  // Connect, Gossip, and GTFO
};

module.exports = {
  attemptRandomGossip: attemptRandomGossip,
};
