const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const { getApplicationCommandMention } = require("../utils/formatting");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gamertag")
    .setDescription("Get the Xbox Live gamertag linked to a member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("The member whose gamertag to get")
        .setRequired(true)
    ),
  async execute(interaction) {
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const member = interaction.options.getUser("member");
    const response = await axios
      .get(
        `${HALOFUNTIME_API_URL}/link/discord-to-xbox-live?discordId=${
          member.id
        }&discordUsername=${encodeURIComponent(member.username)}`,
        {
          headers: {
            Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
          },
        }
      )
      .then((response) => response.data)
      .catch(async (error) => {
        // Return the error payload directly if present
        if (error.response.data) {
          return error.response.data;
        }
        console.error(error);
      });
    if ("error" in response) {
      const command = await getApplicationCommandMention(
        "link-gamertag",
        interaction.client
      );
      // Send a reply that pings the user if they haven't linked a gamertag
      await interaction.reply({
        content:
          `<@${member.id}> hasn't linked a gamertag on HaloFunTime. ` +
          `They can use ${command} at any time to do so.`,
        allowedMentions: { users: [member.id] },
      });
    } else {
      // Send a reply that doesn't ping the user if they have linked a gamertag
      await interaction.reply({
        content: `<@${response.discordUserId}>'s linked gamertag is \`${
          response.xboxLiveGamertag
        }\`${response.verified ? " (verified ✅)" : ""}.`,
        allowedMentions: { parse: [] },
      });
    }
  },
};
