const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_ROLE_S4_STAMP_CHAMP,
  HALOFUNTIME_ID_ROLE_STAFF,
  HALOFUNTIME_ID_CHANNEL_STAMP_CHALLENGE,
} = require("../constants.js");

dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check-stamps")
    .setDescription(
      "Check the stamps you've earned for the Season 4 Stamp Challenge!"
    ),
  async execute(interaction) {
    // TODO: Remove following interior code block from this Staff role gate
    if (!interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_STAFF)) {
      // Pre- and post-challenge handling
      const now = dayjs();
      const stampChallengeStart = dayjs.tz(
        "2023-06-27 11:00:00",
        "America/Denver"
      );
      const stampChallengeEnd = dayjs.tz(
        "2023-09-26 09:00:00",
        "America/Denver"
      );
      if (now < stampChallengeStart) {
        await interaction.reply({
          content: `The **Stamp Challenge** hasn't started yet, but keep this command in mind if you want to earn the <@&${HALOFUNTIME_ID_ROLE_S4_STAMP_CHAMP}> role!`,
          ephemeral: true,
        });
        return;
      } else if (now > stampChallengeEnd) {
        await interaction.reply({
          content: `The **Stamp Challenge** is over. It's too late to earn the <@&${HALOFUNTIME_ID_ROLE_S4_STAMP_CHAMP}> role.`,
          ephemeral: true,
        });
        return;
      }
    }
    // Command may only be executed in the Stamp Challenge channel
    if (interaction.channelId !== HALOFUNTIME_ID_CHANNEL_STAMP_CHALLENGE) {
      await interaction.reply({
        content: `You may only use this command in the <#${HALOFUNTIME_ID_CHANNEL_STAMP_CHALLENGE}> channel.`,
        ephemeral: true,
      });
      return;
    }
    await interaction.deferReply();
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/season-04/check-stamps`,
        {
          discordUserId: interaction.user.id,
          discordUserTag: interaction.user.tag,
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
        return { error: "Unhandled error." };
      });
    console.log(JSON.stringify(response));
    if ("error" in response) {
      await interaction.editReply({
        content: "I couldn't check your stamps. Sorry about that.",
        ephemeral: true,
      });
      return;
    }
    // Create the base progress embed
    const progressEmbed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("Fun Passport")
      .setThumbnail("https://api.halofuntime.com/static/HFTLogo.png");
    // Add the stamps that don't require a gamertag
    progressEmbed.addFields(
      {
        name: "💬 Chatterbox",
        value: `> *Level up your FunTimer rank by text chatting on HaloFunTime.*\n> **${
          response.scoreChatterbox
        }/5** FunTimer rankups ${response.scoreChatterbox >= 5 ? "✅" : "❌"}`,
      },
      {
        name: "🦠 Funtagious",
        value: `> *Recruit someone new to HaloFunTime via a non-expiring personal invite link.*\n> **${
          response.scoreFuntagious
        }/1** invitee${response.scoreFuntagious < 2 ? "" : "s"} ${
          response.scoreFuntagious >= 1 ? "✅" : "❌"
        }`,
      },
      {
        name: "➕ Repping It",
        value: `> *Give \`/plus-rep\` to server members.*\n> **${
          response.scoreReppingIt
        }/10** rep points given ${response.scoreReppingIt >= 10 ? "✅" : "❌"}`,
      },
      {
        name: "🏃 Fundurance",
        value: `> *Participate in Fun Time Friday voice chats for consecutive hours.*\n> **${
          response.scoreFundurance
        }/5** ${response.scoreFundurance >= 3 ? "✅" : "❌"}`,
      },
      {
        name: "🍻 Gang's All Here",
        value: `> *Be present in a 24-person Fun Time Friday voice channel.*\n> **${
          response.scoreGangsAllHere
        }/1** full VC${response.scoreGangsAllHere < 2 ? "" : "s"} joined ${
          response.scoreGangsAllHere >= 1 ? "✅" : "❌"
        }`,
      }
    );
    // Add the stamps that do require a gamertag
    if (response.linkedGamertag) {
      progressEmbed.addFields(
        {
          name: "🥞 Stacking Dubs",
          value: `> *Win games in social playlists.*\n> **${
            response.scoreStackingDubs
          }/200** wins ${response.scoreStackingDubs >= 200 ? "✅" : "❌"}`,
        },
        {
          name: "💀 License to Kill",
          value: `> *Get kills in social playlists.*\n> **${
            response.scoreLicenseToKill
          }/5000** kills ${response.scoreLicenseToKill >= 5000 ? "✅" : "❌"}`,
        },
        {
          name: "🎯 Aim for the Head",
          value: `> *Get headshot kills in social playlists.*\n> **${
            response.scoreAimForTheHead
          }/3000** headshot kills ${
            response.scoreAimForTheHead >= 3000 ? "✅" : "❌"
          }`,
        },
        {
          name: "💥 Power Trip",
          value: `> *Get power weapon kills in social playlists.*\n> **${
            response.scorePowerTrip
          }/1500** power weapon kills ${
            response.scorePowerTrip >= 1500 ? "✅" : "❌"
          }`,
        },
        {
          name: "🤖 Bot Bullying",
          value: `> *Earn Perfection medals in the Bot Bootcamp playlist.*\n> **${
            response.scoreRobotRoaster
          }/1** Bot Bootcamp Perfection${
            response.scoreBotBullying < 2 ? "" : "s"
          } ${response.scoreBotBullying >= 1 ? "✅" : "❌"}`,
        },
        {
          name: "💯 One Fundo",
          value: `> *Play custom games from start to finish.*\n> **${
            response.scoreOneFundo
          }/100** custom games played ${
            response.scoreOneFundo >= 100 ? "✅" : "❌"
          }`,
        },
        {
          name: "🥳 Glee Fiddy",
          value: `> *Spend time playing custom games.*\n> **${
            response.scoreGleeFiddy
          }/50** hours ${response.scoreGleeFiddy >= 50 ? "✅" : "❌"}`,
        },
        {
          name: "🗺 Well-Traveled",
          value: `> *Play custom games on unique, non-developer made maps.*\n> **${
            response.scoreWellTraveled
          }/50** maps ${response.scoreWellTraveled >= 50 ? "✅" : "❌"}`,
        },
        {
          name: "🕹 Mo' Modes Mo' Fun",
          value: `> *Play unique, non-developer made modes in custom games.*\n> **${
            response.scoreMoModesMoFun
          }/25** modes ${response.scoreMoModesMoFun >= 25 ? "✅" : "❌"}`,
        },
        {
          name: "🏠 Packed House",
          value: `> *Play custom games where at least 24 players are present simultaneously.*\n> **${
            response.scorePackedHouse
          }/10** full lobbies ${response.scorePackedHouse >= 10 ? "✅" : "❌"}`,
        },
        {
          name: "🖐 Finish in Five",
          value: `> *In any BTB game mode, win the game in five minutes or less.*\n> **${
            response.completedFinishInFive ? "COMPLETE ✅" : "INCOMPLETE ❌"
          }**`,
        },
        {
          name: "🏁 Victory Lap",
          value: `> *In any BTB CTF variant, take a flag from the enemy flag stand to your team's capture point but don't capture it - you must first take it all the way back to the enemy base's flag stand, and then finally back to your team's capture point for the score.*\n> **${
            response.completedVictoryLap ? "COMPLETE ✅" : "INCOMPLETE ❌"
          }**`,
        },
        {
          name: "🅰️ A-Team",
          value: `> *In any BTB Total Control variant, capture and do not lose zone A for the entire game. Do not capture zone B or zone C during regulation time. During overtime, capture zone B and zone C for the victory.*\n> **${
            response.completedATeam ? "COMPLETE ✅" : "INCOMPLETE ❌"
          }**`,
        },
        {
          name: "🧑‍🌾 Sneed's Seed Greed",
          value: `> *In any BTB Stockpile variant, take the initial Power Seeds to a defensible location on the map. Defend them for the entire game, ensuring that this stash still has more than half of the initial Power Seeds in it when the game reaches overtime. In overtime, capture enough Power Seeds to win.*\n> **${
            response.completedSneedsSeedGreed ? "COMPLETE ✅" : "INCOMPLETE ❌"
          }**`,
        },
        {
          name: "👺 Fuck That Guy",
          value: `> *In any BTB Slayer variant, only kill one single player on the enemy team all game (at least 10 times).*\n> **${
            response.completedFuckThatGuy ? "COMPLETE ✅" : "INCOMPLETE ❌"
          }**`,
        }
      );
    }
    // Add the gamertag link prompt field if no gamertag is linked
    else {
      progressEmbed.addFields({
        name: "🔗 Link your gamertag!",
        value:
          "> Link your Xbox Live Gamertag to HaloFunTime with the `/link-gamertag` command to unlock additional stamps tied to your in-game stats! Once your gamertag is verified by Staff, you'll see additional stamps in this section.",
      });
    }
    // Add the total field, footer, and timestamp
    progressEmbed
      .addFields({
        name: "Stamp Challenge Status",
        value: `> **${response.stampsCompleted}/16 stamps earned** ${
          response.stampsCompleted >= 16 ? "✅" : "❌"
        }`,
      })
      .setFooter({
        text: "HaloFunTime Stamp Challenge",
      })
      .setTimestamp();
    await interaction.editReply({
      embeds: [progressEmbed],
    });
  },
};
