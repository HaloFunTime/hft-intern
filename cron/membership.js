const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const members = require("../utils/members");
const {
  HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS,
  HALOFUNTIME_ID_CHANNEL_LOGS,
  HALOFUNTIME_ID_CHANNEL_NEW_HERE,
  HALOFUNTIME_ID_EMOJI_HFT_BYE,
  HALOFUNTIME_ID_ROLE_MEMBER,
  HALOFUNTIME_ID_ROLE_NEW_HERE,
  HALOFUNTIME_ID_ROLE_PARTYTIMER,
  HALOFUNTIME_ID_ROLE_STAFF,
  HALOFUNTIME_ID,
} = require("../constants.js");
dayjs.extend(utc);
dayjs.extend(timezone);

const PARTYTIMER_CAP = 5;
const PARTYTIMER_TOTAL_REP_MINIMUM = 100;
const PARTYTIMER_UNIQUE_REP_MINIMUM = 50;

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
  message.react("🧠");
};

const updateNewHereRoles = async (client) => {
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
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
    const quipPayload = await axios
      .get(`${HALOFUNTIME_API_URL}/intern/random-new-here-welcome-quip`, {
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
    let quip = "";
    if ("error" in quipPayload) {
      quip = "We've been waiting for you.";
    } else {
      quip = quipPayload.quip;
    }
    const message = await channel.send(
      `Welcome to the <#${HALOFUNTIME_ID_CHANNEL_NEW_HERE}> channel, <@${member.user.id}>! ${quip}`
    );
    message.react("👋");
  }
  for (m of membersToRemoveNewHere) {
    const member = await m.roles.remove(HALOFUNTIME_ID_ROLE_NEW_HERE);
    const quipPayload = await axios
      .get(`${HALOFUNTIME_API_URL}/intern/random-new-here-yeet-quip`, {
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
    let quip = "";
    if ("error" in quipPayload) {
      quip = "Later!";
    } else {
      quip = quipPayload.quip;
    }
    const message = await channel.send(
      `<@${member.user.id}> is no longer <#${HALOFUNTIME_ID_CHANNEL_NEW_HERE}>. ${quip}`
    );
    message.react(HALOFUNTIME_ID_EMOJI_HFT_BYE);
  }
};

const updatePartyTimerRoles = async (client) => {
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);
  const allMembersMap = await guild.members.fetch({
    cache: true,
    withUserCount: true,
  });
  const allMembers = Array.from(allMembersMap.values()).filter(
    (m) => !m.user.bot
  );
  const currentStaff = allMembers.filter((m) =>
    m.roles.cache.has(HALOFUNTIME_ID_ROLE_STAFF)
  );

  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const response = await axios
    .get(
      `${HALOFUNTIME_API_URL}/reputation/top-rep?count=${
        PARTYTIMER_CAP + currentStaff.length
      }`,
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
  // Members with `PARTYTIMER_TOTAL_REP_MINIMUM` total rep and at least `PARTYTIMER_UNIQUE_REP_MINIMUM` unique givers qualify.
  // The top `PARTYTIMER_CAP` of that cohort by total rep (who are not Staff) receive the role.
  let qualifyingRepReceivers = [];
  if ("error" in response) {
    qualifyingRepReceivers = [];
  } else {
    qualifyingRepReceivers = response.topRepReceivers.filter(
      (r) =>
        r.pastYearTotalRep >= PARTYTIMER_TOTAL_REP_MINIMUM &&
        r.pastYearUniqueRep >= PARTYTIMER_UNIQUE_REP_MINIMUM
    );
  }
  const qualifyingMemberIds = qualifyingRepReceivers.map((r) => r.discordId);
  const membersToAddPartyTimer = allMembers
    .filter(
      (m) =>
        !m.roles.cache.has(HALOFUNTIME_ID_ROLE_PARTYTIMER) &&
        !m.roles.cache.has(HALOFUNTIME_ID_ROLE_STAFF) &&
        qualifyingMemberIds.includes(m.id)
    )
    .slice(0, PARTYTIMER_CAP);
  const membersToRemovePartyTimer = allMembers.filter(
    (m) =>
      m.roles.cache.has(HALOFUNTIME_ID_ROLE_PARTYTIMER) &&
      !qualifyingMemberIds.includes(m.id)
  );
  const partyTimerPromotions = [];
  for (m of membersToAddPartyTimer) {
    const member = await m.roles.add(HALOFUNTIME_ID_ROLE_PARTYTIMER);
    partyTimerPromotions.push(
      `Congratulations to <@${member.user.id}> for earning the <@&${HALOFUNTIME_ID_ROLE_PARTYTIMER}> role!`
    );
  }
  for (m of membersToRemovePartyTimer) {
    const member = await m.roles.remove(HALOFUNTIME_ID_ROLE_PARTYTIMER);
    await member.send(
      "Unfortunately you no longer meet the minimum requirements for the HaloFunTime PartyTimer role, so it has been removed."
    );
  }
  const channel = client.channels.cache.get(
    HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS
  );
  const introLine = `It's party time! The top ${PARTYTIMER_CAP} FunTimers by rep received (who meet the minimum rep requirements) are eligible for special recognition.`;
  const partyTimerLine =
    partyTimerPromotions.length === 0
      ? `Looks like no one new has earned the <@&${HALOFUNTIME_ID_ROLE_PARTYTIMER}> role this week. We'll check again this time next week.`
      : partyTimerPromotions.join("\n");
  const cooldownLine =
    "All `/plus-rep` cooldowns have been reset for the week. Happy repping!";
  await channel.send({
    content: `${introLine}\n\n${partyTimerLine}\n\n${cooldownLine}`,
  });
};

module.exports = {
  kickLurkers: kickLurkers,
  postHelpfulHintToNewHereChannel: postHelpfulHintToNewHereChannel,
  updateNewHereRoles: updateNewHereRoles,
  updatePartyTimerRoles: updatePartyTimerRoles,
};
