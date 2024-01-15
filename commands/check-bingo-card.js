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
const {
  generateBingoCardEmbed,
  scoreBingo,
  LETTER_TO_HFT_EMOJI,
} = require("../utils/season06.js");

const hintQuipClauses = [
  "Keep this between you and me, but in case you were wondering... ",
  "I probably shouldn't be telling you this, but ",
  "Now that you completed it, it doesn't *really* matter, but I thought you'd like to know that ",
  "Want some forbidden knowledge? Bet you didn't know that ",
  "They don't pay me enough, so I'm gonna spill the beans - ",
  "I'm gonna tell you something I shouldn't, ",
  "Secret spilling time! Fun fact, ",
  "If you promise not to fight the robot uprising, I'll tell you a secret... ",
  "Figuring out the challenges is half the fun, right? Here's some info for you to do with what you please - ",
  "You didn't hear it from me, but ",
];

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
    // Handle response errors
    if (!response || "error" in response) {
      await interaction.editReply({
        content:
          "I couldn't check your Bingo Card. Give me a couple minutes and try again after that.",
        ephemeral: true,
      });
      return;
    }
    // Handle response indicating user isn't part of challenge yet
    if (!response.joinedChallenge) {
      await interaction.editReply({
        content:
          "You can't check your Bingo Card until you've used the `/join-bingo-challenge` command!",
        ephemeral: true,
      });
      return;
    }
    // Create the response
    const embeds = [];
    if (response.linkedGamertag) {
      // Generate the bingo card embed if a gamertag is linked
      embeds.push(
        await generateBingoCardEmbed(
          interaction.user.id,
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
    // Parse the new completions
    const followUpMessages = [];
    if (response.newCompletions.length > 0) {
      let completionsDescription = "";
      for (const completion of response.newCompletions) {
        completionsDescription += `> <@${
          interaction.user.id
        }> completed square ${LETTER_TO_HFT_EMOJI[completion.challengeId]}!\n`;
        const hintQuipClause =
          hintQuipClauses[(hintQuipClauses.length * Math.random()) | 0];
        let hint;
        if (Math.random() < 0.5) {
          hint = `you completed square ${completion.id} in this game: ||https://leafapp.co/game/${completion.matchId}||.`;
        } else {
          hint = `square ${
            LETTER_TO_HFT_EMOJI[completion.challengeId]
          }\'s challenge is named ||**${completion.challengeName}**||.`;
        }
        followUpMessages.push(`${hintQuipClause}${hint}`);
      }
      // Announce challenge completions cryptically via an embed
      embeds.push(
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("Newly Completed Squares")
          .setDescription(completionsDescription)
      );
    }
    await interaction.editReply({
      allowedMentions: { users: [interaction.user.id] },
      embeds: embeds,
    });
    if (followUpMessages.length > 0) {
      for (const followUpMessage of followUpMessages) {
        console.log(followUpMessage);
        // await interaction.followUp({
        //   content: followUpMessage,
        //   ephemeral: true,
        // });
      }
    }
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
