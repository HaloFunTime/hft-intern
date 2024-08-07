const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const { HALOFUNTIME_ID_CHANNEL_STAFF } = require("../constants.js");

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
    await interaction.deferReply({
      allowedMentions: { users: [interaction.user.id] },
    });
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/link/discord-to-xbox-live`,
        {
          discordUserId: interaction.user.id,
          discordUsername: interaction.user.username,
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
      await interaction.editReply({
        content:
          `Your attempt to link <@${interaction.user.id}> to gamertag \`${gamertag}\` on HaloFunTime failed. ` +
          "The gamertag may be invalid or it may already be linked to another Discord account.",
        ephemeral: true,
      });
    } else {
      await interaction.editReply(
        `<@${response.discordUserId}> linked gamertag \`${response.xboxLiveGamertag}\` on HaloFunTime!`
      );
      if (response.verified === false) {
        const staffChannel = interaction.client.channels.cache.get(
          HALOFUNTIME_ID_CHANNEL_STAFF
        );
        await staffChannel.send(
          `<@${interaction.user.id}> wants to link gamertag \`${gamertag}\`, please verify or delete the link here: https://api.halofuntime.com/staff/link/discordxboxlivelink/`
        );
      }
    }
  },
};
