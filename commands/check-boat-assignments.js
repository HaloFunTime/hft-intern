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

const overviewQuips = [
  "Avast ye, matey! This boat's a-comin'!",
  "I'm on a boat! So are you! But don't jump overboard because I don't have insurance.",
  "It's a sailor's life for me! And you. Whether you like it or not.",
  "Welcome aboard the S.S. FunTime! Mind the leaks, they're part of the charm.",
  "Batten down the hatches! And maybe grab a bucket, just in case.",
  "All hands on deck! Well, the parts of the deck that aren't falling apart.",
  "Set sail for adventure! Or at least as far as this rickety vessel will take us.",
  "Yo ho ho and a bottle of... actually, no bottles allowed on board. Safety first!",
  "Ready to rule the seven seas? We'll start with the kiddie pool and work our way up.",
  "Anchors aweigh! Though between you and me, I'm not sure where the anchor went.",
  "Raise the sails! Well, what's left of them after that unfortunate seagull incident.",
  "Welcome to the finest vessel in the harbor! Don't mind the duct tape repairs.",
  "Prepare for the voyage of a lifetime! Or at least until we need to call the coast guard.",
  "Chart a course for glory! Just as soon as I find where I put the compass.",
  "The sea beckons! Though it might just be the sound of water in the bilge.",
  "Behold our mighty vessel! The paint's still wet in some places, so watch your step.",
  "Time to experience the majesty of the ocean! From a relatively safe distance.",
  "Join our brave crew! No prior sailing experience required (or possible on this boat).",
  "Set a course for adventure! Once we figure out which end is the front.",
  "Prepare to meet your destiny! Right after we patch these mysterious holes.",
  "Sailing the high seas! Well, more like the moderately elevated seas.",
  "Welcome to the pride of the fleet! Don't ask about the other boats.",
  "Ready for some nautical nonsense? That's our specialty!",
  "This ship's got character! And several interesting quirks we're still discovering.",
  "Adventure awaits! Just as soon as we fix this minor flooding issue.",
  "The wind's in our sails! Though that might just be the air conditioning.",
  "Prepare to embark! Once we finish reading this 'Sailing for Dummies' book.",
  "Welcome to maritime excellence! Or our best approximation of it.",
  "Set sail for destiny! Or at least the nearest safe harbor.",
  "Behold the majesty! The slightly rusty, creaky majesty!",
  "Ready for some seafaring fun? We've got a very loose definition of 'fun'.",
  "Welcome aboard the flagship! Don't ask why it's the only ship.",
  "Prepare for nautical adventures! Life jackets are mandatory, trust me.",
  "The ocean calls! Though it might be calling for help.",
  "Join the crew of legends! We're still working on the legend part.",
  "Experience true sailing! Or whatever this qualifies as.",
  "Welcome to maritime history! We're making it up as we go.",
  "Prepare for ocean mastery! Disclaimer: results may vary.",
  "All aboard the adventure! Mind the suspicious creaking sounds.",
  "Ready to become a sailor? The bar is surprisingly low!",
  "Join the nautical elite! We're very generous with that term.",
  "Welcome to seafaring glory! Bring your own safety equipment.",
  "Prepare for maritime excellence! Or at least maritime adequacy.",
  "Set sail for greatness! Or whatever's within rowing distance.",
  "Experience the thrill! Of wondering if we'll make it back.",
  "Join our prestigious crew! We can't afford to be picky.",
  "Welcome to nautical adventure! No refunds, no complaints.",
  "Ready for the journey? Neither are we, but let's go anyway!",
  "Set sail for victory! Or at least minimal embarrassment.",
  "Join the finest crew! By process of elimination.",
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
  "Slacking off? Those assignments won't complete themselves, sailor!",
  "By Poseidon's beard, finish your weekly assignments or walk the plank!",
  "You call yourself a sailor with these incomplete assignments? Pathetic!",
  "The sea demands dedication - and so do your weekly assignments!",
  "No grog for you until these assignments are squared away!",
  "Your shipmates are carrying your dead weight. Complete those assignments!",
  "Even the ship's cat works harder than you. Finish your assignments!",
  "The Kraken fears nothing except your work ethic. Complete those tasks!",
  "Davy Jones himself would be disappointed in these incomplete assignments!",
  "Storm's brewing and so is my temper - get those assignments done!",
];

