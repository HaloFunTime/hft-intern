const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("csr")
    .setDescription("Check the CSR for a gamertag")
    .addStringOption((option) =>
      option
        .setName("gamertag")
        .setDescription("A valid Xbox Live gamertag")
        .setMaxLength(15)
        .setRequired(true)
    ),
  async execute(interaction) {
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const gamertag = interaction.options.getString("gamertag");
    const response = await axios
      .get(
        `${HALOFUNTIME_API_URL}/halo-infinite/csr?gamertag=${encodeURIComponent(
          gamertag
        )}`,
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
      if (response.error.details?.detail) {
        await interaction.reply({
          content: response.error.details.detail,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `An unknown error occurred while attempting to fetch CSR data for \`${gamertag}\`.`,
          ephemeral: true,
        });
      }
    } else {
      const rankEmbeds = [];
      for (let playlist of response.playlists) {
        const currentCSR = playlist.current.csr;
        // Only build an embed if the player has valid rank data
        if (currentCSR !== -1) {
          const currentTierDescription = playlist.current.tierDescription;
          // Build the image name
          const imageName = currentTierDescription
            .replace(" ", "-")
            .toLowerCase();
          const rankEmbed = new EmbedBuilder()
            .setTitle(playlist.playlistName)
            .setThumbnail(
              `https://api.halofuntime.com/static/csr_images/${imageName}.png`
            )
            .addFields({
              name: `${currentTierDescription} (${currentCSR})`,
              value: "**GT:** `" + response.gamertag + "`",
            })
            .setTimestamp()
            .setFooter({
              text: "Current CSR",
            });
          rankEmbeds.push(rankEmbed);
        }
      }
      if (rankEmbeds.length === 0) {
        rankEmbeds.push(
          new EmbedBuilder()
            .setTitle("Unranked")
            .setDescription(`\`${response.gamertag}\` is currently unranked.`)
        );
      }
      await interaction.reply({
        embeds: rankEmbeds,
      });
    }
  },
};
