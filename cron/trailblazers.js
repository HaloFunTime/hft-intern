const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_CHANNEL_TRAILBLAZER_ANNOUNCEMENTS,
  HALOFUNTIME_ID_CHANNEL_TRAILBLAZERS_VC_1,
  HALOFUNTIME_ID_ROLE_TRAILBLAZER,
  HALOFUNTIME_ID_ROLE_S3_TRAILBLAZER_SCOUT,
  HALOFUNTIME_ID_ROLE_S3_TRAILBLAZER_SHERPA,
  HALOFUNTIME_ID,
} = require("../constants.js");
const scheduledEvents = require("../utils/scheduledEvents");
const { getCurrentSeason, SEASON_03 } = require("../utils/seasons");

dayjs.extend(utc);
dayjs.extend(timezone);

const ROLE_ID_BY_NAME_AND_SEASON = {
  [SEASON_03]: {
    sherpa: HALOFUNTIME_ID_ROLE_S3_TRAILBLAZER_SHERPA,
    scout: HALOFUNTIME_ID_ROLE_S3_TRAILBLAZER_SCOUT,
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
      `<@&${HALOFUNTIME_ID_ROLE_TRAILBLAZER}>\n\nTrailblazer Tuesday - our weekly practice and learning session - has been scheduled for next week.\n\nClick the \"Interested\" bell below to get notified when it starts. All skill levels are welcome as long as you have the desire to improve!`,
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

const updateTrailblazerRoles = async (client) => {
  console.log("Checking Trailblazer roles...");
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
      `${HALOFUNTIME_API_URL}/trailblazer/seasonal-role-check`,
      {
        discordUserIds: allMembersWithTrailblazerRole.map((m) => m.user.id),
      },
      {
        headers: {
          Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
        },
      }
    )
    .then((response) => response.data)
    .catch(async (error) => {
      // Return the error payload directly if present
      if (error.response.data) {
        return error.response.data;
      }
      console.error(error);
    });
  if ("error" in response) {
    console.error("Ran into an error checking Trailblazer seasonal roles.");
  } else {
    // Validate that there are roles to assign for the current Season
    const season = getCurrentSeason();
    const seasonTitles = ROLE_ID_BY_NAME_AND_SEASON[season];
    if (!seasonTitles) {
      console.log(`Early exiting - no Trailblazer entry for ${season}.`);
      return;
    }
    for (let title of ["sherpa", "scout"]) {
      // Validate that a "sherpa" or a "scout" role are defined for this Season
      const roleId = seasonTitles[title];
      if (!roleId) {
        console.log(`Skipping ${title} - no entry defined.`);
        continue;
      }
      // Add and remove the role as needed
      const trailblazerIdsEarnedRole = response[title];
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
      const trailblazerAnnouncementChannel = client.channels.cache.get(
        HALOFUNTIME_ID_CHANNEL_TRAILBLAZER_ANNOUNCEMENTS
      );
      await trailblazerAnnouncementChannel.send(
        `<@&${HALOFUNTIME_ID_ROLE_TRAILBLAZER}>\n\nIt's promotion time! Let's see if any Trailblazers have earned special recognition this week...`
      );
      for (let m of trailblazersToAddRole) {
        const trailblazer = await m.roles.add(roleId);
        console.log(
          `Added TRAILBLAZER ${title.toUpperCase()} role to ${
            trailblazer.user.username
          }#${trailblazer.user.discriminator}`
        );
        await trailblazerAnnouncementChannel.send({
          content: `<@${trailblazer.user.id}> has earned the <@&${roleId}> role!`,
          allowedMentions: { users: [trailblazer.user.id] },
        });
      }
      for (let m of trailblazersToRemoveRole) {
        const trailblazer = await m.roles.remove(roleId);
        console.log(
          `Removed TRAILBLAZER ${rank.toUpperCase()} role from ${
            trailblazer.user.username
          }#${trailblazer.user.discriminator}`
        );
      }
      if (trailblazersToAddRole.length > 0) {
        await trailblazerAnnouncementChannel.send(
          "That wraps it up for this week's promotions. Congratulations! We'll check again this time next week. Remember - to be considered for a promotion, you must link your Xbox Live gamertag with the `/link-gamertag` command!"
        );
      } else {
        await trailblazerAnnouncementChannel.send(
          "Looks like no one new earned a promotion this week. We'll check again this time next week. Remember - to be considered for a promotion, you must link your Xbox Live gamertag with the `/link-gamertag` command!"
        );
      }
    }
  }
  console.log("Finished checking Trailblazer roles.");
};

module.exports = {
  createTrailblazerTuesdayEvent: createTrailblazerTuesdayEvent,
  updateTrailblazerRoles: updateTrailblazerRoles,
};
