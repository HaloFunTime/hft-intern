const fs = require("node:fs");
const path = require("node:path");
const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
  NoSubscriberBehavior,
} = require("@discordjs/voice");
const {
  HALOFUNTIME_ID,
  HALOFUNTIME_ID_CHANNEL_COMMUNITY,
  HALOFUNTIME_ID_CHANNEL_PATHFINDERS_VC_1,
  HALOFUNTIME_ID_CHANNEL_PATHFINDERS_VC_2,
  HALOFUNTIME_ID_ROLE_STAFF,
} = require("../constants.js");
const { listMembersConnectedToVC } = require("./voice.js");

const attemptRandomGossip = async (client) => {
  console.log("Attempting gossip...");
  const gossipsPath = path.join(__dirname, "gossips");
  const randomGossipFiles = fs
    .readdirSync(gossipsPath)
    .filter((file) => file.endsWith(".wav") && !file.startsWith("joke"));
  if (randomGossipFiles.length === 0) {
    console.log("Gossip attempt failed. No gossip files found.");
    return;
  }
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);

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
    vcMembers = await listMembersConnectedToVC(client, guild.id, channelId);
  } else if (gossipType === "Forge") {
    for (let id of [
      HALOFUNTIME_ID_CHANNEL_PATHFINDERS_VC_1,
      HALOFUNTIME_ID_CHANNEL_PATHFINDERS_VC_2,
    ]) {
      channelId = id;
      vcMembers = await listMembersConnectedToVC(client, guild.id, channelId);
      if (vcMembers.size > 0) {
        break;
      }
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

  // Connect to the VC
  const connection = joinVoiceChannel({
    adapterCreator: guild.voiceAdapterCreator,
    channelId: channelId,
    guildId: guild.id,
    selfDeaf: false,
    selfMute: false,
  });

  // Create the audio resource and player
  const audioResource = createAudioResource(`${gossipsPath}/${gossipFile}`);
  const audioPlayer = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
    },
  });

  // Subscribe the connection to the player
  const subscription = connection.subscribe(audioPlayer);

  // Play the audio file and disconnect/clean up once done
  audioPlayer.play(audioResource);
  audioPlayer.on(AudioPlayerStatus.Idle, () => {
    subscription.unsubscribe();
    connection.disconnect();
    audioPlayer.stop();
    console.log(
      `Gossip attempt successful! Played ${gossipFile} (a ${gossipType} gossip) in channel ${channelId} for these listeners: ${vcMembers
        .map((m) => m.user.username)
        .join(", ")}`
    );
  });
};

module.exports = {
  attemptRandomGossip: attemptRandomGossip,
};
