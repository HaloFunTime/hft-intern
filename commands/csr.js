const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const getCSR = require("../utils/getCSR");
const buildRankEmbeds = require("../utils/buildRankEmbeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("csr")
    .setDescription("Get the CSR for a user by entering their gamertag.")
    .addStringOption((option) =>
      option
        .setName("gamertag")
        .setDescription("A valid Xbox Live gamertag")
        .setMaxLength(15)
        .setRequired(true)
    ),
  async execute(interaction) {
    try {
      const gamertag = interaction.options.getString("gamertag");

      const csr_response = await getCSR(gamertag);

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
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          "An error occurred while processing your request as a Discord slash command",
        ephemeral: true,
      });
    }
  },
};
