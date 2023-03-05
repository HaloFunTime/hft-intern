const axios = require("axios");
const {
  HALOFUNTIME_ID_CHANNEL_SPOTLIGHT,
  HALOFUNTIME_ID_CHANNEL_PATHFINDERS_VC_1,
  HALOFUNTIME_ID_ROLE_PATHFINDER,
  HALOFUNTIME_ID_ROLE_S3_PATHFINDER_DYNAMO,
  HALOFUNTIME_ID_ROLE_S3_PATHFINDER_ILLUMINATED,
  HALOFUNTIME_ID,
} = require("../constants.js");
const { getCurrentSeason, SEASON_03 } = require("../utils/seasons");

const ROLE_ID_BY_NAME_AND_SEASON = {
  [SEASON_03]: {
    illuminated: HALOFUNTIME_ID_ROLE_S3_PATHFINDER_ILLUMINATED,
    dynamo: HALOFUNTIME_ID_ROLE_S3_PATHFINDER_DYNAMO,
  },
};

const createPathfinderHikesEvent = async (client) => {
  const now = dayjs();
  const nextWednesday = now.day(3).add(1, "week");
  const eventStart = dayjs.tz(
    `${nextWednesday.format("YYYY-MM-DD")} 18:00:00`,
    "America/Denver"
  );
  try {
    const message = await scheduledEvents.createVoiceEvent(
      client,
      HALOFUNTIME_ID,
      HALOFUNTIME_ID_CHANNEL_SPOTLIGHT,
      `<@&${HALOFUNTIME_ID_ROLE_PATHFINDER}>\n\nPathfinder Hikes - our weekly Forge map testing session - has been scheduled for next week.\n\nClick the \"Interested\" bell below to get notified when it starts. We'll do our best to play as many maps as we can, but maps whose owners are present for the playtest will have priority!`,
      "Pathfinder Hikes",
      HALOFUNTIME_ID_CHANNEL_PATHFINDERS_VC_1,
      eventStart.toISOString(),
      null,
      "Playtest Forge maps with the Pathfinders club! Submit a map using the `/pathfinder-hikes-submit` command in your map's <#1039171549682470982> post.",
      "https://i.imgur.com/qItmOhr.jpg"
    );
    if (message) {
      await message.react("🏞");
      await message.react("🥾");
      await message.react("⛺️");
    }
  } catch (e) {
    console.error(e);
  }
};

const updatePathfinderRoles = async (client) => {
  console.log("Checking Pathfinder roles...");
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);
  const allMembersMap = await guild.members.fetch({
    cache: true,
    withUserCount: true,
  });
  const allMembers = Array.from(allMembersMap.values()).filter(
    (m) => !m.user.bot
  );
  const allMembersWithPathfinderRole = Array.from(
    allMembersMap.values()
  ).filter(
    (m) => !m.user.bot && m.roles.cache.has(HALOFUNTIME_ID_ROLE_PATHFINDER)
  );
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const response = await axios
    .post(
      `${HALOFUNTIME_API_URL}/pathfinders/seasonal-role-check`,
      {
        discordUserIds: allMembersWithPathfinderRole.map((m) => m.user.id),
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
    console.error("Ran into an error checking Pathfinder seasonal roles.");
  } else {
    // Validate that there are roles to assign for the current Season
    const season = getCurrentSeason();
    const seasonTitles = ROLE_ID_BY_NAME_AND_SEASON[season];
    if (!seasonTitles) {
      console.log(`Early exiting - no Pathfinder entry for ${season}.`);
      return;
    }
    for (let title of ["illuminated", "dynamo"]) {
      // Validate that an "illuminated" or a "dynamo" role are defined for this Season
      const roleId = seasonTitles[title];
      if (!roleId) {
        console.log(`Skipping ${title} - no entry defined.`);
        continue;
      }
      // Add and remove the role as needed
      const pathfinderIdsEarnedRole = response[title];
      const pathfindersToRemoveRole = allMembers.filter(
        (m) =>
          m.roles.cache.has(roleId) &&
          !pathfinderIdsEarnedRole.includes(m.user.id)
      );
      const pathfindersToAddRole = allMembers.filter(
        (m) =>
          m.roles.cache.has(HALOFUNTIME_ID_ROLE_PATHFINDER) &&
          !m.roles.cache.has(roleId) &&
          pathfinderIdsEarnedRole.includes(m.user.id)
      );
      const pathfinderAnnouncementChannel = client.channels.cache.get(
        HALOFUNTIME_ID_CHANNEL_SPOTLIGHT
      );
      await pathfinderAnnouncementChannel.send(
        `<@&${HALOFUNTIME_ID_ROLE_PATHFINDER}>\n\nIt's promotion time! Let's see if any Pathfinders have earned special recognition this week...`
      );
      for (let m of pathfindersToAddRole) {
        const pathfinder = await m.roles.add(roleId);
        console.log(
          `Added PATHFINDER ${title.toUpperCase()} role to ${
            pathfinder.user.username
          }#${pathfinder.user.discriminator}`
        );
        await pathfinderAnnouncementChannel.send({
          content: `<@${pathfinder.user.id}> has earned the <@&${roleId}> role!`,
          allowedMentions: { users: [pathfinder.user.id] },
        });
      }
      for (let m of pathfindersToRemoveRole) {
        const pathfinder = await m.roles.remove(roleId);
        console.log(
          `Removed PATHFINDER ${rank.toUpperCase()} role from ${
            pathfinder.user.username
          }#${pathfinder.user.discriminator}`
        );
      }
      if (pathfindersToAddRole.length > 0) {
        await pathfinderAnnouncementChannel.send(
          "That wraps it up for this week's promotions. Congratulations! We'll check again this time next week. Remember - to be considered for a promotion, you must link your Xbox Live gamertag with the `/link-gamertag` command!"
        );
      } else {
        await pathfinderAnnouncementChannel.send(
          "Looks like no one new earned a promotion this week. We'll check again this time next week. Remember - to be considered for a promotion, you must link your Xbox Live gamertag with the `/link-gamertag` command!"
        );
      }
    }
  }
  console.log("Finished checking Pathfinder roles.");
};

module.exports = {
  createPathfinderHikesEvent: createPathfinderHikesEvent,
  updatePathfinderRoles: updatePathfinderRoles,
};
