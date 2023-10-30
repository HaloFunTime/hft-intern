const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_ROLE_PATHFINDER,
  HALOFUNTIME_ID_CHANNEL_WAYWO,
} = require("../constants.js");

dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check-beans")
    .setDescription("Check your 🫘 Pathfinder Bean count."),
  async execute(interaction) {
    // Command may only be executed by someone with the Pathfinder role
    if (!interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_PATHFINDER)) {
      await interaction.reply({
        content: `You must have the <@&${HALOFUNTIME_ID_ROLE_PATHFINDER}> role to use this command. You can get it in <id:customize>.`,
        ephemeral: true,
      });
      return;
    }
    // Hit the HFT API with a bean count check request
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/pathfinder/check-beans`,
        {
          discordId: interaction.user.id,
          discordUsername: interaction.user.username,
        },
        {
          headers: {
            Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
          },
        }
      )
      .then((response) => response.data)
      .catch(async (error) => {
        console.error(error);
        // Return the error payload directly if present
        if (error.response.data) {
          return error.response.data;
        }
      });
    if ("error" in response) {
      await interaction.editReply({
        content:
          "I couldn't check your 🫘 **Pathfinder Bean** count. Sorry about that.",
        ephemeral: true,
      });
      return;
    }
    const line1 = `<@${interaction.user.id}> has ${
      response.beanCount
    } 🫘 **Pathfinder Bean${response.beanCount === 1 ? "" : "s"}**.`;
    const line2 = `*Earn more by participating in **Pathfinder Hikes**, leaving thoughtful comments on <#${HALOFUNTIME_ID_CHANNEL_WAYWO}> posts, and increasing your FunTimer rank.*`;
    await interaction.reply({
      content: `${line1}\n\n${line2}`,
      ephemeral: true,
    });
  },
};
