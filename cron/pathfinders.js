const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { EmbedBuilder } = require("discord.js");
const {
  HALOFUNTIME_ID_CHANNEL_PATHFINDERS_VC_1,
  HALOFUNTIME_ID_CHANNEL_SPOTLIGHT,
  HALOFUNTIME_ID_CHANNEL_WAYWO,
  HALOFUNTIME_ID_EMOJI_HALOFUNTIME_DOT_COM,
  HALOFUNTIME_ID_EMOJI_HEART_PATHFINDERS,
  HALOFUNTIME_ID_ROLE_PATHFINDER_PRODIGY,
  HALOFUNTIME_ID_ROLE_PATHFINDER,
  HALOFUNTIME_ID_THREAD_PATHFINDER_BOT_COMMANDS,
  HALOFUNTIME_ID,
} = require("../constants.js");
const scheduledEvents = require("../utils/scheduledEvents");
const { ERA_DATA, getCurrentEra } = require("../utils/eras");
const { getDateTimeForPathfinderEventStart } = require("../utils/pathfinders");
const { getApplicationCommandMention } = require("../utils/formatting.js");

dayjs.extend(utc);
dayjs.extend(timezone);

const checkProdigyRoles = async (client) => {
  console.log("Checking Pathfinder Prodigy role eligibility...");
  const now = dayjs();
  if (now < ERA_DATA["era01"].startTime.add(6, "hour")) {
    console.log("Early exiting - Eras have not yet begun.");
    return;
  }
  try {
    const guild = client.guilds.cache.get(HALOFUNTIME_ID);
    const allMembersMap = guild.members.cache;
    const allMembersWithPathfinderRole = Array.from(
      allMembersMap.values()
    ).filter(
      (m) => !m.user.bot && m.roles.cache.has(HALOFUNTIME_ID_ROLE_PATHFINDER)
    );
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/pathfinder/prodigy-check`,
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
        console.error(error);
        // Return the error payload directly if present
        if (error?.response?.data) {
          return error.response.data;
        }
      });
    if (!response || "error" in response) {
      console.error(
        "Ran into an error checking Pathfinder Prodigy role eligibility."
      );
    }
    // Get member objects for everyone who earned Prodigy
    const allMembers = Array.from(allMembersMap.values()).filter(
      (m) => !m.user.bot
    );
    const memberIdsEarnedProdigy = response.yes.map((o) => o.discordUserId);
    const membersToRemoveProdigy = allMembers.filter(
      (m) =>
        m.roles.cache.has(HALOFUNTIME_ID_ROLE_PATHFINDER_PRODIGY) &&
        !memberIdsEarnedProdigy.includes(m.user.id)
    );
    const membersToAddProdigy = allMembers.filter(
      (m) =>
        m.roles.cache.has(HALOFUNTIME_ID_ROLE_PATHFINDER) &&
        !m.roles.cache.has(HALOFUNTIME_ID_ROLE_PATHFINDER_PRODIGY) &&
        memberIdsEarnedProdigy.includes(m.user.id)
    );
    // Assemble the promotion and demotion messages
    const promotionData = [];
    for (const m of membersToAddProdigy) {
      const quipPayload = await axios
        .get(
          `${HALOFUNTIME_API_URL}/intern/random-pathfinder-prodigy-promotion-quip`,
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
        message: `<@${m.user.id}> has earned the <@&${HALOFUNTIME_ID_ROLE_PATHFINDER_PRODIGY}> role! ${quip}`,
        member: m,
      });
    }
    const demotionData = [];
    for (const m of membersToRemoveProdigy) {
      const quipPayload = await axios
        .get(
          `${HALOFUNTIME_API_URL}/intern/random-pathfinder-prodigy-demotion-quip`,
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
        message: `<@${m.user.id}> has lost the <@&${HALOFUNTIME_ID_ROLE_PATHFINDER_PRODIGY}> role. ${quip}`,
        member: m,
      });
    }
    // Apply the promotions/demotions and announce them
    const thread = await client.channels.fetch(
      HALOFUNTIME_ID_THREAD_PATHFINDER_BOT_COMMANDS
    );
    for (const promotion of promotionData) {
      await promotion.member.roles.add(HALOFUNTIME_ID_ROLE_PATHFINDER_PRODIGY);
      const message = await thread.send({
        content: promotion.message,
        allowedMentions: { users: [promotion.member.user.id] },
      });
      await message.react("🎉");
      await message.react(HALOFUNTIME_ID_EMOJI_HEART_PATHFINDERS);
      await message.react("🫘");
    }
    for (const demotion of demotionData) {
      await demotion.member.roles.remove(
        HALOFUNTIME_ID_ROLE_PATHFINDER_PRODIGY
      );
      await thread.send({
        content: demotion.message,
        allowedMentions: { users: [demotion.member.user.id] },
      });
    }
  } catch (error) {
    console.log(
      "Pathfinder Prodigy check errored out with the following error:"
    );
    console.error(error);
  }
  console.log("Finished checking Pathfinder Prodigy role eligibility.");
};

const createPathfinderHikesEvent = async (client) => {
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);
  const allMembersMap = guild.members.cache;
  const allMembersWithPathfinderRole = Array.from(
    allMembersMap.values()
  ).filter(
    (m) => !m.user.bot && m.roles.cache.has(HALOFUNTIME_ID_ROLE_PATHFINDER)
  );
  // Determine Pathfinder Bean awards
  const discordUsersAwardedBeans = [];
  for (const m of allMembersWithPathfinderRole) {
    const funTimerRoles = (m.roles?.cache || []).filter((role) =>
      /FunTimer/.test(role.name)
    );
    let funTimerRank = 0;
    funTimerRoles.forEach((role) => {
      funTimerRank = parseInt(role.name.split(" ")[1]);
    });
    const era = getCurrentEra();
    const pathfinderRoleId = ERA_DATA[era].dynamoRole;
    const isDynamo = m.roles.cache.has(pathfinderRoleId);
    const beanAward = funTimerRank + (isDynamo ? 10 : 0);
    if (beanAward > 0) {
      discordUsersAwardedBeans.push({
        discordId: m.user.id,
        discordUsername: m.user.username,
        awardedBeans: beanAward,
      });
    }
  }
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  let skipRecap = false;
  const response = await axios
    .post(
      `${HALOFUNTIME_API_URL}/pathfinder/weekly-recap`,
      {
        discordUsersAwardedBeans: discordUsersAwardedBeans,
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
  if (!response || (response && "error" in response)) {
    console.error("Ran into an error retrieving the Pathfinder Weekly Recap.");
    skipRecap = true;
  }
  const now = dayjs();
  const nextWednesday = now.day(3).add(1, "week");
  const eventStart = getDateTimeForPathfinderEventStart(nextWednesday);
  let messageContent;
  const hikesBlurb =
    "Click the 'Interested' bell on the event below to be notified when it starts. Attending Pathfinder Hikes will earn you 🫘 **Pathfinder Beans** and points toward this era's **Pathfinder Dynamo** role.";
  if (skipRecap) {
    messageContent = `Pathfinder Hikes - our weekly Forge map testing session - has been scheduled for next week.\n\n${hikesBlurb}`;
  } else {
    const playersS = response.hikerCount !== 1;
    const postsS = response.waywoPostCount !== 1;
    const commentsS = response.waywoCommentCount !== 1;
    const submissionsS = response.hikeSubmissionCount !== 1;
    const overviewBlurb =
      "Weekly 🫘 **Pathfinder Bean** bonuses have been awarded and Pathfinder Hikes - our weekly Forge map testing session - has been scheduled for next week.";
    const recapBlurb = `This week, we had **${response.hikerCount} player${
      playersS ? "s" : ""
    }** participate in Pathfinder Hike games. Activity in the <#${HALOFUNTIME_ID_CHANNEL_WAYWO}> channel this week included **${
      response.waywoPostCount
    } new post${postsS ? "s" : ""}** and **${
      response.waywoCommentCount
    } total comment${commentsS ? "s" : ""}**, as well as **${
      response.hikeSubmissionCount
    } new submission${submissionsS ? "s" : ""}** to Pathfinder Hikes.`;
    messageContent = `${overviewBlurb}\n\n${recapBlurb}\n\n${hikesBlurb}`;
  }
  try {
    const hikesSubmitMention = await getApplicationCommandMention(
      "pathfinder-hikes-submit",
      client
    );
    const message = await scheduledEvents.createVoiceEvent(
      client,
      HALOFUNTIME_ID,
      HALOFUNTIME_ID_CHANNEL_SPOTLIGHT,
      `<@&${HALOFUNTIME_ID_ROLE_PATHFINDER}>\n\n${messageContent}`,
      "Pathfinder Hikes",
      HALOFUNTIME_ID_CHANNEL_PATHFINDERS_VC_1,
      eventStart.toISOString(),
      null,
      `Playtest Forge maps with the Pathfinders club! Submit a map using ${hikesSubmitMention} in your map's <#${HALOFUNTIME_ID_CHANNEL_WAYWO}> post.`,
      "https://i.imgur.com/qItmOhr.jpg"
    );
    if (message) {
      await message.react("🏞");
      await message.react("🥾");
      await message.react("🏕");
      await message.react("🫘");
      await message.react("🔥");
      await message.crosspost();
    }
  } catch (e) {
    console.error(e);
  }
};

