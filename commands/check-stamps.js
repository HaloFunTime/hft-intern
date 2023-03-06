const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { HALOFUNTIME_ID_ROLE_S3_STAMP_CHAMP } = require("../constants.js");

dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check-stamps")
    .setDescription(
      "Check the stamps you've earned for the Season 3 Stamp Challenge!"
    ),
  async execute(interaction) {
    const now = dayjs();
    const stampChallengeStart = dayjs.tz(
      "2023-03-21 11:00:00",
      "America/Denver"
    );
    const stampChallengeEnd = dayjs.tz("2023-06-27 11:00:00", "America/Denver");
    if (now < stampChallengeStart) {
      await interaction.reply({
        content: `The **Stamp Challenge** hasn't started yet, but keep this command in mind if you want to earn the <@&${HALOFUNTIME_ID_ROLE_S3_STAMP_CHAMP}> role!`,
        ephemeral: true,
      });
      return;
    } else if (now > stampChallengeEnd) {
      await interaction.reply({
        content: `The **Stamp Challenge** is over. It's too late to earn the <@&${HALOFUNTIME_ID_ROLE_S3_STAMP_CHAMP}> role.`,
        ephemeral: true,
      });
      return;
    }

    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .get(
        `${HALOFUNTIME_API_URL}/season-03/check-stamps?discordId=${
          interaction.user.id
        }&discordTag=${encodeURIComponent(interaction.user.tag)}`,
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
        content: "I couldn't check your stamps. Sorry about that.",
        ephemeral: true,
      });
      return;
    }
    // TODO: Actually build a stamp response embed
    await interaction.reply({
      content: "Stamp response TBD...",
      ephemeral: true,
    });
  },
};