const weeklyAssignmentsCompletedQuips = [
  "Rest up, sailor. You've completed your assignments for the week. Check back next week for more!",
  "Ahoy! You're done with your assignments for the week. Check back next week for more!",
  "Good thing I didn't throw you to the sharks! Nice work completing your weekly assignments. Check back next week for more!",
  "Well shiver me timbers! All assignments complete for this week's voyage. Check back next week for more!",
  "You've earned your sea legs! Your weekly assignments are done and dusted. Check back next week for more!",
  "Splice the mainbrace! You've finished all your assignments this week. Check back next week for more!",
  "By Neptune's beard, you've completed your weekly assignments! Check back next week for more!",
  "The Captain approves - all assignments ship-shape for the week. Check back next week for more!",
  "Smooth sailing ahead - you've finished all your assignments this week. Check back next week for more!",
  "A job well done, matey! Weekly assignments complete and accounted for. Check back next week for more!",
  "Yo ho ho! You've conquered this week's challenges. Check back next week for more!",
  "Batten down the hatches - you're all done for the week! Check back next week for more!",
  "Clear skies and calm seas - weekly assignments complete! Check back next week for more!",
  "Anchors aweigh! You've finished your duties for the week. Check back next week for more!",
  "Blimey! You've mastered this week's tasks. Check back next week for more!",
  "Full steam ahead - all assignments completed! Check back next week for more!",
  "Three cheers for the sailor who finished their tasks! Check back next week for more!",
  "You've navigated these challenges like a pro! Check back next week for more!",
  "The crew's impressed with your work this week! Check back next week for more!",
  "Mission accomplished, you salty sea dog! Check back next week for more!",
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
      const overviewDescription =
        overviewQuips[(overviewQuips.length * Math.random()) | 0];
      const overviewEmbed = new EmbedBuilder()
        .setColor(response.currentRankTier >= 10 ? 0x2ecc71 : 0x006994)
        .setTitle("Era 3 Boat Challenge")
        .setDescription(
          response.currentRankTier >= 10
            ? `*\"Who's the <@&${HALOFUNTIME_ID_ROLE_E3_BOAT_CAPTAIN}> now? You are!\"*`
            : `*\"${overviewDescription}\"*`
        )
        .setFooter({
          text: "HaloFunTime Boat Challenge",
          iconURL: "https://api.halofuntime.com/static/HFTLogo.png",
        })
        .setTimestamp();
      embeds.push(overviewEmbed);
      // Add an assignments progress embed if incomplete assignments exist and the user isn't already at rank 10
      if (response.currentRankTier < 10 && !response.assignmentsCompleted) {
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
            `Weekly Boat Assignment${
              response.existingAssignments ? " Progress" : "s"
            }`
          )
          .setDescription(
            `<@${response.discordUserId}>'s Rank: **${response.currentRank}**\n\n*\"${progressDescription}\"*`
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
            `*\"Great work! You've been promoted to **${response.currentRank}**!\"*`
          );
        embeds.push(justPromotedEmbed);
      } else {
        let completedDescription =
          weeklyAssignmentsCompletedQuips[
            (weeklyAssignmentsCompletedQuips.length * Math.random()) | 0
          ];
        const completedEmbed = new EmbedBuilder()
          .setColor(0xffd700)
          .setTitle("Weekly Boat Assignments Completed!")
          .setDescription(
            `<@${response.discordUserId}>'s Rank: **${response.currentRank}**\n\n*\"${completedDescription}\"*`
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
