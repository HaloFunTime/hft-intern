const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS,
  HALOFUNTIME_ID_CHANNEL_DOMAIN_CHALLENGE,
  HALOFUNTIME_ID_ROLE_S5_DOMAIN_MASTER,
} = require("../constants.js");

dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check-domains")
    .setDescription(
      "Check your personal progress toward the Season 5 Domain Challenge."
    ),
  async execute(interaction) {
    // Pre- and post-challenge handling
    const now = dayjs();
    const domainCheckingStart = dayjs.tz(
      "2023-10-25 11:00:00",
      "America/Denver"
    );
    const domainCheckingEnd = dayjs.tz("2024-01-30 11:00:00", "America/Denver");
    if (now < domainCheckingStart) {
      await interaction.reply({
        content:
          "The teams are still forming. You can't check **Domain Challenge** progress yet.",
        ephemeral: true,
      });
      return;
    } else if (now > domainCheckingEnd) {
      await interaction.reply({
        content:
          "The **Domain Challenge** is over. It's passed on! This challenge is no more! It has ceased to be! It's expired and gone to meet its maker!",
        ephemeral: true,
      });
      return;
    }
    // Command may only be executed in the Domain Challenge channel
    if (interaction.channelId !== HALOFUNTIME_ID_CHANNEL_DOMAIN_CHALLENGE) {
      await interaction.reply({
        content: `You may only use this command in the <#${HALOFUNTIME_ID_CHANNEL_DOMAIN_CHALLENGE}> channel.`,
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
        `${HALOFUNTIME_API_URL}/season-05/check-domains`,
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
          "I couldn't check your Domain Challenge progress. Can you wait a bit and try again? I'm pretty busy here.",
        ephemeral: true,
      });
      return;
    }
    if (!response.joinedChallenge) {
      await interaction.editReply({
        content:
          "You can't check Domain Challenge progress until you've used the `/join-domain-challenge` command!",
        ephemeral: true,
      });
      return;
    }
    // Create the base progress embed
    let teamString = "... for no one 😢";
    let embedColor = 0x666666;
    if (response.assignedTeam === "FunTimeBot") {
      teamString = " for __Team FunTimeBot__";
      embedColor = 0xaf3034;
    } else if (response.assignedTeam === "HFT Intern") {
      teamString = " for __Team HFT Intern__";
      embedColor = 0x2f318d;
    }
    const progressEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle("Season 5 Domain Mastery Scorecard")
      .setDescription(`*<@${response.discordUserId}>'s Progress${teamString}*`)
      .addFields({
        name: "Domain Mastery",
        value: `> **${response.domainsMastered}/10 Domains mastered** ${
          response.domainsMastered >= 10 ? "✅" : ""
        }`,
      });
    // All domains require a gamertag for tracking
    if (response.linkedGamertag) {
      for (const domainScore of response.domainScores) {
        progressEmbed.addFields({
          name: domainScore.name,
          value: `> *${domainScore.description}*\n> **${
            domainScore.currentScore
          }/${domainScore.maxScore}** ${domainScore.isMastered ? "✅" : ""}`,
        });
      }
    }
    // Add the gamertag link prompt field if no gamertag is linked
    else {
      progressEmbed.addFields({
        name: "🔗 Link your gamertag!",
        value:
          "> Link your Xbox Live Gamertag to HaloFunTime with the `/link-gamertag` command to participate in the Domain Challenge! Once your gamertag is verified by Staff, you'll see Domain Challenge progress in this section.",
      });
    }
    // Add the footer and timestamp
    progressEmbed
      .setFooter({
        text: "HaloFunTime Domain Challenge",
        iconURL: "https://api.halofuntime.com/static/HFTLogo.png",
      })
      .setTimestamp();
    await interaction.editReply({
      allowedMentions: { users: [interaction.user.id] },
      embeds: [progressEmbed],
    });
    if (response.domainsMastered >= 10) {
      const response2 = await axios
        .post(
          `${HALOFUNTIME_API_URL}/season-05/save-master`,
          {
            discordUserId: response.discordUserId,
            discordUsername: interaction.user.username,
            domainsMastered: response.domainsMastered,
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
      if ("error" in response2) {
        console.error(response2["error"]);
        return;
      }
      if (response2.newMaster === true) {
        await interaction.member.roles.add(
          HALOFUNTIME_ID_ROLE_S5_DOMAIN_MASTER
        );
        const channel = interaction.client.channels.cache.get(
          HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS
        );
        await channel.send(
          `Congratulations to <@${response2.discordUserId}> for earning the <@&${HALOFUNTIME_ID_ROLE_S5_DOMAIN_MASTER}> role!`
        );
      }
    }
  },
};
