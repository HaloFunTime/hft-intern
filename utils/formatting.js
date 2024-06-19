const { Client } = require("discord.js");

/**
 * Gets the application command mention
 * @param {String} name
 * @param {Client} client
 */
async function getApplicationCommandMention(name, client) {
  await client.application.commands.fetch();
  const command = client.application.commands.cache.find((e) => e.name == name);
  if (!command) {
    console.warn(`Failed to fetch command "${name}"`);
    return `\`/${name}\``;
  }
  return `</${command.name}:${command.id}>`;
}

module.exports = {
  getApplicationCommandMention,
};
