const { PermissionsBitField } = require("discord.js");

const raiseAndOpenForRole = async (client, guildId, categoryId, roleId) => {
  const guild = client.guilds.cache.get(guildId);
  console.log(
    `${guild.name}: Raising category ${categoryId} and opening it to role ${roleId}.`
  );
  const ftfCategory = client.channels.cache.get(categoryId);
  const newName = `🎉 ${ftfCategory.name} 🎉`;
  await ftfCategory.edit({
    name: newName,
    position: 0,
    permissionOverwrites: [
      {
        id: roleId,
        allow: [
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.Connect,
        ],
      },
    ],
  });
};

const lowerAndCloseForRole = async (client, guildId, categoryId, roleId) => {
  const guild = client.guilds.cache.get(guildId);
  console.log(
    `${guild.name}: Lowering category ${categoryId} and closing it to role ${roleId}.`
  );
  const ftfCategory = client.channels.cache.get(categoryId);
  const newName = ftfCategory.name.slice(2, -2);
  await ftfCategory.edit({
    name: newName,
    position: 100,
    permissionOverwrites: [
      {
        id: roleId,
        deny: [
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.Connect,
        ],
      },
    ],
  });
};

module.exports = {
  raiseAndOpenForRole: raiseAndOpenForRole,
  lowerAndCloseForRole: lowerAndCloseForRole,
};
