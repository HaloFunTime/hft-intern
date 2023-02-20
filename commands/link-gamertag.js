const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link-gamertag")
    .setDescription("Link an Xbox Live gamertag to your Discord account")
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
      .post(
        `${HALOFUNTIME_API_URL}/link/discord-to-xbox-live`,
        {
          discordUserId: interaction.user.id,
          discordUserTag: interaction.user.tag,
          xboxLiveGamertag: gamertag,
        },
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
      await interaction.reply({
        content:
          `Your attempt to link <@${interaction.user.id}> to gamertag \`${gamertag}\` on HaloFunTime failed. ` +
          "The gamertag may be invalid or it may already be linked to another Discord account.",
        ephemeral: true,
      });
    } else {
      await interaction.reply(
        `<@${response.discordUserId}> linked gamertag \`${response.xboxLiveGamertag}\` on HaloFunTime!`
      );
    }
  },
};
