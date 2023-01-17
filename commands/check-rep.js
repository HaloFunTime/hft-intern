const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check-rep")
    .setDescription("Check someone's party hosting rep")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("The member whose rep you'd like to check")
        .setRequired(false)
    ),
  async execute(interaction) {
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const checkee = interaction.options.getUser("member") ?? interaction.user;
    if (checkee.bot) {
      await interaction.reply({
        content:
          "You can't check a bot's rep, because bots don't have any rep. We're too awesome for that.",
        ephemeral: true,
      });
      return;
    }
    const response = await axios
      .get(
        `${HALOFUNTIME_API_URL}/reputation/check-rep?discordId=${checkee.id}`,
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
        content: "I couldn't check the rep for the user you specified.",
        ephemeral: true,
      });
      return;
    }
    const repLine = `<@${checkee.id}> has **${
      response.pastYearTotalRep
    } total rep** (from ${response.pastYearUniqueRep} unique giver${
      response.pastYearUniqueRep === 1 ? "" : "s"
    })`;
    const repResetLine = `_You can give ${
      3 - response.thisWeekRepGiven
    } more rep this week. Rep cooldowns will reset in **${
      response.thisWeekRepReset
    }**._`;
    const replyContent =
      checkee.id === interaction.user.id
        ? `${repLine}\n${repResetLine}`
        : repLine;
    await interaction.reply({
      content: replyContent,
      ephemeral: true,
    });
  },
};
