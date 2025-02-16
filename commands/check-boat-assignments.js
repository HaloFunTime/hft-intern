const { EmbedBuilder, SlashCommandBuilder, Embed } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS,
  HALOFUNTIME_ID_CHANNEL_BOAT_CHALLENGE,
  HALOFUNTIME_ID_ROLE_E3_BOAT_CAPTAIN,
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
  "Welcome to the nautical life! Hope you like getting wet!",
  "Prepare to set sail! As soon as we find all the missing parts.",
  "Ready for the high seas? Our insurance company isn't!",
  "Join the adventure! Waivers must be signed in triplicate.",
  "Welcome aboard! The rats have their own VIP section.",
  "Set sail with us! Our standards are comfortably low.",
  "Experience the waves! And various concerning noises.",
  "Ready for command? We're desperate enough to consider it.",
  "Join our fleet! Currently consisting of this one boat.",
  "Prepare for glory! Or at least mild accomplishment.",
  "Welcome to seamanship! Terms and conditions apply.",
  "Set course for adventure! Our GPS is slightly outdated.",
  "Ready to sail? That makes one of us!",
  "Join the crew! We promise nothing but surprises.",
  "Prepare for the journey! Pack extra underwear.",
  "Welcome to the ship! Mind the mysterious puddles.",
  "Set sail with pride! And a healthy dose of concern.",
  "Experience the legend! We're working on the story.",
  "Ready for the voyage? Our standards are negotiable.",
  "Join the elite! We recently lowered our requirements.",
  "Prepare for greatness! Results not guaranteed.",
  "Welcome to the team! Bring your own tools.",
  "Set forth with courage! And maybe some duct tape.",
  "Ready for command? The bar is impressively low.",
  "Join our ranks! We're not picky at all.",
  "Prepare for adventure! And possible disappointment.",
  "Welcome aboard matey! No experience necessary or expected.",
  "Set sail for fame! Or at least mild recognition.",
  "Ready for the challenge? Neither is the boat!",
  "Join the crew today! While supplies last.",
  "Prepare for excitement! And frequent maintenance breaks.",
  "Welcome to the family! We're all a bit dysfunctional.",
  "Set course for destiny! Or wherever this thing drifts.",
  "Ready for action? The lifeboats are fully stocked!",
  "Join the revolution! In questionable seafaring.",
  "Prepare for greatness! Or adequate mediocrity.",
  "Welcome to the future! Of budget boating.",
  "Set sail with heroes! Or whoever shows up.",
  "Ready for command? Someone has to do it!",
  "Join the legends! We're very loose with definitions.",
  "Prepare for glory! Bring spare parts.",
  "Welcome to excellence! By very flexible standards.",
  "Set forth with honor! And emergency flares.",
  "Ready for the seas? The seas aren't ready for us!",
  "Join our mission! Whatever that ends up being.",
  "Prepare for history! The kind people laugh about later.",
  "Welcome to leadership! Previous failures accepted.",
  "Set sail for victory! Or the nearest port.",
  "Ready for duty! No questions asked (please).",
  "Join the adventure! Survival not guaranteed.",
  "Prepare for fame! Or entertaining stories.",
  "Welcome to seamanship! The unconventional kind.",
  "Set course for triumph! Or wherever we end up.",
  "Ready for the unknown! That's most of what we deal with.",
  "Join our voyage! What's the worst that could happen?",
  "Prepare for success! However you define it.",
  "Welcome aboard captain! Previous boat ownership optional.",
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
  "These assignments won't sail themselves to completion, landlubber!",
  "The mermaids are laughing at your incomplete assignments!",
  "You're making the ship's parrot look productive. Finish those tasks!",
  "Neptune's watching, and he's not impressed with your progress.",
  "The sea chest stays locked until these assignments are done!",
  "Even barnacles work harder than this. Complete your duties!",
  "Your performance is making the compass spin backwards. Get to work!",
  "The ship's wheel won't turn itself - finish these assignments!",
  "You're drifting off course with these incomplete tasks!",
  "The crew's quarters aren't for slackers. Complete your assignments!",
  "Your work ethic is making the fish swim away in shame!",
  "The lighthouse keeper can see your incomplete assignments from here!",
  "Those sea shanties won't sing themselves - get these tasks done!",
  "Even the driftwood is more motivated than you. Complete those assignments!",
  "The tide waits for no one, especially not incomplete assignments!",
  "Your progress is moving slower than a beached whale. Pick up the pace!",
  "The ship's bell tolls for your unfinished assignments!",
  "You're making seaweed look energetic. Finish these tasks!",
  "The crow's nest reported your lack of progress. Get moving!",
  "Your incomplete assignments are scaring away the good weather!",
  "The galley cook works harder than this. Complete your duties!",
  "Even the ship's figurehead is shaking its head at your progress!",
  "The stars won't align until these assignments are complete!",
  "Your work rate would make a seasick sailor look productive!",
  "The ship's log shows concerning gaps in your progress.",
  "These assignments won't complete themselves in Davy Jones' locker!",
  "Your effort level is lower than the ocean floor. Step it up!",
  "The rigging's tighter than your work schedule. Get busy!",
  "You're making the ship's rats look industrious. Complete those tasks!",
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
  "Yo ho ho! You've conquered this week's challenges.",
  "Batten down the hatches - you're all done for the week!",
  "Clear skies and calm seas - weekly assignments complete!",
  "Anchors aweigh! You've finished your duties for the week.",
  "Blimey! You've mastered this week's tasks.",
  "Full steam ahead - all assignments completed!",
  "Three cheers for the sailor who finished their tasks!",
  "You've navigated these challenges like a pro!",
  "The crew's impressed with your work this week!",
  "Mission accomplished, you salty sea dog!",
  "Avast ye! Your weekly duties are complete, you magnificent mariner!",
  "Raise the colors - you've triumphed over this week's trials!",
  "Even the mermaids are singing your praises for completing these tasks!",
  "You've charted these waters like a true navigator!",
  "The sea shanties tonight will be sung in your honor!",
  "Not even the Kraken could stop you from finishing these assignments!",
  "You're sailing smoother than a dolphin's back - all tasks complete!",
  "By the stars above, you've mastered this week's challenges!",
  "The lighthouse keeper sends their congratulations - all clear!",
  "You've got the wind in your sails now - weekly duties done!",
  "Even old salts would be proud of your accomplishments!",
  "Drop anchor and celebrate - you've conquered this week!",
  "From bow to stern, every task is shipshape and Bristol fashion!",
  "The seagulls are squawking about your success!",
  "You're sailing high on the tide of achievement!",
  "Hoist the flag of victory - assignments complete!",
  "The sea herself smiles upon your completed tasks!",
  "You've weathered this storm with flying colors!",
  "A treasure chest of accomplishments this week!",
  "The whole fleet's talking about your dedication!",
  "You've steered true and reached your destination!",
  "Ring the ship's bell - we've got a champion sailor here!",
  "Your compass pointed straight to success this week!",
  "The old sea dogs are wagging their tails at your achievement!",
  "You've sailed these waters like a seasoned captain!",
  "From crow's nest to keel, you've mastered every task!",
  "The maritime gods smile upon your completed duties!",
  "You've navigated these assignments like a master helmsman!",
  "Sound the foghorn - we've got a completion to celebrate!",
  "Even the barnacles are impressed with your work!",
];

const getNextTuesdayTimestamp = () => {
  // Get current time in Denver timezone
  const now = dayjs().tz("America/Denver");

  // Get the closest Tuesday at 11AM Denver time (could be in past or future)
  let tuesday = now.day(2).hour(11).minute(0).second(0).millisecond(0);

  // If the found Tuesday is in the past, get the next Tuesday
  if (now.isAfter(tuesday)) {
    tuesday = tuesday.add(7, "day");
  }

  return tuesday.unix();
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check-boat-assignments")
    .setDescription("Check your Era 3 Boat Challenge assignments."),
  async execute(interaction) {
    // Pre- and post-challenge handling
    const now = dayjs();
    const assignmentCheckingStart = ERA_DATA["era03"].startTime.add(7, "day");
    const assignmentCheckingEnd = ERA_DATA["era03"].endTime;
    if (now < assignmentCheckingStart) {
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
    if (interaction.channelId !== HALOFUNTIME_ID_CHANNEL_BOAT_CHALLENGE) {
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
        completedDescription += ` I'll have new assignments for you <t:${getNextTuesdayTimestamp()}:R>.`;
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