const weeklyPopularFilesReport = async (client) => {
  console.log("Running weekly popular files report...");
  const now = dayjs();
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const response = await axios
    .get(`${HALOFUNTIME_API_URL}/pathfinder/popular-files`, {
      headers: {
        Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
      },
    })
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
    const embeds = [];
    let i = 0;
    for (const file of response.files) {
      i++;
      const contributorStrings = [];
      for (const contributorDiscordId of file.contributorDiscordIds) {
        contributorStrings.push(`<@${contributorDiscordId}>`);
      }
      const footerString = `Tags: ${file.tags.join(", ")}`;
      embeds.push(
        new EmbedBuilder()
          .setTitle(`#${i} - ${file.name}`)
          .setURL(file.waypointUrl)
          .setDescription(file.description)
          .setImage(file.thumbnailUrl)
          .setColor(0xbc8fce)
          .addFields(
            {
              name: "__File Stats__",
              value: `- ${file.playsRecent} recent play${
                file.playsRecent !== 1 ? "s" : ""
              }\n- ${file.playsAllTime} total play${
                file.playsAllTime !== 1 ? "s" : ""
              }\n- ${file.bookmarks} bookmarks\n`,
              inline: true,
            },
            {
              name: "__HaloFunTime Contributors__",
              value: contributorStrings.join(" ") ?? "N/A",
              inline: true,
            }
          )
          .setFooter({ text: footerString })
      );
    }
    const spotlightChannel = client.channels.cache.get(
      HALOFUNTIME_ID_CHANNEL_SPOTLIGHT
    );
    const linkGamertagMention = await getApplicationCommandMention(
      "link-gamertag",
      client
    );
    const message = await spotlightChannel.send({
      content:
        `# __Popular HaloFunTime Files: <t:${now.unix()}:D>__\n\n` +
        "Every week we spotlight the top 10 most popular HaloFunTime files, sorted by recent play count.\n\n" +
        "**Tag your published files in-game with 'halofuntime' to be included!**\n\n" +
        `Link your gamertag with ${linkGamertagMention} to show up as a tagged contributor.`,
      embeds: embeds,
    });
    await message.react(HALOFUNTIME_ID_EMOJI_HALOFUNTIME_DOT_COM);
    const thread = await message.startThread({
      name: `Spotlight: ${now.format("MMMM D, YYYY")}`,
      autoArchiveDuration: 60,
      reason: "Spotlight.",
    });
    await thread.send("Discuss this week's popular files here.");
    await message.crosspost();
  }
  console.log("Finished weekly popular files report.");
};

module.exports = {
  checkProdigyRoles: checkProdigyRoles,
  createPathfinderHikesEvent: createPathfinderHikesEvent,
  weeklyPopularFilesReport: weeklyPopularFilesReport,
};
