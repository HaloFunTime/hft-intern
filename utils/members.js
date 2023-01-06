const { PermissionsBitField } = require("discord.js");

const addRoleToMember = async (client, guildId, roleId, memberId) => {};

const kickMember = async (client, guildId, memberId, kickReason) => {
  const guild = client.guilds.cache.get(guildId);
  const member = await guild.members.fetch(memberId);
  console.log(
    `${guild.name}: Kicking member ${member.user.username}#${member.user.discriminator} (${member.user.id}).`
  );
  await member.kick(kickReason);
  return memberId;
};

module.exports = {
  addRoleToMember: addRoleToMember,
  kickMember: kickMember,
};
