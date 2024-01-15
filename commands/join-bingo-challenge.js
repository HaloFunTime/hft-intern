const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_CHANNEL_BINGO_CHALLENGE,
  HALOFUNTIME_ID_ROLE_S6_BINGO_BUFF,
  HALOFUNTIME_ID_ROLE_STAFF,
} = require("../constants.js");
const { generateBingoCardEmbed } = require("../utils/season06.js");

dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join-bingo-challenge")
    .setDescription("Join the Season 6 Bingo Challenge. B-I-N-G-O."),
  async execute(interaction) {
    // Pre- and post-challenge handling
    if (!interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_STAFF)) {
      // TODO: Remove Staff gate
      const now = dayjs();
      const joinChallengeStart = dayjs.tz(
        "2024-01-30 11:00:00",
        "America/Denver"
      );
      const joinChallengeEnd = dayjs.tz(
        "2024-04-30 11:00:00",
        "America/Denver"
      ); // TODO: Update to last day of S6
      if (now < joinChallengeStart) {
        await interaction.reply({
          content: "You can't join the **Bingo Challenge** yet.",
          ephemeral: true,
        });
        return;
      } else if (now > joinChallengeEnd) {
        await interaction.reply({
          content:
            "The **Bingo Challenge** is over. You'll have to find another retirement home.",
          ephemeral: true,
        });
        return;
      }
    }
    // Command may only be executed in the Bingo Challenge channel
    if (interaction.channelId !== HALOFUNTIME_ID_CHANNEL_BINGO_CHALLENGE) {
      await interaction.reply({
        content: `You may only use this command in the <#${HALOFUNTIME_ID_CHANNEL_BINGO_CHALLENGE}> channel.`,
        ephemeral: true,
      });
      return;
    }
    await interaction.deferReply({
      allowedMentions: { users: [interaction.user.id] },
    });
    // Hit the HFT API with a join request
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/season-06/join-challenge`,
        {
          discordUserId: interaction.user.id,
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
          "You couldn't join the Bingo Challenge at this time. Try again in a couple minutes.",
        ephemeral: true,
      });
      return;
    }
    // Respond
    let responseContent;
    const embeds = [];
    if (response.newJoiner) {
      responseContent = `<@${interaction.user.id}> has just joined the Bingo Challenge!\n\n`;
      responseContent +=
        "Use the `/check-bingo-card` command to check your Bingo Card.\n\n";
      responseContent += `Complete bingo __**three ways**__ to earn the <@&${HALOFUNTIME_ID_ROLE_S6_BINGO_BUFF}> role!`;
      embeds.push(await generateBingoCardEmbed(response.boardOrder, []));
    } else {
      responseContent = `<@${interaction.user.id}> you have already joined the Bingo Challenge. Use the \`/check-bingo-card\` command to check your Bingo Card.`;
    }
    await interaction.editReply({
      content: responseContent,
      embeds: embeds,
    });
  },
};
