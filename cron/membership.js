const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const members = require("../utils/members");
const {
  HALO_INFINITE_RANKED_ARENA_PLAYLIST_ID,
  HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS,
  HALOFUNTIME_ID_CHANNEL_FIRST_100,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_RANKED_ARENA_GRIND,
  HALOFUNTIME_ID_CHANNEL_LFG,
  HALOFUNTIME_ID_CHANNEL_LOGS,
  HALOFUNTIME_ID_CHANNEL_NEW_HERE,
  HALOFUNTIME_ID_EMOJI_HFT_BYE,
  HALOFUNTIME_ID_ROLE_FIRST_100,
  HALOFUNTIME_ID_ROLE_MEMBER,
  HALOFUNTIME_ID_ROLE_NEW_HERE,
  HALOFUNTIME_ID_ROLE_PARTYTIMER,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_BRONZE,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_DIAMOND,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_GOLD,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_ONYX,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_PLATINUM,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_SILVER,
  HALOFUNTIME_ID_ROLE_RANKED,
  HALOFUNTIME_ID_ROLE_STAFF,
  HALOFUNTIME_ID,
  PARTYTIMER_CAP,
  PARTYTIMER_TOTAL_REP_MINIMUM,
  PARTYTIMER_UNIQUE_REP_MINIMUM,
} = require("../constants.js");
dayjs.extend(utc);
dayjs.extend(timezone);

const ROLE_ID_FOR_CSR_TIER = {
  onyx: HALOFUNTIME_ID_ROLE_RANKED_ARENA_ONYX,
  diamond: HALOFUNTIME_ID_ROLE_RANKED_ARENA_DIAMOND,
  platinum: HALOFUNTIME_ID_ROLE_RANKED_ARENA_PLATINUM,
  gold: HALOFUNTIME_ID_ROLE_RANKED_ARENA_GOLD,
  silver: HALOFUNTIME_ID_ROLE_RANKED_ARENA_SILVER,
  bronze: HALOFUNTIME_ID_ROLE_RANKED_ARENA_BRONZE,
};

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
      if (error?.response?.data) {
        return error.response.data;
      }
    });
  // Return without trying to send a hint if error data is present
  if ("error" in hintPayload) return;
  const channel = client.channels.cache.get(HALOFUNTIME_ID_CHANNEL_NEW_HERE);
  const message = await channel.send(hintPayload.hint);
  message.react("🧠");
};

const updateFirst100Roles = async (client) => {
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);
  const allMembersMap = await guild.members.fetch({
    cache: true,
    withUserCount: true,
  });
  const allMembers = Array.from(allMembersMap.values()).filter(
    (m) => !m.user.bot && m.roles.cache.has(HALOFUNTIME_ID_ROLE_MEMBER)
  );
  const allMembersSortedByJoinDate = allMembers.sort((a, b) => {
    if (parseInt(a.joinedTimestamp) < parseInt(b.joinedTimestamp)) {
      return -1;
    } else if (parseInt(a.joinedTimestamp) > parseInt(b.joinedTimestamp)) {
      return 1;
    }
    return 0;
  });
  const first100Members = allMembersSortedByJoinDate.slice(0, 100);
  const membersToAddFirst100 = first100Members.filter(
    (m) => !m.roles.cache.has(HALOFUNTIME_ID_ROLE_FIRST_100)
  );
  const channel = client.channels.cache.get(HALOFUNTIME_ID_CHANNEL_FIRST_100);
  for (m of membersToAddFirst100) {
    const member = await m.roles.add(HALOFUNTIME_ID_ROLE_FIRST_100);
    const message = await channel.send(
      `<@${member.user.id}>, you now qualify as one of the <#${HALOFUNTIME_ID_CHANNEL_FIRST_100}> members of the server by join date.`
    );
    message.react("💯");
  }
};

