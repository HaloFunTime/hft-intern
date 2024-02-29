const { EmbedBuilder, SlashCommandBuilder, Embed } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS,
  HALOFUNTIME_ID_CHANNEL_BINGO_CHALLENGE,
  HALOFUNTIME_ID_ROLE_E1_BINGO_BUFF,
  HALOFUNTIME_ID_ROLE_STAFF,
  LINK_GAMERTAG_ID,
  LINK_GAMERTAG_NAME,
} = require("../constants.js");
const { ERA_DATA } = require("../utils/eras.js");
const {
  generateBingoCardEmbed,
  scoreBingo,
  LETTER_TO_HFT_EMOJI,
} = require("../utils/era01.js");

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
      "Check your personal progress toward the Era 1 Bingo Challenge."
    ),
  async execute(interaction) {
    // Pre- and post-challenge handling
    const now = dayjs();
    const cardCheckingStart = ERA_DATA["era01"].startTime.add(4, "hour");
    const cardCheckingEnd = ERA_DATA["era01"].endTime;
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
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    // Hit the HFT API with a game check request
    const gameResponse = await axios
      .post(
        `${HALOFUNTIME_API_URL}/era-01/check-participant-games`,
        {
          discordUserIds: [interaction.user.id],
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
        if (error?.response?.data) {
          return error.response.data;
        }
      });
    if (!gameResponse || "error" in gameResponse) {
      console.log(gameResponse);
      console.error("Ran into an error checking participant games.");
      await interaction.editReply({
        content:
          "I couldn't check your Bingo Card. Give me a couple minutes and try again after that.",
        ephemeral: true,
      });
      return;
    }
    // Hit the HFT API with a progress check request
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/era-01/check-bingo-card`,
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
            value: `> Link your Xbox Live Gamertag to HaloFunTime with the </${LINK_GAMERTAG_NAME}:${LINK_GAMERTAG_ID}> command to participate in the Bingo Challenge! Once your gamertag is verified by Staff, the challenge will begin fetching your in-game data.`,
          })
      );
    }
    // Parse the new completions
    const followUpMessages = [];
    if (response.newCompletions.length > 0) {
      let completionsDescription = "";
      for (const completion of response.newCompletions) {
        completionsDescription += `- Square ${
          LETTER_TO_HFT_EMOJI[completion.challengeId]
        } was just completed!\n`;
        const hintQuipClause =
          hintQuipClauses[(hintQuipClauses.length * Math.random()) | 0];
        let title, hint, link;
        if (Math.random() < 0.5) {
          title = "Bingo Challenge Hint: Game Link";
          hint = `you completed square ${
            LETTER_TO_HFT_EMOJI[completion.challengeId]
          } in the game this hint message links to.`;
          link =
            completion.challengeId < "U"
              ? `https://halotracker.com/halo-infinite/match/${completion.matchId}`
              : `https://leafapp.co/game/${completion.matchId}`;
        } else {
          title = "Bingo Challenge Hint: Challenge Name";
          hint = `square ${
            LETTER_TO_HFT_EMOJI[completion.challengeId]
          }\'s challenge is named ||**${completion.challengeName}**||.`;
          link = null;
        }
        followUpMessages.push({
          title: title,
          content: `${hintQuipClause}${hint}`,
          link: link,
        });
      }
      // Announce challenge completions cryptically via an embed
      embeds.push(
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("Newly Completed Squares!")
          .setDescription(completionsDescription)
      );
    }
    await interaction.editReply({
      allowedMentions: { users: [interaction.user.id] },
      embeds: embeds,
    });
    if (followUpMessages.length > 0) {
      for (const followUpMessage of followUpMessages) {
        try {
          const embed = new EmbedBuilder()
            .setColor(0xffd700)
            .setTitle(followUpMessage.title)
            .setDescription(followUpMessage.content);
          if (followUpMessage.link) {
            embed.setURL(followUpMessage.link);
          }
          await interaction.member.send({ embeds: [embed] });
        } catch (error) {
          console.error(error);
          console.log("Failed to DM hint to Bingo Challenge participant.");
        }
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
          `${HALOFUNTIME_API_URL}/era-01/save-buff`,
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
        await interaction.member.roles.add(HALOFUNTIME_ID_ROLE_E1_BINGO_BUFF);
        const channel = interaction.client.channels.cache.get(
          HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS
        );
        await channel.send(
          `Congratulations to <@${challengeCompleteResponse.discordUserId}> for completing the <#${HALOFUNTIME_ID_CHANNEL_BINGO_CHALLENGE}> and earning the <@&${HALOFUNTIME_ID_ROLE_E1_BINGO_BUFF}> role!`
        );
      }
    }
  },
};
