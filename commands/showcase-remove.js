const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("showcase-remove")
    .setDescription("Remove a file from your Showcase")
    .addIntegerOption((option) =>
      option
        .setName("position")
        .setDescription("Position of file to remove from your Showcase")
        .setMinValue(1)
        .setMaxValue(5)
        .setRequired(true)
    ),
  async execute(interaction) {
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const position = interaction.options.getInteger("position");
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/showcase/remove-file`,
        {
          discordUserId: interaction.user.id,
          discordUsername: interaction.user.username,
          position: position,
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
        content: `We couldn't remove file #${position} from your Showcase at this time. Sorry about that.`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `You successfully removed file #${position} from your Showcase!`,
        ephemeral: true,
      });
    }
  },
};
