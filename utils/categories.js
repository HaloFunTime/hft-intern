const { PermissionsBitField } = require("discord.js");

const raiseAndOpenForRole = async (
  client,
  guildId,
  categoryId,
  roleId,
  categoryName
) => {
  const guild = client.guilds.cache.get(guildId);
  console.log(
    `${guild.name}: Raising category ${categoryId} and opening it to role ${roleId}.`
  );
  const ftfCategory = client.channels.cache.get(categoryId);
  await ftfCategory.edit({
    name: categoryName,
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
  await ftfCategory.setPosition(0);
};

const lowerAndCloseForRole = async (
  client,
  guildId,
  categoryId,
  roleId,
  categoryName
) => {
  const guild = client.guilds.cache.get(guildId);
  console.log(
    `${guild.name}: Lowering category ${categoryId} and closing it to role ${roleId}.`
  );
  const ftfCategory = client.channels.cache.get(categoryId);
  await ftfCategory.edit({
    name: categoryName,
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
  await ftfCategory.setPosition(10);
};

module.exports = {
  raiseAndOpenForRole: raiseAndOpenForRole,
  lowerAndCloseForRole: lowerAndCloseForRole,
};
