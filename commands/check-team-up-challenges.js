const { EmbedBuilder, SlashCommandBuilder, Embed } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS,
  HALOFUNTIME_ID_CHANNEL_TEAM_UP_CHALLENGE,
  HALOFUNTIME_ID_ROLE_E2_MVT,
} = require("../constants.js");
const { ERA_DATA } = require("../utils/eras.js");
const { getApplicationCommandMention } = require("../utils/formatting.js");

dayjs.extend(utc);
dayjs.extend(timezone);

async function checkGames(interaction) {
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  // Hit the HFT API with a game check request
  const gameResponse = await axios
    .post(
      `${HALOFUNTIME_API_URL}/era-02/check-player-games`,
      {
        discordUserId: interaction.user.id,
      },
      {
        headers: {
          Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
        },
      }
    )
    .then((response) => response.data);
}

async function checkChallenges(interaction) {
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  // Hit the HFT API with a progress check request
  const response = await axios
    .post(
      `${HALOFUNTIME_API_URL}/era-02/check-team-up-challenges`,
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
        "I couldn't check your Team Up Challenge progress. Give me a couple minutes and try again after that.",
      ephemeral: true,
    });
    return;
  }
  // Calculate the points
  const pointsArray = [0, 15, 20, 21, 22, 23, 24, 25];
  const pointsBaitTheFlags =
    pointsArray[Math.min(response.completionsBaitTheFlags, 7)];
  const pointsFortyFists =
    pointsArray[Math.min(response.completionsFortyFists, 7)];
  const pointsGrenadeParade =
    pointsArray[Math.min(response.completionsGrenadeParade, 7)];
  const pointsHundredHeads =
    pointsArray[Math.min(response.completionsHundredHeads, 7)];
  const pointsMarksOfShame =
    pointsArray[Math.min(response.completionsMarksOfShame, 7)];
  const pointsMostValuableDriver =
    pointsArray[Math.min(response.completionsMostValuableDriver, 7)];
  const pointsOwnTheZones =
    pointsArray[Math.min(response.completionsOwnTheZones, 7)];
  const pointsSpeedForSeeds =
    pointsArray[Math.min(response.completionsSpeedForSeeds, 7)];
  const pointsSpinClass =
    pointsArray[Math.min(response.completionsSpinClass, 7)];
  const pointsSummonADemon =
    pointsArray[Math.min(response.completionsSummonADemon, 7)];
  const totalPoints =
    pointsBaitTheFlags +
    pointsFortyFists +
    pointsGrenadeParade +
    pointsHundredHeads +
    pointsMarksOfShame +
    pointsMostValuableDriver +
    pointsOwnTheZones +
    pointsSpeedForSeeds +
    pointsSpinClass +
    pointsSummonADemon;
  // Create the base progress embed
  const progressEmbed = new EmbedBuilder()
    .setColor(totalPoints >= 100 ? 0x2ecc71 : 0xe74c3c)
    .setTitle("Era 2 Team Up Challenge")
    .setDescription(
      "*Challenges must be completed in matchmade Halo Infinite PvP games.\n" +
        "__**Your team must win the game for any challenges to count.**__\n" +
        "Each challenge may be completed 7 times. First completions are worth 15 points, second completions are worth 5 points, and the rest are worth 1 point.*"
    )
    .addFields({
      name: " ",
      value: `> Progress toward <@&${HALOFUNTIME_ID_ROLE_E2_MVT}> role: **${totalPoints}/100 points** ${
        totalPoints >= 100 ? "✅" : "❌"
      }`,
    });
  // All challenges require a gamertag for tracking
  if (response.linkedGamertag) {
    progressEmbed.addFields(
      {
        name: "😉👊 Forty Fists",
        value: `> *Get at least 40 melee kills as a team.*\n> **${pointsFortyFists}/25** points ${
          pointsFortyFists >= 25 ? "✅" : ""
        }`,
      },
      {
        name: "🍍🎊 Grenade Parade",
        value: `> *Get at least 25 grenade kills as a team.*\n> **${pointsGrenadeParade}/25** points ${
          pointsGrenadeParade >= 25 ? "✅" : ""
        }`,
      },
      {
        name: "💯💀 Hundred Heads",
        value: `> *Get at least 100 headshot kills as a team.*\n> **${pointsHundredHeads}/25** points ${
          pointsHundredHeads >= 25 ? "✅" : ""
        }`,
      },
      {
        name: "😹👉 Marks of Shame",
        value: `> *Get at least 30 callout assists as a team.*\n> **${pointsMarksOfShame}/25** points ${
          pointsMarksOfShame >= 25 ? "✅" : ""
        }`,
      },
      {
        name: "😵‍💫📚 Spin Class",
        value: `> *Earn at least 10 __"360"__ medals as a team.*\n> **${pointsSpinClass}/25** points ${
          pointsSpinClass >= 25 ? "✅" : ""
        }`,
      },
      {
        name: "🎖️🏎️ Most Valuable Driver",
        value: `> *Help someone on your team earn the __"Immortal Chauffeur"__ medal.*\n> **${pointsMostValuableDriver}/25** points ${
          pointsMostValuableDriver >= 25 ? "✅" : ""
        }`,
      },
      {
        name: "⚡️😈 Summon a Demon",
        value: `> *Help someone on your team earn the __"Demon"__ medal.*\n> **${pointsSummonADemon}/25** points ${
          pointsSummonADemon >= 25 ? "✅" : ""
        }`,
      },
      {
        name: "🚩🪤 Bait the Flags",
        value: `> *As a team, kill at least 10 enemies attempting to return their flag.*\n> **${pointsBaitTheFlags}/25** points ${
          pointsBaitTheFlags >= 25 ? "✅" : ""
        }`,
      },
      {
        name: "🛂⛔️ Own the Zones",
        value: `> *As a team, spend at least 25 minutes standing in zones.*\n> **${pointsOwnTheZones}/25** points ${
          pointsOwnTheZones >= 25 ? "✅" : ""
        }`,
      },
      {
        name: "💨🌱 Speed for Seeds",
        value: `> *As a team, spend at least 10 minutes transporting Power Seeds in vehicles.*\n> **${pointsSpeedForSeeds}/25** points ${
          pointsSpeedForSeeds >= 25 ? "✅" : ""
        }`,
      }
    );
  }
  // Add the gamertag link prompt field if no gamertag is linked
  else {
    const linkGamertagMention = await getApplicationCommandMention(
      "link-gamertag",
      interaction.client
    );
    progressEmbed.addFields({
      name: "🔗 Link your gamertag!",
      value: `> Link your Xbox Live Gamertag to HaloFunTime with the ${linkGamertagMention} command to participate in the Team Up Challenge! Once your gamertag is verified, you'll see your challenge progress in this section.`,
    });
  }
  // Add the total footer and timestamp
  progressEmbed
    .setFooter({
      text: "HaloFunTime Team Up Challenge",
      iconURL: "https://api.halofuntime.com/static/HFTLogo.png",
    })
    .setTimestamp();
  await interaction.editReply({
    allowedMentions: { users: [interaction.user.id] },
    embeds: [progressEmbed],
  });
  // Award role (if applicable)
  if (totalPoints >= 100) {
    const challengeCompleteResponse = await axios
      .post(
        `${HALOFUNTIME_API_URL}/era-02/save-mvt`,
        {
          discordUserId: response.discordUserId,
          discordUsername: interaction.user.username,
          mvtPoints: totalPoints,
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
    if (challengeCompleteResponse.newMVT === true) {
      await interaction.member.roles.add(HALOFUNTIME_ID_ROLE_E2_MVT);
      const channel = interaction.client.channels.cache.get(
        HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS
      );
      await channel.send(
        `Congratulations to <@${challengeCompleteResponse.discordUserId}> for completing the <#${HALOFUNTIME_ID_CHANNEL_TEAM_UP_CHALLENGE}> and earning the <@&${HALOFUNTIME_ID_ROLE_E2_MVT}> role!`
      );
    }
    if (challengeCompleteResponse.maxed === true) {
      const channel = interaction.client.channels.cache.get(
        HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS
      );
      await channel.send(
        `<@${challengeCompleteResponse.discordUserId}> maxed out their points for the <#${HALOFUNTIME_ID_CHANNEL_TEAM_UP_CHALLENGE}>!`
      );
    }
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check-team-up-challenges")
    .setDescription(
      "Check your personal progress toward the Era 2 Team Up Challenge."
    ),
  async execute(interaction) {
    // Pre- and post-challenge handling
    const now = dayjs();
    const teamUpCheckingStart = ERA_DATA["era02"].startTime.add(4, "hour");
    const teamUpCheckingEnd = ERA_DATA["era02"].endTime;
    if (now < teamUpCheckingStart) {
      await interaction.reply({
        content: `You can't check your Team Up Challenge progress until <t:${teamUpCheckingStart.unix()}:f>.`,
        ephemeral: true,
      });
      return;
    } else if (now > teamUpCheckingEnd) {
      await interaction.reply({
        content: "The **Team Up Challenge** is over.",
        ephemeral: true,
      });
      return;
    }
    // Command may only be executed in the Team Up Challenge channel
    if (interaction.channelId !== HALOFUNTIME_ID_CHANNEL_TEAM_UP_CHALLENGE) {
      await interaction.reply({
        content: `You may only use this command in the <#${HALOFUNTIME_ID_CHANNEL_TEAM_UP_CHALLENGE}> channel.`,
        ephemeral: true,
      });
      return;
    }
    await interaction.deferReply({
      allowedMentions: { users: [interaction.user.id] },
    });
    const gameCheckSuccessful = await checkGames(interaction)
      .then(() => true)
      .catch(() => false);
    if (gameCheckSuccessful) {
      await checkChallenges(interaction);
    } else {
      // Delay the challenge check by five seconds to allow for the request to potentially complete
      console.log(
        "Game check failed; waiting five seconds to check challenges."
      );
      setTimeout(await checkChallenges(interaction), 5000);
    }
  },
};
