const { EmbedBuilder, SlashCommandBuilder, Embed } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS,
  HALOFUNTIME_ID_CHANNEL_BOAT_CHALLENGE,
  HALOFUNTIME_ID_CHANNEL_STAFF,
  HALOFUNTIME_ID_ROLE_E3_BOAT_CAPTAIN,
  HALOFUNTIME_ID_ROLE_STAFF,
} = require("../constants.js");
const { ERA_DATA } = require("../utils/eras.js");
const { getApplicationCommandMention } = require("../utils/formatting.js");

dayjs.extend(utc);
dayjs.extend(timezone);

const preDepartureQuips = [
  "Gotta make sure we have enough FunTime snacks.",
  "You would not believe how little this boat cost me.",
  "Do you have your HaloFunTime branded pool noodle?",
  "I need to stock the galley.",
  "I need to spend some time in the engine room.",
  "I need to wash the sheets.",
  "I need to make sure my insurance company knows exactly how much this thing's worth.",
  "I need to check the hull for any damage.",
  "I need to make sure the lights are working.",
  "We need as many deckhands as possible.",
];

const incompleteAssignmentsQuips = [
  "Get to work! You still have assignments to complete for the week.",
  "You're not done yet! Complete your assignments for the week.",
  "Lazy oaf! Finish your assignments for the week before they reset.",
  "Do you want a promotion? Complete your assignments for the week.",
  "This boat doesn't run on magic. Complete your assignments for the week.",
  "Work harder! You're not impressing me with those incomplete assignments.",
  "Shape up sailor! These assignments won't complete themselves.",
  "The sea is unforgiving - just like me when assignments are incomplete.",
  "No shore leave until these assignments are done for the week.",
  "A true sailor never leaves their duties unfinished. Get back to work!",
  "The Captain's not pleased with your incomplete assignments, matey.",
];

