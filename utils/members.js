const {
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_8S_FOR_GLORY,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_8S_WITH_FRIENDS,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_BTB_AND_CHILL,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_BTB_SWEAT_FEST,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_CAMPAIGN_CO_OP,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_CASUAL_4V4_HALO,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_CRAZY_CUSTOM_GAMES,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_FFA_SWEAT_LORDS,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_FFA_VIBE_LORDS,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_FIESTA,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_FIREFIGHT_FUN,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_FORGE_MAP_TESTS,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_INFECTION,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_RANKED_ARENA_GRIND,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_RANKED_ARENA_VIBES,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_SNIPERS_ANONYMOUS,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_TACTICAL_UNIT,
  HALOFUNTIME_ID_CHANNEL_LFG,
  HALOFUNTIME_ID_EMOJI_FUNTIMEBOT,
  HALOFUNTIME_ID_EMOJI_HFT_INTERN,
  HALOFUNTIME_ID_ROLE_TEAM_FUNTIMEBOT,
  HALOFUNTIME_ID_ROLE_TEAM_HFT_INTERN,
} = require("../constants.js");

const kickMember = async (client, guildId, memberId, kickReason) => {
  const guild = client.guilds.cache.get(guildId);
  const member = await guild.members.fetch(memberId);
  console.log(
    `${guild.name}: Kicking member ${member.user.username}#${member.user.discriminator} (${member.user.id}).`
  );
  await member.kick(kickReason);
  return memberId;
};

const lfgThreadHealthReport = async (client) => {
  const lfgChannel = client.channels.cache.get(HALOFUNTIME_ID_CHANNEL_LFG);
  await lfgChannel.threads.fetchActive();
  await lfgChannel.threads.fetchArchived();
  const lfgThreadIds = [
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_8S_FOR_GLORY,
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_8S_WITH_FRIENDS,
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_BTB_AND_CHILL,
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_BTB_SWEAT_FEST,
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_CAMPAIGN_CO_OP,
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_CASUAL_4V4_HALO,
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_CRAZY_CUSTOM_GAMES,
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_FFA_SWEAT_LORDS,
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_FFA_VIBE_LORDS,
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_FIESTA,
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_FIREFIGHT_FUN,
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_FORGE_MAP_TESTS,
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_INFECTION,
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_RANKED_ARENA_GRIND,
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_RANKED_ARENA_VIBES,
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_SNIPERS_ANONYMOUS,
    HALOFUNTIME_ID_CHANNEL_LFG_THREAD_TACTICAL_UNIT,
  ];
  let healthString = "";
  for (const threadId of lfgThreadIds) {
    const thread = lfgChannel.threads.cache.find((t) => t.id === threadId);
    await thread.members.fetch();
    healthString += `- <#${threadId}> - ${thread.messageCount} messages\n`;
  }
  return healthString;
};

const updateDomainChallengeTeamRole = async (member, assignedTeam) => {
  console.log(
    `Updating Domain Challenge role for ${member.user.username} to Team ${assignedTeam}.`
  );
  if (assignedTeam === "FunTimeBot") {
    // Remove the HFT Intern role if present
    if (member.roles.cache.has(HALOFUNTIME_ID_ROLE_TEAM_HFT_INTERN)) {
      await member.roles.remove(HALOFUNTIME_ID_ROLE_TEAM_HFT_INTERN);
    }
    // Add the FunTimeBot role if absent
    if (!member.roles.cache.has(HALOFUNTIME_ID_ROLE_TEAM_FUNTIMEBOT)) {
      await member.roles.add(HALOFUNTIME_ID_ROLE_TEAM_FUNTIMEBOT);
    }
    return {
      roleId: HALOFUNTIME_ID_ROLE_TEAM_FUNTIMEBOT,
      emojiId: HALOFUNTIME_ID_EMOJI_FUNTIMEBOT,
      emojiString: `<:funtimebot:${HALOFUNTIME_ID_EMOJI_FUNTIMEBOT}>`,
    };
  } else if (assignedTeam === "HFT Intern") {
    // Remove the FunTimeBot role if present
    if (member.roles.cache.has(HALOFUNTIME_ID_ROLE_TEAM_FUNTIMEBOT)) {
      await member.roles.remove(HALOFUNTIME_ID_ROLE_TEAM_FUNTIMEBOT);
    }
    // Add the HFT Intern role if absent
    if (!member.roles.cache.has(HALOFUNTIME_ID_ROLE_TEAM_HFT_INTERN)) {
      await member.roles.add(HALOFUNTIME_ID_ROLE_TEAM_HFT_INTERN);
    }
    return {
      roleId: HALOFUNTIME_ID_ROLE_TEAM_HFT_INTERN,
      emojiId: HALOFUNTIME_ID_EMOJI_HFT_INTERN,
      emojiString: `<:hft_intern:${HALOFUNTIME_ID_EMOJI_HFT_INTERN}>`,
    };
  } else {
    // Remove both team roles
    await member.roles.remove([
      HALOFUNTIME_ID_ROLE_TEAM_FUNTIMEBOT,
      HALOFUNTIME_ID_ROLE_TEAM_HFT_INTERN,
    ]);
    return { roleId: null, emojiId: null, emojiString: null };
  }
};

module.exports = {
  kickMember: kickMember,
  lfgThreadHealthReport: lfgThreadHealthReport,
  updateDomainChallengeTeamRole: updateDomainChallengeTeamRole,
};
