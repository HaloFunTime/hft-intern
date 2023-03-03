const axios = require("axios");
const {
  HALOFUNTIME_ID_CHANNEL_SPOTLIGHT,
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
          "That wraps it up for this week's promotions. Congratulations! We'll check again this time next week."
        );
      } else {
        await pathfinderAnnouncementChannel.send(
          "Looks like no one new earned a promotion this week. We'll check again this time next week."
        );
      }
    }
  }
  console.log("Finished checking Pathfinder roles.");
};

module.exports = {
  updatePathfinderRoles: updatePathfinderRoles,
};
