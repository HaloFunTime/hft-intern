const fs = require("node:fs");
const path = require("node:path");
const { REST, Routes } = require("discord.js");
const dotenv = require("dotenv");

dotenv.config();

const { BOT_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);

// If GUILD_ID is present, only update commands for the specified server. Otherwise update them globally.
if (GUILD_ID) {
  rest
    .put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] })
    .then(() => {
      console.log(
        `Successfully deleted all guild commands for server ${GUILD_ID}.`
      );
      const guildCommands = commands.map((command) => {
        return {
          ...command,
          description: `${command.description} (LOCAL TO THIS SERVER)`,
        };
      });
      rest
        .put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
          body: guildCommands,
        })
        .then(() =>
          console.log(
            `Successfully registered guild commands for server ${GUILD_ID}.`
          )
        )
        .catch(console.error);
    })
    .catch(console.error);
} else {
  rest
    .put(Routes.applicationCommands(CLIENT_ID), { body: [] })
    .then(() => {
      console.log(
        `Successfully deleted all global commands for client ${CLIENT_ID}.`
      );
      rest
        .put(Routes.applicationCommands(CLIENT_ID), { body: commands })
        .then(() =>
          console.log(
            `Successfully registered global commands for client ${CLIENT_ID}.`
          )
        )
        .catch(console.error);
    })
    .catch(console.error);
}
