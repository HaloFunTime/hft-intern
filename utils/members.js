const {
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
  updateDomainChallengeTeamRole: updateDomainChallengeTeamRole,
};