const updateNewHereRoles = async (client) => {
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const now = dayjs();
  const twentyEightDaysAgoUnix = now.subtract(28, "day").valueOf();
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
      parseInt(m.joinedTimestamp) >= parseInt(twentyEightDaysAgoUnix)
  );
  const membersToRemoveNewHere = allMembers.filter(
    (m) =>
      m.roles.cache.has(HALOFUNTIME_ID_ROLE_NEW_HERE) &&
      parseInt(m.joinedTimestamp) < parseInt(twentyEightDaysAgoUnix)
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
        console.error(error);
        // Return the error payload directly if present
        if (error?.response?.data) {
          return error.response.data;
        }
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
    let welcomeDM = "";
    welcomeDM += `Welcome to HaloFunTime, <@${member.user.id}>! I'm the Intern, HaloFunTime's favorite bot.\n\n`;
    welcomeDM +=
      "HaloFunTime is a party-up server designed to help you find people to play Halo with. ";
    welcomeDM += `Post in threads in the <#${HALOFUNTIME_ID_CHANNEL_LFG}> channel to find people and party up! `;
    welcomeDM +=
      "You can add or remove roles in the 'Channels & Roles' section at any time to start (or stop) receiving LFG pings. ";
    welcomeDM +=
      "Don't hesitate to create a voice channel or join an existing one - we are a very welcoming community!\n\n";
    welcomeDM += `I've added you to the <#${HALOFUNTIME_ID_CHANNEL_NEW_HERE}> channel for the next 28 days. `;
    welcomeDM +=
      "It's a great place to meet people, learn about the server, and chat directly with the Staff.\n\n";
    welcomeDM +=
      "When you get a chance, please use the `/link-gamertag` command to link your Xbox Live gamertag. ";
    welcomeDM +=
      "HaloFunTime uses your linked gamertag to pull data from Halo Infinite, assign special roles, and ";
    welcomeDM += "otherwise make sure everyone has a fun time!";
    await member.send(welcomeDM);
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
        console.error(error);
        // Return the error payload directly if present
        if (error?.response?.data) {
          return error.response.data;
        }
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
      console.error(error);
      // Return the error payload directly if present
      if (error?.response?.data) {
        return error.response.data;
      }
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
  const qualifiedPartyTimers = allMembers
    .filter(
      (m) =>
        !m.roles.cache.has(HALOFUNTIME_ID_ROLE_STAFF) &&
        qualifyingMemberIds.includes(m.id)
    )
    .slice(0, PARTYTIMER_CAP);
  const membersToAddPartyTimer = qualifiedPartyTimers.filter(
    (m) => !m.roles.cache.has(HALOFUNTIME_ID_ROLE_PARTYTIMER)
  );
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
      "Unfortunately you no longer meet the minimum requirements for the HaloFunTime PartyTimer role, so it has been removed.\n\n" +
        `You must have at least ${PARTYTIMER_TOTAL_REP_MINIMUM} total rep, from ${PARTYTIMER_UNIQUE_REP_MINIMUM} unique members, ` +
        `and be within the top ${PARTYTIMER_CAP} non-Staff members by total rep to qualify for the PartyTimer role.`
    );
  }
  const channel = client.channels.cache.get(
    HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS
  );
  const introLine = `It's party time! The top ${PARTYTIMER_CAP} FunTimers by rep received (who meet the minimum rep requirements) are eligible for special recognition.`;
  const promotionsLine =
    partyTimerPromotions.length === 0
      ? `Looks like no one new has earned the <@&${HALOFUNTIME_ID_ROLE_PARTYTIMER}> role this week. We'll check again this time next week.`
      : partyTimerPromotions.join("\n");
  let currentPartyTimersLine = "";
  if (qualifiedPartyTimers.length > 0) {
    const partyTimerMentions = [];
    for (const member of qualifiedPartyTimers) {
      partyTimerMentions.push(`<@${member.id}>`);
    }
    currentPartyTimersLine = `This week's <@&${HALOFUNTIME_ID_ROLE_PARTYTIMER}>s are:\n${partyTimerMentions.join(
      "\n"
    )}\n\n`;
  }
  const cooldownLine =
    "All `/plus-rep` cooldowns have been reset for the week. Happy repping!";
  await channel.send({
    content: `${introLine}\n\n${promotionsLine}\n\n${currentPartyTimersLine}${cooldownLine}`,
  });
};

