const axios = require("axios");
const http = require("node:http");
const https = require("node:https");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_CHANNEL_SPOTLIGHT,
  HALOFUNTIME_ID_CHANNEL_PATHFINDERS_VC_1,
  HALOFUNTIME_ID_ROLE_PATHFINDER,
  HALOFUNTIME_ID_ROLE_PATHFINDER_DYNAMO_S3,
  HALOFUNTIME_ID_ROLE_PATHFINDER_DYNAMO_S4,
  HALOFUNTIME_ID_ROLE_PATHFINDER_ILLUMINATED,
  HALOFUNTIME_ID,
} = require("../constants.js");
const scheduledEvents = require("../utils/scheduledEvents");
const { getCurrentSeason, SEASON_03, SEASON_04 } = require("../utils/seasons");
const { getDateTimeForPathfinderEventStart } = require("../utils/pathfinders");

dayjs.extend(utc);
dayjs.extend(timezone);

const ROLE_ID_BY_NAME_AND_SEASON = {
  [SEASON_03]: {
    illuminated: HALOFUNTIME_ID_ROLE_PATHFINDER_ILLUMINATED,
    dynamo: HALOFUNTIME_ID_ROLE_PATHFINDER_DYNAMO_S3,
  },
  [SEASON_04]: {
    illuminated: HALOFUNTIME_ID_ROLE_PATHFINDER_ILLUMINATED,
    dynamo: HALOFUNTIME_ID_ROLE_PATHFINDER_DYNAMO_S4,
  },
};

const createPathfinderHikesEvent = async (client) => {
  const now = dayjs();
  const nextWednesday = now.day(3).add(1, "week");
  const eventStart = getDateTimeForPathfinderEventStart(nextWednesday);
  try {
    const message = await scheduledEvents.createVoiceEvent(
      client,
      HALOFUNTIME_ID,
      HALOFUNTIME_ID_CHANNEL_SPOTLIGHT,
      `<@&${HALOFUNTIME_ID_ROLE_PATHFINDER}>\n\n` +
        "Pathfinder Hikes - our weekly Forge map testing session - has been scheduled for next week.\n\n" +
        "Click the 'Interested' bell below to get notified when it starts. " +
        "Attending this event will earn you points toward the **Pathfinder Dynamo** role. " +
        "We'll do our best to play as many maps as we can, but maps whose owners are present for the playtest will have priority!",
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
      await message.react("🏕");
    }
  } catch (e) {
    console.error(e);
  }
};

const updatePathfinderRoles = async (client) => {
  console.log("Checking Pathfinder roles...");
  // Validate that there are roles to assign for the current Season
  const season = getCurrentSeason();
  const seasonTitles = ROLE_ID_BY_NAME_AND_SEASON[season];
  if (!seasonTitles) {
    console.log(`Early exiting - no Pathfinder entry for ${season}.`);
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
  const allMembersWithPathfinderRole = Array.from(
    allMembersMap.values()
  ).filter(
    (m) => !m.user.bot && m.roles.cache.has(HALOFUNTIME_ID_ROLE_PATHFINDER)
  );
  // Horrible kludge to prevent Axios socket hang up: https://stackoverflow.com/a/43439886
  delete process.env["http_proxy"];
  delete process.env["HTTP_PROXY"];
  delete process.env["https_proxy"];
  delete process.env["HTTPS_PROXY"];
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const pathfinderRoleEarners = {
    illuminated: [],
    dynamo: [],
  };
  for (const m of allMembersWithPathfinderRole) {
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/pathfinder/seasonal-role-check`,
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
      console.error("Ran into an error checking Pathfinder seasonal roles.");
    } else {
      if (response.illuminated === true) {
        pathfinderRoleEarners["illuminated"].push(response.discordUserId);
      }
      if (response.dynamo === true) {
        pathfinderRoleEarners["dynamo"].push(response.discordUserId);
      }
    }
  }
  const pathfinderAnnouncementChannel = client.channels.cache.get(
    HALOFUNTIME_ID_CHANNEL_SPOTLIGHT
  );
  await pathfinderAnnouncementChannel.send(
    `<@&${HALOFUNTIME_ID_ROLE_PATHFINDER}>\n\nIt's promotion time! Let's see if any Pathfinders have earned special recognition this week...`
  );
  let promotedPathfinderCount = 0;
  for (let title of ["illuminated", "dynamo"]) {
    // Validate that an "illuminated" or a "dynamo" role are defined for this Season
    const roleId = seasonTitles[title];
    if (!roleId) {
      console.log(`Skipping ${title} - no entry defined.`);
      continue;
    }
    // Add and remove the role as needed
    const pathfinderIdsEarnedRole = pathfinderRoleEarners[title];
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
    for (let m of pathfindersToAddRole) {
      const pathfinder = await m.roles.add(roleId);
      console.log(
        `Added PATHFINDER ${title.toUpperCase()} role to ${
          pathfinder.user.username
        }#${pathfinder.user.discriminator}`
      );
      const pathfinderPromotionMessage =
        await pathfinderAnnouncementChannel.send({
          content: `<@${pathfinder.user.id}> has earned the <@&${roleId}> role!`,
          allowedMentions: { users: [pathfinder.user.id] },
        });
      await pathfinderPromotionMessage.react("🎉");
    }
    for (let m of pathfindersToRemoveRole) {
      const pathfinder = await m.roles.remove(roleId);
      console.log(
        `Removed PATHFINDER ${title.toUpperCase()} role from ${
          pathfinder.user.username
        }#${pathfinder.user.discriminator}`
      );
    }
    promotedPathfinderCount += pathfindersToAddRole.length;
  }
  const promotionCommandsText =
    " We'll check again this time next week.\n\n" +
    "Remember - to be considered for a promotion, you must link your Xbox Live gamertag with the `/link-gamertag` command. " +
    "Check your progress toward this season's **Pathfinder Dynamo** role at any time with the `/pathfinder-dynamo-progress` command.";
  if (promotedPathfinderCount > 0) {
    await pathfinderAnnouncementChannel.send(
      "That wraps it up for this week's promotions. Congratulations!" +
        promotionCommandsText
    );
  } else {
    await pathfinderAnnouncementChannel.send(
      "Looks like no one new earned a promotion this week." +
        promotionCommandsText
    );
  }
  console.log("Finished checking Pathfinder roles.");
};

module.exports = {
  createPathfinderHikesEvent: createPathfinderHikesEvent,
  updatePathfinderRoles: updatePathfinderRoles,
};
