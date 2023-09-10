const axios = require("axios");
const http = require("node:http");
const https = require("node:https");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { EmbedBuilder } = require("discord.js");
const {
  HALO_INFINITE_RANKED_ARENA_PLAYLIST_ID,
  HALOFUNTIME_ID_CHANNEL_TRAILBLAZER_ANNOUNCEMENTS,
  HALOFUNTIME_ID_CHANNEL_TRAILBLAZERS_VC_1,
  HALOFUNTIME_ID_CHANNEL_TRAILBLAZERS,
  HALOFUNTIME_ID_ROLE_TRAILBLAZER,
  HALOFUNTIME_ID_ROLE_TRAILBLAZER_SCOUT_S3,
  HALOFUNTIME_ID_ROLE_TRAILBLAZER_SCOUT_S4,
  HALOFUNTIME_ID_ROLE_TRAILBLAZER_SHERPA,
  HALOFUNTIME_ID,
} = require("../constants.js");
const scheduledEvents = require("../utils/scheduledEvents");
const { getCurrentSeason, SEASON_03, SEASON_04 } = require("../utils/seasons");

dayjs.extend(utc);
dayjs.extend(timezone);

const ROLE_ID_BY_NAME_AND_SEASON = {
  [SEASON_03]: {
    sherpa: HALOFUNTIME_ID_ROLE_TRAILBLAZER_SHERPA,
    scout: HALOFUNTIME_ID_ROLE_TRAILBLAZER_SCOUT_S3,
  },
  [SEASON_04]: {
    sherpa: HALOFUNTIME_ID_ROLE_TRAILBLAZER_SHERPA,
    scout: HALOFUNTIME_ID_ROLE_TRAILBLAZER_SCOUT_S4,
  },
};

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
    }
  } catch (e) {
    console.error(e);
  }
};

const trailblazerDailyPassionReport = async (client) => {
  console.log("Running daily passion report...");
  const now = dayjs();
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);
  const allMembersMap = await guild.members.fetch({
    cache: true,
    withUserCount: true,
  });
  const allMembers = Array.from(allMembersMap.values()).filter(
    (m) => !m.user.bot
  );
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
    const players = [...response.players];
    players.sort((a, b) => (a.currentCSR < b.currentCSR ? 1 : -1));
    const passionFields = [];
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
      let playerSubTier;
      if (playerTier !== "Onyx") {
        const tierMin = tiers[playerTier][1];
        playerSubTier = Math.floor((player.currentCSR - tierMin) / 50) + 1;
      }
      let playerFullTier = playerTier;
      if (playerSubTier) {
        playerFullTier += ` ${playerSubTier}`;
      }
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
    let [
      onyxFields,
      diamondFields,
      platinumFields,
      goldFields,
      silverFields,
      bronzeFields,
    ] = Array.from({ length: 6 }, () => []);
    for (const [fullTier, csrSet] of Object.entries(representedCSRsByTier)) {
      const tier = fullTier.split(" ")[0];
      let fields;
      if (tier === "Onyx") {
        fields = onyxFields;
      } else if (tier === "Diamond") {
        fields = diamondFields;
      } else if (tier === "Platinum") {
        fields = platinumFields;
      } else if (tier === "Gold") {
        fields = goldFields;
      } else if (tier === "Silver") {
        fields = silverFields;
      } else if (tier === "Bronze") {
        fields = bronzeFields;
      }
      const csrStrings = [];
      for (const csr of csrSet) {
        const csrPlayerIdStrings = playersByCSR[csr].map(
          (csrPlayer) => `<@${csrPlayer.discordUserId}>`
        );
        csrStrings.push(`> \`${csr}\` ${csrPlayerIdStrings.join(" ")}`);
      }
      fields.push({
        name: `${emojiStrings[tier]} ${fullTier}`,
        value: csrStrings.join("\n"),
      });
    }
    const passionEmbeds = [];
    if (onyxFields.length > 0) {
      passionEmbeds.push(
        new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle("__Onyx Passion__")
          .addFields(onyxFields)
      );
    }
    if (diamondFields.length > 0) {
      passionEmbeds.push(
        new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle("__Diamond Passion__")
          .addFields(diamondFields)
      );
    }
    if (platinumFields.length > 0) {
      passionEmbeds.push(
        new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle("__Platinum Passion__")
          .addFields(platinumFields)
      );
    }
    if (goldFields.length > 0) {
      passionEmbeds.push(
        new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle("__Gold Passion__")
          .addFields(goldFields)
      );
    }
    if (silverFields.length > 0) {
      passionEmbeds.push(
        new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle("__Silver Passion__")
          .addFields(silverFields)
      );
    }
    if (bronzeFields.length > 0) {
      passionEmbeds.push(
        new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle("__Bronze Passion__")
          .addFields(bronzeFields)
      );
    }
    const trailblazersChannel = client.channels.cache.get(
      HALOFUNTIME_ID_CHANNEL_TRAILBLAZERS
    );
    const passionReportEmbed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`__Daily Passion Report: <t:${now.unix()}:D>__`)
      .setDescription(
        "Every day we check each Trailblazer's passion in the Ranked Arena playlist. Link your gamertag with `/link-gamertag` to be included."
      )
      .setFooter({
        text: "Passion. It's what's for breakfast.",
        iconURL: "https://api.halofuntime.com/static/TrailblazerLogo.png",
      });
    const passionReportMessage = await trailblazersChannel.send({
      allowedMentions: { parse: [] },
      embeds: [passionReportEmbed],
    });
    const thread = await passionReportMessage.startThread({
      name: now.format("MMMM D, YYYY"),
      autoArchiveDuration: 60,
      reason: "Passion.",
    });
    await thread.send({
      content: "Discuss today's passion levels in this thread.",
    });
    for (const embed of passionEmbeds) {
      await trailblazersChannel.send({
        allowedMentions: { parse: [] },
        embeds: [embed],
      });
    }
  }
  console.log("Finished daily passion report.");
};

