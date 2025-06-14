const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { EmbedBuilder } = require("discord.js");
const {
  HALO_INFINITE_RANKED_ARENA_PLAYLIST_ID,
  HALOFUNTIME_ID_CHANNEL_TRAILBLAZER_ANNOUNCEMENTS,
  HALOFUNTIME_ID_CHANNEL_TRAILBLAZERS_VC_1,
  HALOFUNTIME_ID_CHANNEL_TRAILBLAZERS,
  HALOFUNTIME_ID_EMOJI_HEART_TRAILBLAZERS,
  HALOFUNTIME_ID_EMOJI_PASSION,
  HALOFUNTIME_ID_ROLE_TRAILBLAZER,
  HALOFUNTIME_ID_ROLE_TRAILBLAZER_TITAN,
  HALOFUNTIME_ID_THREAD_TRAILBLAZER_BOT_COMMANDS,
  HALOFUNTIME_ID,
} = require("../constants.js");
const scheduledEvents = require("../utils/scheduledEvents");
const { ERA_DATA } = require("../utils/eras");
const { getApplicationCommandMention } = require("../utils/formatting.js");

dayjs.extend(utc);
dayjs.extend(timezone);

const checkTitanRoles = async (client) => {
  console.log("Checking Trailblazer Titan role eligibility...");
  const now = dayjs();
  if (now < ERA_DATA["era01"].startTime.add(6, "hour")) {
    console.log("Early exiting - Eras have not yet begun.");
    return;
  }
  try {
    const guild = client.guilds.cache.get(HALOFUNTIME_ID);
    const allMembersMap = await guild.members.fetch({
      cache: true,
      withUserCount: true,
    });
    const allMembersWithTrailblazerRole = Array.from(
      allMembersMap.values()
    ).filter(
      (m) => !m.user.bot && m.roles.cache.has(HALOFUNTIME_ID_ROLE_TRAILBLAZER)
    );
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/trailblazer/titan-check`,
        {
          discordUserIds: allMembersWithTrailblazerRole.map((m) => m.user.id),
          playlistId: HALO_INFINITE_RANKED_ARENA_PLAYLIST_ID,
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
    if (!response || "error" in response) {
      console.error(
        "Ran into an error checking Trailblazer Titan role eligibility."
      );
    }
    // Get member objects for everyone who earned Titan
    const allMembers = Array.from(allMembersMap.values()).filter(
      (m) => !m.user.bot
    );
    const memberIdsEarnedTitan = response.yes.map((o) => o.discordUserId);
    const membersToRemoveTitan = allMembers.filter(
      (m) =>
        m.roles.cache.has(HALOFUNTIME_ID_ROLE_TRAILBLAZER_TITAN) &&
        !memberIdsEarnedTitan.includes(m.user.id)
    );
    const membersToAddTitan = allMembers.filter(
      (m) =>
        m.roles.cache.has(HALOFUNTIME_ID_ROLE_TRAILBLAZER) &&
        !m.roles.cache.has(HALOFUNTIME_ID_ROLE_TRAILBLAZER_TITAN) &&
        memberIdsEarnedTitan.includes(m.user.id)
    );
    // Assemble the promotion and demotion messages
    const promotionData = [];
    for (const m of membersToAddTitan) {
      const quipPayload = await axios
        .get(
          `${HALOFUNTIME_API_URL}/intern/random-trailblazer-titan-promotion-quip`,
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
      // Return a default quip if an error is present
      let quip = "";
      if (!quipPayload || "error" in quipPayload) {
        quip = "Well earned.";
      } else {
        quip = quipPayload.quip;
      }
      promotionData.push({
        message: `<@${m.user.id}> has earned the <@&${HALOFUNTIME_ID_ROLE_TRAILBLAZER_TITAN}> role! ${quip}`,
        member: m,
      });
    }
    const demotionData = [];
    for (const m of membersToRemoveTitan) {
      const quipPayload = await axios
        .get(
          `${HALOFUNTIME_API_URL}/intern/random-trailblazer-titan-demotion-quip`,
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
      // Return a default quip if an error is present
      let quip = "";
      if (!quipPayload || "error" in quipPayload) {
        quip = "See you later?";
      } else {
        quip = quipPayload.quip;
      }
      demotionData.push({
        message: `<@${m.user.id}> has lost the <@&${HALOFUNTIME_ID_ROLE_TRAILBLAZER_TITAN}> role. ${quip}`,
        member: m,
      });
    }
    // Apply the promotions/demotions and announce them in the Bot Commands thread
    const thread = client.channels.cache.get(
      HALOFUNTIME_ID_THREAD_TRAILBLAZER_BOT_COMMANDS
    );
    for (const promotion of promotionData) {
      await promotion.member.roles.add(HALOFUNTIME_ID_ROLE_TRAILBLAZER_TITAN);
      const message = await thread.send({
        content: promotion.message,
        allowedMentions: { users: [promotion.member.user.id] },
      });
      await message.react("🎉");
      await message.react(HALOFUNTIME_ID_EMOJI_HEART_TRAILBLAZERS);
      await message.react(HALOFUNTIME_ID_EMOJI_PASSION);
    }
    for (const demotion of demotionData) {
      await demotion.member.roles.remove(HALOFUNTIME_ID_ROLE_TRAILBLAZER_TITAN);
      await thread.send({
        content: demotion.message,
        allowedMentions: { users: [demotion.member.user.id] },
      });
    }
  } catch (error) {
    console.log(
      "Trailblazer Titan check errored out with the following error:"
    );
    console.error(error);
  }
  console.log("Finished checking Trailblazer Titan role eligibility.");
};

// NOTE: This has been turned off (no longer called by cron)
const createTrailblazerTuesdayEvent = async (client) => {
  const now = dayjs();
  const nextTuesday = now.day(2).add(1, "week");
  const eventStart = dayjs.tz(
    `${nextTuesday.format("YYYY-MM-DD")} 17:00:00`,
    "America/Denver"
  );
  try {
    const message = await scheduledEvents.createVoiceEvent(
      client,
      HALOFUNTIME_ID,
      HALOFUNTIME_ID_CHANNEL_TRAILBLAZER_ANNOUNCEMENTS,
      `<@&${HALOFUNTIME_ID_ROLE_TRAILBLAZER}>\n\n` +
        "Trailblazer Tuesday - our weekly practice and learning session - has been scheduled for next week.\n\n" +
        "Click the 'Interested' bell below to get notified when it starts. " +
        "Attending this event will earn you points toward the **Trailblazer Scout** role. " +
        "All skill levels are welcome as long as you have the desire to improve!",
      "Trailblazer Tuesday",
      HALOFUNTIME_ID_CHANNEL_TRAILBLAZERS_VC_1,
      eventStart.toISOString(),
      null,
      "Lesson TBD.",
      "https://i.imgur.com/HrEmKSC.jpg"
    );
    if (message) {
      await message.react("🌠");
      await message.react("📚");
      await message.react("🎥");
      await message.crosspost();
    }
  } catch (e) {
    console.error(e);
  }
};

const trailblazerWeeklyPassionReport = async (client) => {
  console.log("Running weekly passion report...");
  const now = dayjs();
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);
  const allMembersMap = await guild.members.fetch({
    cache: true,
    withUserCount: true,
  });
  const allMembersWithTrailblazerRole = Array.from(
    allMembersMap.values()
  ).filter(
    (m) => !m.user.bot && m.roles.cache.has(HALOFUNTIME_ID_ROLE_TRAILBLAZER)
  );
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const response = await axios
    .post(
      `${HALOFUNTIME_API_URL}/discord/csr-snapshot`,
      {
        discordUserIds: allMembersWithTrailblazerRole.map((m) => m.user.id),
        playlistId: HALO_INFINITE_RANKED_ARENA_PLAYLIST_ID,
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
      if (error.response?.data) {
        return error.response?.data;
      }
    });
  if ("error" in response) {
    return;
  } else {
    const quipPayload = await axios
      .get(`${HALOFUNTIME_API_URL}/intern/random-passion-report-quip`, {
        headers: {
          Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
        },
      })
      .then((response) => response.data)
      .catch(async (error) => {
        // Return the error payload directly if present
        if (error.response.data) {
          return error.response.data;
        }
        console.error(error);
      });
    // Return a default quip if an error is present
    let passionReportQuip = "";
    if ("error" in quipPayload) {
      passionReportQuip = "Passion. It's in fashion.";
    } else {
      passionReportQuip = quipPayload.quip;
    }
    const players = [...response.players];
    players.sort((a, b) => (a.currentCSR < b.currentCSR ? 1 : -1));
    const tiersList = [
      "Onyx",
      "Diamond",
      "Platinum",
      "Gold",
      "Silver",
      "Bronze",
    ];
    const tiers = {
      Onyx: [Infinity, 1500],
      Diamond: [1499, 1200],
      Platinum: [1199, 900],
      Gold: [899, 600],
      Silver: [599, 300],
      Bronze: [299, 0],
    };
    const emojiStrings = {
      Onyx: "<:rank_onyx:967450514923065384>",
      Diamond: "<:rank_diamond:967450514570739722>",
      Platinum: "<:rank_platinum:974064566004760627>",
      Gold: "<:rank_gold:967450514092609557>",
      Silver: "<:rank_silver:967450514419752960>",
      Bronze: "<:rank_bronze:967450514482675822>",
    };
    const representedCSRsByTier = {}; // key: Onyx, Diamond 6, etc.; value: Set of CSRs
    const playersByCSR = {}; // key: CSR integer; value: player object
    for (const player of players) {
      let playerTier;
      for (let i = 0; i < 6; i++) {
        const tierMax = tiers[tiersList[i]][0];
        const tierMin = tiers[tiersList[i]][1];
        if (player.currentCSR <= tierMax && player.currentCSR >= tierMin) {
          playerTier = tiersList[i];
          break;
        }
      }
      if (!playerTier) {
        // Skip unranked players
        continue;
      }
      const tierMin = tiers[playerTier][1];
      const playerSubTier = Math.floor((player.currentCSR - tierMin) / 50) + 1;
      const playerFullTier = `${playerTier} ${playerSubTier}`;
      if (playerFullTier in representedCSRsByTier) {
        representedCSRsByTier[playerFullTier].add(player.currentCSR);
      } else {
        representedCSRsByTier[playerFullTier] = new Set([player.currentCSR]);
      }
      if (player.currentCSR in playersByCSR) {
        playersByCSR[player.currentCSR].push(player);
      } else {
        playersByCSR[player.currentCSR] = [player];
      }
    }
    function getColorForTier(tier) {
      if (tier === "Onyx") {
        return 0x4f356b;
      } else if (tier === "Diamond") {
        return 0x81bbd5;
      } else if (tier === "Platinum") {
        return 0x8283c4;
      } else if (tier === "Gold") {
        return 0xe5d16f;
      } else if (tier === "Silver") {
        return 0xcccccc;
      } else if (tier === "Bronze") {
        return 0x825538;
      }
    }
    let [
      onyxEmbeds,
      diamondEmbeds,
      platinumEmbeds,
      goldEmbeds,
      silverEmbeds,
      bronzeEmbeds,
    ] = Array.from({ length: 6 }, () => []);
    for (const [fullTier, csrSet] of Object.entries(representedCSRsByTier)) {
      const tier = fullTier.split(" ")[0];
      let embeds;
      if (tier === "Onyx") {
        embeds = onyxEmbeds;
      } else if (tier === "Diamond") {
        embeds = diamondEmbeds;
      } else if (tier === "Platinum") {
        embeds = platinumEmbeds;
      } else if (tier === "Gold") {
        embeds = goldEmbeds;
      } else if (tier === "Silver") {
        embeds = silverEmbeds;
      } else if (tier === "Bronze") {
        embeds = bronzeEmbeds;
      }
      const csrStrings = [];
      for (const csr of csrSet) {
        const csrPlayerIdStrings = playersByCSR[csr].map(
          (csrPlayer) => `<@${csrPlayer.discordUserId}>`
        );
        csrStrings.push(`\`${csr}\` ${csrPlayerIdStrings.join(" ")}`);
      }
      if (csrStrings.length > 0) {
        embeds.push(
          new EmbedBuilder().setColor(getColorForTier(tier)).addFields({
            name: `${emojiStrings[tier]} ${fullTier}`,
            value: csrStrings.join("\n"),
          })
        );
      }
    }
    const trailblazersChannel = client.channels.cache.get(
      HALOFUNTIME_ID_CHANNEL_TRAILBLAZERS
    );
    const linkGamertagMention = await getApplicationCommandMention(
      "link-gamertag",
      client
    );
    const passionReportEmbed = new EmbedBuilder()
      .setColor(0xf93a2f)
      .setTitle(`__Weekly Passion Report: <t:${now.unix()}:D>__`)
      .setDescription(
        `Every week we check each Trailblazer's passion in the Ranked Arena playlist. Link your gamertag with ${linkGamertagMention} to be included.`
      )
      .setFooter({
        text: `"${passionReportQuip}"`,
        iconURL: "https://api.halofuntime.com/static/TrailblazerLogo.png",
      });
    const thread = await trailblazersChannel.threads.create({
      name: now.format("MMMM D, YYYY"),
      autoArchiveDuration: 60,
      reason: "Passion.",
    });
    await thread.send({
      allowedMentions: { parse: [] },
      embeds: [passionReportEmbed],
    });
    for (const embeds of [
      onyxEmbeds,
      diamondEmbeds,
      platinumEmbeds,
      goldEmbeds,
      silverEmbeds,
      bronzeEmbeds,
    ]) {
      if (embeds.length > 0) {
        await thread.send({
          allowedMentions: { parse: [] },
          embeds: embeds,
        });
      }
    }
  }
  console.log("Finished weekly passion report.");
};

module.exports = {
  checkTitanRoles: checkTitanRoles,
  createTrailblazerTuesdayEvent: createTrailblazerTuesdayEvent,
  trailblazerWeeklyPassionReport: trailblazerWeeklyPassionReport,
};
