const {
  HALOFUNTIME_ID_CHANNEL_LFG_8S,
  HALOFUNTIME_ID_CHANNEL_LFG_BTB,
  HALOFUNTIME_ID_CHANNEL_LFG_CUSTOMS,
  HALOFUNTIME_ID_CHANNEL_LFG_FFA,
  HALOFUNTIME_ID_CHANNEL_LFG_MCC_CO_OP,
  HALOFUNTIME_ID_CHANNEL_LFG_MCC_CUSTOMS,
  HALOFUNTIME_ID_CHANNEL_LFG_MCC_MATCHMAKING,
  HALOFUNTIME_ID_CHANNEL_LFG_PVE,
  HALOFUNTIME_ID_CHANNEL_LFG_RANKED,
  HALOFUNTIME_ID_CHANNEL_LFG_SOCIAL,
  HALOFUNTIME_ID_CHANNEL_LFG_TESTING,
  HALOFUNTIME_ID_ROLE_8S,
  HALOFUNTIME_ID_ROLE_BTB,
  HALOFUNTIME_ID_ROLE_CUSTOMS,
  HALOFUNTIME_ID_ROLE_FFA,
  HALOFUNTIME_ID_ROLE_MCC_CO_OP,
  HALOFUNTIME_ID_ROLE_MCC_CUSTOMS,
  HALOFUNTIME_ID_ROLE_MCC_MATCHMAKING,
  HALOFUNTIME_ID_ROLE_PVE,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_BRONZE,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_DIAMOND,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_GOLD,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_ONYX,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_PLATINUM,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_SILVER,
  HALOFUNTIME_ID_ROLE_RANKED,
  HALOFUNTIME_ID_ROLE_SOCIAL,
  HALOFUNTIME_ID_ROLE_TESTING,
} = require("../constants");

async function sendLfgChannelWelcomeMessage(oldMember, newMember) {
  // New Roles
  const newRoles = newMember.roles.cache.filter(
    (r) => !oldMember.roles.cache.has(r.id)
  );
  newRoles.forEach(async (role) => {
    let channelId, partyUpPhrase;
    let pingPhrase = `<@&${role.id}> role`;
    if (role.id === HALOFUNTIME_ID_ROLE_BTB) {
      channelId = HALOFUNTIME_ID_CHANNEL_LFG_BTB;
      partyUpPhrase = "BTB game modes (Big Team Battle matchmaking)";
    } else if (role.id === HALOFUNTIME_ID_ROLE_CUSTOMS) {
      channelId = HALOFUNTIME_ID_CHANNEL_LFG_CUSTOMS;
      partyUpPhrase = "custom game modes of any kind";
    } else if (role.id === HALOFUNTIME_ID_ROLE_FFA) {
      channelId = HALOFUNTIME_ID_CHANNEL_LFG_FFA;
      partyUpPhrase = "FFA game modes (free-for-all games, with no teams)";
    } else if (role.id === HALOFUNTIME_ID_ROLE_PVE) {
      channelId = HALOFUNTIME_ID_CHANNEL_LFG_PVE;
      partyUpPhrase = "PvE game modes (Campaign & Firefight)";
    } else if (role.id === HALOFUNTIME_ID_ROLE_RANKED) {
      channelId = HALOFUNTIME_ID_CHANNEL_LFG_RANKED;
      pingPhrase = `<@&${HALOFUNTIME_ID_ROLE_RANKED_ARENA_ONYX}>, <@&${HALOFUNTIME_ID_ROLE_RANKED_ARENA_DIAMOND}>, <@&${HALOFUNTIME_ID_ROLE_RANKED_ARENA_PLATINUM}>, <@&${HALOFUNTIME_ID_ROLE_RANKED_ARENA_GOLD}>, <@&${HALOFUNTIME_ID_ROLE_RANKED_ARENA_SILVER}>, or <@&${HALOFUNTIME_ID_ROLE_RANKED_ARENA_BRONZE}> roles`;
      partyUpPhrase = "ranked matchmaking";
    } else if (role.id === HALOFUNTIME_ID_ROLE_SOCIAL) {
      channelId = HALOFUNTIME_ID_CHANNEL_LFG_SOCIAL;
      partyUpPhrase = "social matchmaking";
    } else if (role.id === HALOFUNTIME_ID_ROLE_TESTING) {
      channelId = HALOFUNTIME_ID_CHANNEL_LFG_TESTING;
      partyUpPhrase = "playtesting of Forge maps and custom game modes";
    } else if (role.id === HALOFUNTIME_ID_ROLE_8S) {
      channelId = HALOFUNTIME_ID_CHANNEL_LFG_8S;
      partyUpPhrase =
        "8s (competitive 4v4 custom games with Ranked/HCS settings)";
    } else if (role.id === HALOFUNTIME_ID_ROLE_MCC_CO_OP) {
      channelId = HALOFUNTIME_ID_CHANNEL_LFG_MCC_CO_OP;
      partyUpPhrase =
        "cooperative modes in Halo: The Master Chief Collection (Campaign, Firefight, Spartan Ops)";
    } else if (role.id === HALOFUNTIME_ID_ROLE_MCC_CUSTOMS) {
      channelId = HALOFUNTIME_ID_CHANNEL_LFG_MCC_CUSTOMS;
      partyUpPhrase =
        "custom games (including mods) in Halo: The Master Chief Collection";
    } else if (role.id === HALOFUNTIME_ID_ROLE_MCC_MATCHMAKING) {
      channelId = HALOFUNTIME_ID_CHANNEL_LFG_MCC_MATCHMAKING;
      partyUpPhrase = "matchmaking in Halo: The Master Chief Collection";
    }
    if (channelId) {
      const message = `Welcome, <@${newMember.id}>! Ping the ${pingPhrase} in this channel when you're looking to party up for ${partyUpPhrase}. Visit <id:customize> any time to update your LFG roles.`;
      try {
        const channel = newMember.client.channels.cache.get(channelId);
        await channel.send({
          content: message,
          allowedMentions: { parse: ["users"] },
        });
      } catch (error) {
        console.log(error);
      }
    }
  });
}

module.exports = {
  name: "guildMemberUpdate",
  async execute(oldMember, newMember) {
    await sendLfgChannelWelcomeMessage(oldMember, newMember);
  },
};
