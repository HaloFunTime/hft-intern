const {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  EmbedBuilder,
} = require("discord.js");
const getCSR = require("../utils/getCSR");
const getGamertagFromDiscordInteraction = require("../utils/getGamertag");
const buildRankEmbeds = require("../utils/buildRankEmbeds");

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName("Get User's CSR")
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    try {
      const gamertag_response = await getGamertagFromDiscordInteraction(
        interaction
      );

      if (gamertag_response.message?.error == "Not found.") {
        await interaction.reply({
          content:
            `<@${interaction.targetUser.id}> hasn't linked a gamertag on HaloFunTime. ` +
            "They can use `/link-gamertag` at any time to do so.",
          ephemeral: true,
        });
        return;
      }

      const gamertag = gamertag_response.data.xboxLiveGamertag;

      const csr_response = await getCSR(gamertag);

      if (csr_response.error) {
        await interaction.reply({
          content:
            "There was an error retrieving the rank for the gamertag associated to this user",
          ephemeral: true,
        });
        return;
      }

      let response_embeds = [];

      if ("error" in csr_response) {
        if (csr_response.error.details?.detail) {
          await interaction.reply({
            content: csr_response.error.details.detail,
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: `An unknown error occurred while attempting to fetch CSR data for \`${gamertag}\`.`,
            ephemeral: true,
          });
        }
      } else {
        response_embeds = buildRankEmbeds(csr_response);
      }

      await interaction.reply({
        embeds: response_embeds,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          "An error occurred while processing your request as a Discord user command",
        ephemeral: true,
      });
    }
  },
};
