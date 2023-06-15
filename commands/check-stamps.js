const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID,
  HALOFUNTIME_ID_ROLE_S4_STAMP_CHAMP,
  HALOFUNTIME_ID_ROLE_STAFF,
  HALOFUNTIME_ID_CHANNEL_STAMP_CHALLENGE,
  HALOFUNTIME_ID_ROLE_BOT_WRANGLER,
  HALOFUNTIME_ID_ROLE_SERVER_BOOSTER,
  HALOFUNTIME_ID_ROLE_TEAM_FOXTROT,
  HALOFUNTIME_ID_ROLE_TEAM_HOTEL,
  HALOFUNTIME_ID_ROLE_TEAM_TANGO,
  HALOFUNTIME_ID_ROLE_FIRST_100,
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
    await interaction.deferReply({
      allowedMentions: { users: [interaction.user.id] },
    });
    // Calculate data for the Discord challenges
    const funTimerRoles = (interaction.member?.roles?.cache || []).filter(
      (role) => /FunTimer/.test(role.name)
    );
    let funTimerRank = 0;
    funTimerRoles.forEach((role) => {
      funTimerRank = parseInt(role.name.split(" ")[1]);
    });
    const guild = interaction.client.guilds.cache.get(HALOFUNTIME_ID);
    const invites = await guild.invites.fetch({ cache: true, force: true });
    let inviteUses = 0;
    invites.forEach((invite) => {
      if (invite.maxAge === 0 && invite.inviterId === interaction.user.id) {
        inviteUses += invite.uses;
      }
    });
    let societiesJoined = 0;
    if (
      interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_SERVER_BOOSTER)
    ) {
      societiesJoined++;
    }
    if (interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_BOT_WRANGLER)) {
      societiesJoined++;
    }
    if (
      interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_TEAM_FOXTROT) ||
      interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_TEAM_HOTEL) ||
      interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_TEAM_TANGO)
    ) {
      societiesJoined++;
    }
    if (interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_FIRST_100)) {
      societiesJoined++;
    }
    if (funTimerRank >= 10) {
      societiesJoined++;
    }
    if (funTimerRank == 20) {
      societiesJoined++;
    }
    // Hit the HFT API for the remaining challenge completion info
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/season-04/check-stamps`,
        {
          discordUserId: interaction.user.id,
          discordUsername: interaction.user.username,
          funTimerRank: funTimerRank,
          inviteUses: inviteUses,
          societiesJoined: societiesJoined,
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
        content: "I couldn't check your stamps. Sorry about that.",
        ephemeral: true,
      });
      return;
    }
    const embedColor = response.stampsCompleted >= 16 ? 0x2ecc71 : 0xe74c3c;
    // Create the overall progress embed
    const overallProgressEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle("Season 4 Fun Time Passport")
      .setThumbnail("https://api.halofuntime.com/static/HFTLogo.png")
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
    // Add the Discord challenge stamps
    const discordChallengeEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle("__HaloFunTime Discord Challenges__")
      .setDescription("*Earned by using the HaloFunTime Discord server!*")
      .addFields(
        {
          name: "💬 Chatterbox",
          value: `> *Level up your FunTimer rank by text chatting on HaloFunTime.*\n> **${
            response.scoreChatterbox
          }/5** FunTimer rankups ${
            response.scoreChatterbox >= 5 ? "✅" : "❌"
          }`,
        },
        {
          name: "🦠 Funtagious",
          value: `> *Invite new members to HaloFunTime via a non-expiring personal invite link.*\n> **${
            response.scoreFuntagious
          }/1** invitee${response.scoreFuntagious < 2 ? "" : "s"} ${
            response.scoreFuntagious >= 1 ? "✅" : "❌"
          }`,
        },
        {
          name: "➕ Repping It",
          value: `> *Give \`/plus-rep\` to server members.*\n> **${
            response.scoreReppingIt
          }/10** rep points given ${
            response.scoreReppingIt >= 10 ? "✅" : "❌"
          }`,
        },
        {
          name: "🏃 Fundurance",
          value: `> *Stay connected to a single Fun Time Friday voice channel for consecutive hours.*\n> **${
            response.scoreFundurance
          }/3** consecutive hours ${
            response.scoreFundurance >= 3 ? "✅" : "❌"
          }`,
        },
        {
          name: "🤐 Secret Socialite",
          value: `> *Gain admission to secret Fun Time Societies.*\n> **${
            response.scoreSecretSocialite
          }/1** Fun Time Societ${
            response.scoreSecretSocialite < 2 ? "y" : "ies"
          } joined ${response.scoreSecretSocialite >= 1 ? "✅" : "❌"}`,
        }
      );
    // Construct the embeds that require a gamertag
    const otherEmbeds = [];
    if (response.linkedGamertag) {
      const matchmakingChallengeEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle("__Halo Infinite Matchmaking Challenges__")
        .setDescription(
          "*⚠️ Make sure you are sharing matchmaking data! ⚠️\nIn-game:* `Settings -> Accessibility -> Matchmade Games = Share`"
        )
        .addFields(
          {
            name: "🥞 Stacking Dubs",
            value: `> *Win games in matchmaking playlists.*\n> **${
              response.scoreStackingDubs
            }/200** wins ${response.scoreStackingDubs >= 200 ? "✅" : "❌"}`,
          },
          {
            name: "💀 License to Kill",
            value: `> *Get kills in matchmaking playlists.*\n> **${
              response.scoreLicenseToKill
            }/5000** kills ${
              response.scoreLicenseToKill >= 5000 ? "✅" : "❌"
            }`,
          },
          {
            name: "🎯 Aim for the Head",
            value: `> *Get headshot kills in matchmaking playlists.*\n> **${
              response.scoreAimForTheHead
            }/3000** headshot kills ${
              response.scoreAimForTheHead >= 3000 ? "✅" : "❌"
            }`,
          },
          {
            name: "💥 Power Trip",
            value: `> *Get power weapon kills in matchmaking playlists.*\n> **${
              response.scorePowerTrip
            }/1500** power weapon kills ${
              response.scorePowerTrip >= 1500 ? "✅" : "❌"
            }`,
          },
          {
            name: "🤖 Bot Bullying",
            value: `> *Earn Perfection medals in the Bot Bootcamp playlist.*\n> **${
              response.scoreBotBullying
            }/1** Bot Bootcamp Perfection${
              response.scoreBotBullying < 2 ? "" : "s"
            } ${response.scoreBotBullying >= 1 ? "✅" : "❌"}`,
          }
        );
      otherEmbeds.push(matchmakingChallengeEmbed);
      const customGameChallengeEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle("__Halo Infinite Custom Game Challenges__")
        .setDescription(
          "*⚠️ Make sure you are sharing custom game data! ⚠️\n In-game:* `Settings -> Accessibility -> Non-Matchmade Games = Share`"
        )
        .addFields(
          {
            name: "💯 One Fundo",
            value: `> *Play custom games to completion.*\n> **${
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
            name: "☣️ Epidemic",
            value: `> *Play custom Infection games to completion.*\n> **${
              response.scoreEpidemic
            }/50** custom Infection games played ${
              response.scoreEpidemic >= 50 ? "✅" : "❌"
            }`,
          }
        );
      otherEmbeds.push(customGameChallengeEmbed);
      const btbChallengeEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle("__HaloFunTime BTB Challenges__")
        .setDescription(
          "*Full-game video evidence is **required** for credit toward completion of these challenges if Staff is not present.*"
        )
        .addFields(
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
            name: "🅰️ Type A",
            value: `> *In any BTB Total Control variant, capture and do not lose zone A for the entire game. Do not capture zone B or zone C during regulation time. During overtime, capture zone B and zone C for the victory.*\n> **${
              response.completedTypeA ? "COMPLETE ✅" : "INCOMPLETE ❌"
            }**`,
          },
          {
            name: "🧑‍🌾 Formerly Chuck's",
            value: `> *In any BTB Stockpile variant, take the initial Power Seeds to a defensible location on the map. Defend them for the entire game, ensuring that this stash still has more than half of the initial Power Seeds in it when the game reaches overtime. In overtime, capture enough Power Seeds to win.*\n> **${
              response.completedFormerlyChucks ? "COMPLETE ✅" : "INCOMPLETE ❌"
            }**`,
          },
          {
            name: "👺 In Particular",
            value: `> *In any BTB Slayer variant, only kill one single player on the enemy team all game (at least 10 times).*\n> **${
              response.completedInParticular ? "COMPLETE ✅" : "INCOMPLETE ❌"
            }**`,
          }
        );
      otherEmbeds.push(btbChallengeEmbed);
    }
    // Add the gamertag link prompt field if no gamertag is linked
    else {
      const linkGamertagEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle("🔗 Link your gamertag!")
        .setDescription(
          "*Link your Xbox Live Gamertag to HaloFunTime with the `/link-gamertag` command to unlock additional stamps tied to your in-game stats! Once your gamertag is verified by Staff, you'll see additional stamps in this section.*"
        );
      otherEmbeds.push(linkGamertagEmbed);
    }
    await interaction.editReply({
      allowedMentions: { users: [interaction.user.id] },
      content: `<@${response.discordUserId}>, check the stamps on your Fun Time Passport below:`,
      embeds: [overallProgressEmbed, discordChallengeEmbed, ...otherEmbeds],
    });
    // TODO: Award the Stamp Champ role if the member has earned it and does not yet have it.
    //       Send a POST to the backend to record their role earn date.
    //       Finally, post a congratulations message to #announcements.
  },
};