const updateTrailblazerRoles = async (client) => {
  console.log("Checking Trailblazer roles...");
  // Validate that there are roles to assign for the current Season
  const season = getCurrentSeason();
  const seasonTitles = ROLE_ID_BY_NAME_AND_SEASON[season];
  if (!seasonTitles) {
    console.log(`Early exiting - no Trailblazer entry for ${season}.`);
    return;
  }
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);
  const allMembersMap = await guild.members.fetch({
    cache: true,
    withUserCount: true,
  });
  const allMembers = Array.from(allMembersMap.values()).filter(
    (m) => !m.user.bot
  );
  const allMembersWithTrailblazerRole = Array.from(
    allMembersMap.values()
  ).filter(
    (m) => !m.user.bot && m.roles.cache.has(HALOFUNTIME_ID_ROLE_TRAILBLAZER)
  );
  // Horrible kludge to prevent Axios socket hang up: https://stackoverflow.com/a/43439886
  delete process.env["http_proxy"];
  delete process.env["HTTP_PROXY"];
  delete process.env["https_proxy"];
  delete process.env["HTTPS_PROXY"];
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const trailblazerRoleEarners = {
    sherpa: [],
    scout: [],
  };
  for (const m of allMembersWithTrailblazerRole) {
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/trailblazer/seasonal-role-check`,
        {
          discordUserId: m.user.id,
          discordUsername: m.user.username,
        },
        {
          headers: {
            Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
          },
          httpAgent: new http.Agent({ keepAlive: true }),
          httpsAgent: new https.Agent({ keepAlive: true }),
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
    if (!response || (response && "error" in response)) {
      console.error("Ran into an error checking Trailblazer seasonal roles.");
    } else {
      if (response.sherpa === true) {
        trailblazerRoleEarners["sherpa"].push(response.discordUserId);
      }
      if (response.scout === true) {
        trailblazerRoleEarners["scout"].push(response.discordUserId);
      }
    }
  }
  const trailblazerAnnouncementChannel = client.channels.cache.get(
    HALOFUNTIME_ID_CHANNEL_TRAILBLAZER_ANNOUNCEMENTS
  );
  await trailblazerAnnouncementChannel.send(
    `<@&${HALOFUNTIME_ID_ROLE_TRAILBLAZER}>\n\nIt's promotion time! Let's see if any Trailblazers have earned special recognition this week...`
  );
  let promotedTrailblazerCount = 0;
  for (let title of ["sherpa", "scout"]) {
    // Validate that a "sherpa" or a "scout" role are defined for this Season
    const roleId = seasonTitles[title];
    if (!roleId) {
      console.log(`Skipping ${title} - no entry defined.`);
      continue;
    }
    // Add and remove the role as needed
    const trailblazerIdsEarnedRole = trailblazerRoleEarners[title];
    const trailblazersToRemoveRole = allMembers.filter(
      (m) =>
        m.roles.cache.has(roleId) &&
        !trailblazerIdsEarnedRole.includes(m.user.id)
    );
    const trailblazersToAddRole = allMembers.filter(
      (m) =>
        m.roles.cache.has(HALOFUNTIME_ID_ROLE_TRAILBLAZER) &&
        !m.roles.cache.has(roleId) &&
        trailblazerIdsEarnedRole.includes(m.user.id)
    );
    for (let m of trailblazersToAddRole) {
      const trailblazer = await m.roles.add(roleId);
      console.log(
        `Added TRAILBLAZER ${title.toUpperCase()} role to ${
          trailblazer.user.username
        }#${trailblazer.user.discriminator}`
      );
      const trailblazerPromotionMessage =
        await trailblazerAnnouncementChannel.send({
          content: `<@${trailblazer.user.id}> has earned the <@&${roleId}> role!`,
          allowedMentions: { users: [trailblazer.user.id] },
        });
      await trailblazerPromotionMessage.react("🎉");
    }
    for (let m of trailblazersToRemoveRole) {
      const trailblazer = await m.roles.remove(roleId);
      console.log(
        `Removed TRAILBLAZER ${rank.toUpperCase()} role from ${
          trailblazer.user.username
        }#${trailblazer.user.discriminator}`
      );
    }
    promotedTrailblazerCount += trailblazersToAddRole.length;
  }
  const promotionCommandsText =
    " We'll check again this time next week.\n\n" +
    "Remember - to be considered for a promotion, you must link your Xbox Live gamertag with the `/link-gamertag` command. " +
    "Check your progress toward this season's **Trailblazer Scout** role at any time with the `/trailblazer-scout-progress` command.";
  if (promotedTrailblazerCount) {
    await trailblazerAnnouncementChannel.send(
      "That wraps it up for this week's promotions. Congratulations!" +
        promotionCommandsText
    );
  } else {
    await trailblazerAnnouncementChannel.send(
      "Looks like no one new earned a promotion this week." +
        promotionCommandsText
    );
  }
  console.log("Finished checking Trailblazer roles.");
};

module.exports = {
  createTrailblazerTuesdayEvent: createTrailblazerTuesdayEvent,
  trailblazerDailyPassionReport: trailblazerDailyPassionReport,
  updateTrailblazerRoles: updateTrailblazerRoles,
};
