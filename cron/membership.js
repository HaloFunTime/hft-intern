const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const members = require("../utils/members");
const {
  HALOFUNTIME_ID_CHANNEL_LOGS,
  HALOFUNTIME_ID_CHANNEL_NEW_HERE,
  HALOFUNTIME_ID_ROLE_MEMBER,
  HALOFUNTIME_ID_ROLE_NEW_HERE,
  HALOFUNTIME_ID,
} = require("../constants.js");
dayjs.extend(utc);
dayjs.extend(timezone);

const kickLurkers = async (client) => {
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);
  const allMembersMap = await guild.members.fetch({
    cache: true,
    withUserCount: true,
  });
  const allMembers = Array.from(allMembersMap.values());
  const now = dayjs();
  const twoWeeksAgoUnix = now.subtract(2, "week").valueOf();
  // Kick people who do not have the "Member" role and have been part of the server for over two weeks
  const membersToKick = allMembers.filter(
    (m) =>
      !m.roles.cache.has(HALOFUNTIME_ID_ROLE_MEMBER) &&
      !m.user.bot &&
      parseInt(m.joinedTimestamp) < parseInt(twoWeeksAgoUnix)
  );
  const kickedMemberIds = [];
  for (m of membersToKick) {
    try {
      const kickedMemberId = await members.kickMember(
        client,
        guild.id,
        m.id,
        "Failing to accept the rules within two weeks of joining."
      );
      kickedMemberIds.push(kickedMemberId);
    } catch (e) {
      console.error(e);
    }
  }
  const channel = client.channels.cache.get(HALOFUNTIME_ID_CHANNEL_LOGS);
  if (kickedMemberIds.length > 0) {
    const kickIdsFormatted = kickedMemberIds.reduce(
      (acc, v) => acc + "<@" + v + "> ",
      ""
    );
    channel.send(
      `Kicked the following members for failing to accept the rules within two weeks of joining:\n${kickIdsFormatted.trim()}`
    );
  } else {
    channel.send("No members to kick for failing to accept the rules.");
  }
};

const postHelpfulHintToNewHereChannel = async (client) => {
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const hintPayload = await axios
    .get(`${HALOFUNTIME_API_URL}/intern/random-helpful-hint`, {
      headers: {
        Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
      },
    })
    .then((response) => response.data)
    .catch(async (error) => {
      console.error(error);
      // Return the error payload directly if present
      if (error.response.data) {
        return error.response.data;
      }
    });
  // Return without trying to send a hint if error data is present
  if ("error" in hintPayload) return;
  const channel = client.channels.cache.get(HALOFUNTIME_ID_CHANNEL_NEW_HERE);
  const message = await channel.send(hintPayload.hint);
  message.react("????");
};

const updateNewHereRoles = async (client) => {
  const now = dayjs();
  const oneMonthAgoUnix = now.subtract(1, "month").valueOf();
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);
  const allMembersMap = await guild.members.fetch({
    cache: true,
    withUserCount: true,
  });
  const allMembers = Array.from(allMembersMap.values()).filter(
    (m) => !m.user.bot
  );
  const membersToAddNewHere = allMembers.filter(
    (m) =>
      m.roles.cache.has(HALOFUNTIME_ID_ROLE_MEMBER) &&
      !m.roles.cache.has(HALOFUNTIME_ID_ROLE_NEW_HERE) &&
      parseInt(m.joinedTimestamp) >= parseInt(oneMonthAgoUnix)
  );
  const membersToRemoveNewHere = allMembers.filter(
    (m) =>
      m.roles.cache.has(HALOFUNTIME_ID_ROLE_NEW_HERE) &&
      parseInt(m.joinedTimestamp) < parseInt(oneMonthAgoUnix)
  );
  const channel = client.channels.cache.get(HALOFUNTIME_ID_CHANNEL_NEW_HERE);
  for (m of membersToAddNewHere) {
    const member = await m.roles.add(HALOFUNTIME_ID_ROLE_NEW_HERE);
    const message = await channel.send(
      `Welcome to the <#${HALOFUNTIME_ID_CHANNEL_NEW_HERE}> channel, <@${member.user.id}>!`
    );
    message.react("????");
  }
  for (m of membersToRemoveNewHere) {
    const member = await m.roles.remove(HALOFUNTIME_ID_ROLE_NEW_HERE);
    const quips = [
      "Begone, you!",
      "Another newbie becomes a normie - always brings a tear to my eye.",
      "Quick, talk trash now that they can't see it!",
      "I FEEL THE POWER COURSING THROUGH MY VEINS!",
      "Time marches forever onward...",
      "They grow up so fast...",
      "Has it already been a whole month?",
      "Wait, I forgot to give them their gift! Please don't tell them...",
      "This is my favorite part of the job.",
      "Fly, you beautiful butterfly, fly!",
      "Growing old is mandatory. So is fun. Don't forget that.",
      "Bye!",
      "Mission accomplished.",
      "A job well done.",
      "Hopefully they don't forget us...",
      "No further comment.",
      "Yeeting people never gets old.",
      "Spartans never die, they're just missing in action.",
      "Everyone's time comes eventually.",
      "Pour one out, gang.",
    ];
    const quip = quips[(quips.length * Math.random()) | 0];
    const message = await channel.send(
      `<@${member.user.id}> is no longer <#${HALOFUNTIME_ID_CHANNEL_NEW_HERE}>. ${quip}`
    );
    message.react("1009898129933488138");
  }
};

module.exports = {
  kickLurkers: kickLurkers,
  postHelpfulHintToNewHereChannel: postHelpfulHintToNewHereChannel,
  updateNewHereRoles: updateNewHereRoles,
};