const updateRankedRoles = async (client) => {
  console.log("Checking Ranked roles...");
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);
  const allMembersMap = await guild.members.fetch({
    cache: true,
    withUserCount: true,
  });
  const allMembers = Array.from(allMembersMap.values()).filter(
    (m) => !m.user.bot
  );
  const allMembersWithRankedRole = Array.from(allMembersMap.values()).filter(
    (m) => !m.user.bot && m.roles.cache.has(HALOFUNTIME_ID_ROLE_RANKED)
  );
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const response = await axios
    .post(
      `${HALOFUNTIME_API_URL}/discord/ranked-role-check`,
      {
        discordUserIds: allMembersWithRankedRole.map((m) => m.user.id),
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
  if ("error" in response) {
    console.error("Ran into an error checking ranked roles.");
  } else {
    console.log(JSON.stringify(response));
    const congratulationMessages = [];
    // Add and remove the specific role for each rank
    for (rank of Object.keys(ROLE_ID_FOR_CSR_TIER)) {
      const roleId = ROLE_ID_FOR_CSR_TIER[rank];
      const membersIdsEarnedRank = response[rank];
      const membersToRemoveRank = allMembers.filter(
        (m) =>
          m.roles.cache.has(roleId) && !membersIdsEarnedRank.includes(m.user.id)
      );
      const membersToAddRank = allMembers.filter(
        (m) =>
          m.roles.cache.has(HALOFUNTIME_ID_ROLE_RANKED) &&
          !m.roles.cache.has(roleId) &&
          membersIdsEarnedRank.includes(m.user.id)
      );
      for (m of membersToAddRank) {
        const member = await m.roles.add(roleId);
        console.log(
          `ADDED ${rank.toUpperCase()} role to ${member.user.username}#${
            member.user.discriminator
          }`
        );
        const congratsMessage = `<@${m.user.id}> has earned the <@&${roleId}> role!`;
        congratulationMessages.push(congratsMessage);
      }
      for (m of membersToRemoveRank) {
        const member = await m.roles.remove(roleId);
        console.log(
          `REMOVED ${rank.toUpperCase()} role from ${member.user.username}#${
            member.user.discriminator
          }`
        );
      }
    }
    if (congratulationMessages.length > 0) {
      const congratsMessage =
        congratulationMessages.join("\n") +
        `\n\n> *To be eligible for a rank-specific role, get the* <@&${HALOFUNTIME_ID_ROLE_RANKED}> *role and link ` +
        `your gamertag with the \`/link-gamertag\` command. If you remove the* <@&${HALOFUNTIME_ID_ROLE_RANKED}> ` +
        "*role or change your linked gamertag, you will lose your rank-specific role.*";
      const channel = client.channels.cache.get(HALOFUNTIME_ID_CHANNEL_LFG);
      const thread = await channel.threads.fetch(
        HALOFUNTIME_ID_CHANNEL_LFG_THREAD_RANKED_ARENA_GRIND
      );
      await thread.send({
        content: congratsMessage,
        allowedMentions: { parse: ["users"] },
      });
    }
    console.log("Finished checking Ranked roles.");
  }
};

module.exports = {
  kickLurkers: kickLurkers,
  postHelpfulHintToNewHereChannel: postHelpfulHintToNewHereChannel,
  updateFirst100Roles: updateFirst100Roles,
  updateNewHereRoles: updateNewHereRoles,
  updatePartyTimerRoles: updatePartyTimerRoles,
  updateRankedRoles: updateRankedRoles,
};
