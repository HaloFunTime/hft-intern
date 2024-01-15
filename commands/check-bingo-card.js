const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS,
  HALOFUNTIME_ID_CHANNEL_BINGO_CHALLENGE,
  HALOFUNTIME_ID_ROLE_S6_BINGO_BUFF,
  HALOFUNTIME_ID_ROLE_STAFF,
} = require("../constants.js");
const { generateBingoCardEmbed, scoreBingo } = require("../utils/season06.js");

dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check-bingo-card")
    .setDescription(
      "Check your personal progress toward the Season 6 Bingo Challenge."
    ),
  async execute(interaction) {
    // Pre- and post-challenge handling
    if (!interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_STAFF)) {
      // TODO: Remove Staff gate
      const now = dayjs();
      const cardCheckingStart = dayjs.tz(
        "2024-01-30 14:00:00",
        "America/Denver"
      );
      const cardCheckingEnd = dayjs.tz("2024-04-30 11:00:00", "America/Denver"); // TODO: Update to last day of S6
      if (now < cardCheckingStart) {
        await interaction.reply({
          content: `You can't check your Bingo Card until <t:${cardCheckingStart.unix()}:f>.`,
          ephemeral: true,
        });
        return;
      } else if (now > cardCheckingEnd) {
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
    // Hit the HFT API with a progress check request
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/season-06/check-bingo-card`,
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
          "I couldn't check your Bingo Card. Give me a couple minutes and try again after that.",
        ephemeral: true,
      });
      return;
    }
    if (!response.joinedChallenge) {
      await interaction.editReply({
        content:
          "You can't check your Bingo Card until you've used the `/join-bingo-challenge` command!",
        ephemeral: true,
      });
      return;
    }
    const embeds = [];
    if (response.linkedGamertag) {
      // Generate the bingo card embed if a gamertag is linked
      embeds.push(
        await generateBingoCardEmbed(
          response.boardOrder,
          response.lettersCompleted
        )
      );
    } else {
      // Add a gamertag link prompt embed instead if no gamertag is linked
      embeds.push(
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("No Linked Gamertag Detected")
          .addFields({
            name: "🔗 Link your gamertag!",
            value:
              "> Link your Xbox Live Gamertag to HaloFunTime with the `/link-gamertag` command to participate in the Bingo Challenge! Once your gamertag is verified by Staff, the challenge will begin fetching your in-game data.",
          })
      );
    }
    await interaction.editReply({
      allowedMentions: { users: [interaction.user.id] },
      embeds: embeds,
    });
    // Send ephemeral hint messages on challenge completions
    // TODO
    // Award role
    const bingoCount = scoreBingo(
      response.boardOrder,
      response.lettersCompleted
    );
    if (bingoCount >= 3) {
      const challengeCompleteResponse = await axios
        .post(
          `${HALOFUNTIME_API_URL}/season-06/save-buff`,
          {
            discordUserId: response.discordUserId,
            discordUsername: interaction.user.username,
            bingoCount: bingoCount,
            challengeCount: response.lettersCompleted.length,
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
      if ("error" in challengeCompleteResponse) {
        console.error(challengeCompleteResponse["error"]);
        return;
      }
      if (challengeCompleteResponse.newBuff === true) {
        await interaction.member.roles.add(HALOFUNTIME_ID_ROLE_S6_BINGO_BUFF);
        const channel = interaction.client.channels.cache.get(
          HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS
        );
        await channel.send(
          `Congratulations to <@${challengeCompleteResponse.discordUserId}> for completing the <#${HALOFUNTIME_ID_CHANNEL_BINGO_CHALLENGE}> and earning the <@&${HALOFUNTIME_ID_ROLE_S6_BINGO_BUFF}> role!`
        );
      }
    }
  },
};