const weeklyAssignmentsCompletedQuips = [
  "Rest up, sailor. You've completed your assignments for the week.",
  "Ahoy! You're done with your assignments for the week.",
  "Good thing I didn't throw you to the sharks! Nice work completing your weekly assignments.",
  "Well shiver me timbers! All assignments complete for this week's voyage.",
  "You've earned your sea legs! Your weekly assignments are done and dusted.",
  "Splice the mainbrace! You've finished all your assignments this week.",
  "By Neptune's beard, you've completed your weekly assignments!",
  "The Captain approves - all assignments ship-shape for the week.",
  "Smooth sailing ahead - you've finished all your assignments this week.",
  "A job well done, matey! Weekly assignments complete and accounted for.",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check-boat-assignments")
    .setDescription("Check your Era 3 Boat Challenge assignments."),
  async execute(interaction) {
    // Pre- and post-challenge handling
    const now = dayjs();
    const assignmentCheckingStart = ERA_DATA["era03"].startTime.add(7, "day");
    const assignmentCheckingEnd = ERA_DATA["era03"].endTime;
    if (
      now < assignmentCheckingStart &&
      !interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_STAFF)
    ) {
      const preDepartureQuip =
        preDepartureQuips[(preDepartureQuips.length * Math.random()) | 0];
      await interaction.reply({
        content: `I won't have an assignment for you until <t:${assignmentCheckingStart.unix()}:f>, when we set sail. ${preDepartureQuip}`,
        ephemeral: true,
      });
      return;
    } else if (now > assignmentCheckingEnd) {
      await interaction.reply({
        content: "The **Boat Challenge** is over. That ship has sailed.",
        ephemeral: true,
      });
      return;
    }
    // Command may only be executed in the Boat Challenge channel
    if (
      interaction.channelId !== HALOFUNTIME_ID_CHANNEL_BOAT_CHALLENGE &&
      interaction.channelId !== HALOFUNTIME_ID_CHANNEL_STAFF
    ) {
      await interaction.reply({
        content: `You may only use this command in the <#${HALOFUNTIME_ID_CHANNEL_BOAT_CHALLENGE}> channel.`,
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
        `${HALOFUNTIME_API_URL}/era-03/check-deckhand-games`,
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
      console.error("Ran into an error checking deckhand games.");
      await interaction.editReply({
        content:
          "I couldn't check your Boat Assignments. Give me a couple minutes and try again after that.",
        ephemeral: true,
      });
      return;
    }
    // Hit the HFT API with a progress check request
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/era-03/check-boat-assignments`,
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
          "I couldn't check your Boat Assignments. Give me a couple minutes and try again after that.",
        ephemeral: true,
      });
      return;
    }
    // Handle response indicating user isn't part of challenge yet
    if (!response.joinedChallenge) {
      const boardBoatMention = await getApplicationCommandMention(
        "board-boat",
        interaction.client
      );
      await interaction.editReply({
        content: `Please use ${boardBoatMention} first. You need a rank before I can give you assignments.`,
        ephemeral: true,
      });
      return;
    }
    // Create the response
    const embeds = [];
    if (response.linkedGamertag) {
      // Generate the boat assignment embed if a gamertag is linked
      const overviewEmbed = new EmbedBuilder()
        .setColor(response.currentRankTier >= 10 ? 0x2ecc71 : 0x006994)
        .setTitle("Era 3 Boat Challenge")
        .setDescription(
          response.currentRankTier >= 10
            ? `Who's the <@&${HALOFUNTIME_ID_ROLE_E3_BOAT_CAPTAIN}> now? You are!`
            : "Assignments must be completed in matchmade Halo Infinite games."
        );
      embeds.push(overviewEmbed);
      // Add an assignments progress embed if incomplete assignments exist and the user isn't already at rank 10
      if (
        response.currentRankTier < 10 &&
        (!response.assignment1Completed ||
          !response.assignment2Completed ||
          !response.assignment3Completed)
      ) {
        let progressDescription =
          "I just picked your assignments for this week. Check again when you've made some progress.";
        if (response.existingAssignments) {
          progressDescription =
            incompleteAssignmentsQuips[
              (incompleteAssignmentsQuips.length * Math.random()) | 0
            ];
        }
        const assignmentsEmbed = new EmbedBuilder()
          .setColor(0x006994)
          .setTitle(
            `Weekly Assignment${
              response.existingAssignments ? " Progress" : "s"
            }`
          )
          .setDescription(
            `<@${response.discordUserId}>'s Rank: **${response.currentRank}**\n*${progressDescription}*`
          )
          .addFields({
            name: "**Assignment #1:**",
            value: `> *${response.assignment1}* ${
              response.assignment1Completed ? "✅" : "❌"
            }`,
          });
        if (response.assignment2) {
          assignmentsEmbed.addFields({
            name: "**Assignment #2:**",
            value: `> *${response.assignment2}* ${
              response.assignment2Completed ? "✅" : "❌"
            }`,
          });
        }
        if (response.assignment3) {
          assignmentsEmbed.addFields({
            name: "**Assignment #3:**",
            value: `> *${response.assignment3}* ${
              response.assignment3Completed ? "✅" : "❌"
            }`,
          });
        }
        embeds.push(assignmentsEmbed);
      } else if (response.justPromoted) {
        const justPromotedEmbed = new EmbedBuilder()
          .setColor(0xffd700)
          .setTitle("Promotion Alert!")
          .setDescription(
            `Great work! You've been promoted to **${response.currentRank}**!`
          );
        embeds.push(justPromotedEmbed);
      } else {
        let completedDescription =
          weeklyAssignmentsCompletedQuips[
            (weeklyAssignmentsCompletedQuips.length * Math.random()) | 0
          ];
        const completedEmbed = new EmbedBuilder()
          .setColor(0x006994)
          .setTitle("Weekly Assignments Completed")
          .setDescription(
            `<@${response.discordUserId}>'s Rank: **${response.currentRank}**\n*${completedDescription}*`
          );
        embeds.push(completedEmbed);
      }
    } else {
      const linkGamertagMention = await getApplicationCommandMention(
        "link-gamertag",
        interaction.client
      );
      // Add a gamertag link prompt embed instead if no gamertag is linked
      embeds.push(
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("No Linked Gamertag Detected")
          .addFields({
            name: "🔗 Link your gamertag!",
            value: `> Link your Xbox Live Gamertag to HaloFunTime with the ${linkGamertagMention} command to participate in the Boat Challenge. Once your gamertag is verified by Staff, the challenge will begin fetching your in-game data.`,
          })
      );
    }
    // TODO: Add an extra embed for newly-unlocked secrets
    await interaction.editReply({
      allowedMentions: { users: [interaction.user.id] },
      embeds: embeds,
    });
    // Award role
    if (response.currentRankTier >= 10) {
      const challengeCompleteResponse = await axios
        .post(
          `${HALOFUNTIME_API_URL}/era-03/save-boat-captain`,
          {
            discordUserId: response.discordUserId,
            discordUsername: interaction.user.username,
            rankTier: response.currentRankTier,
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
      if (challengeCompleteResponse.newBoatCaptain === true) {
        await interaction.member.roles.add(HALOFUNTIME_ID_ROLE_E3_BOAT_CAPTAIN);
        const channel = interaction.client.channels.cache.get(
          HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS
        );
        await channel.send(
          `Congratulations to <@${challengeCompleteResponse.discordUserId}> for completing the <#${HALOFUNTIME_ID_CHANNEL_BOAT_CHALLENGE}> and earning the <@&${HALOFUNTIME_ID_ROLE_E3_BOAT_CAPTAIN}> role!`
        );
      }
    }
  },
};
