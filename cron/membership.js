const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const members = require("../utils/members");
const {
  HALO_INFINITE_RANKED_ARENA_PLAYLIST_ID,
  HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS,
  HALOFUNTIME_ID_CHANNEL_FIRST_100,
  HALOFUNTIME_ID_CHANNEL_LFG_RANKED,
  HALOFUNTIME_ID_CHANNEL_LOGS,
  HALOFUNTIME_ID_CHANNEL_NEW_HERE,
  HALOFUNTIME_ID_EMOJI_GRUNT_BIRTHDAY,
  HALOFUNTIME_ID_EMOJI_HALOFUNTIME_DOT_COM,
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
const { getApplicationCommandMention } = require("../utils/formatting.js");
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
    const linkGamertagMention = await getApplicationCommandMention(
      "link-gamertag",
      client
    );
    let welcomeDM = "";
    welcomeDM += `Welcome to HaloFunTime, <@${member.user.id}>! I'm the Intern, HaloFunTime's favorite bot.\n\n`;
    welcomeDM +=
      "HaloFunTime is a party-up server designed to help you find people to play Halo with. ";
    welcomeDM += "Ping LFG roles in LFG channels to find people and party up! ";
    welcomeDM +=
      "You can add or remove roles in the 'Channels & Roles' section at any time to start (or stop) receiving LFG pings. ";
    welcomeDM +=
      "Don't hesitate to create a voice channel or join an existing one - we are a very welcoming community!\n\n";
    welcomeDM += `I've added you to the <#${HALOFUNTIME_ID_CHANNEL_NEW_HERE}> channel for the next 28 days. `;
    welcomeDM +=
      "It's a great place to learn about the server and chat directly with the Staff.\n\n";
    welcomeDM += `When you get a chance, please click ${linkGamertagMention} to link your Xbox Live gamertag. `;
    welcomeDM +=
      "HaloFunTime uses your linked gamertag to pull data from Halo Infinite, assign special roles, and ";
    welcomeDM += "otherwise make sure everyone has a fun time!";
    try {
      await member.send(welcomeDM);
    } catch (e) {
      console.log("Error sending welcome DM");
      console.error(e);
    }
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
  const now = dayjs();
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
  const staffIds = currentStaff.map((member) => member.user.id);
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const response = await axios
    .get(
      `${HALOFUNTIME_API_URL}/reputation/partytimers` +
        `?cap=${PARTYTIMER_CAP}` +
        `&totalRepMin=${PARTYTIMER_TOTAL_REP_MINIMUM}` +
        `&uniqueRepMin=${PARTYTIMER_UNIQUE_REP_MINIMUM}` +
        `&excludeIds=${staffIds.join(",")}`,
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
  if (!response || (response && "error" in response)) {
    console.error("Ran into an error retrieving this week's PartyTimers.");
    return;
  }
  const partyTimerIds = response.partyTimers.map((r) => r.discordId);
  const partyTimerMembers = allMembers.filter((m) =>
    partyTimerIds.includes(m.id)
  );
  const membersToAddPartyTimer = partyTimerMembers.filter(
    (m) => !m.roles.cache.has(HALOFUNTIME_ID_ROLE_PARTYTIMER)
  );
  const membersToRemovePartyTimer = allMembers.filter(
    (m) =>
      m.roles.cache.has(HALOFUNTIME_ID_ROLE_PARTYTIMER) &&
      !partyTimerIds.includes(m.id)
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
  const plusRepCommand = await getApplicationCommandMention(
    "plus-rep",
    interaction.client
  );
  const introLine =
    `It's party time! The top ${PARTYTIMER_CAP} FunTimers by rep received (who meet the minimum requirements) earn ` +
    `the <@&${HALOFUNTIME_ID_ROLE_PARTYTIMER}> role, which gives them advanced party hosting powers. ` +
    `It's important for all FunTimers to use the ${plusRepCommand} command to reward their favorite party hosts!`;
  const promotionsLine =
    partyTimerPromotions.length === 0
      ? `Looks like no one new has earned the <@&${HALOFUNTIME_ID_ROLE_PARTYTIMER}> role this week. We'll check again this time next week.`
      : partyTimerPromotions.join("\n");
  let partyTimerEmbeds = null;
  if (response.partyTimers.length > 0) {
    const partyTimersByRank = {};
    for (const partyTimer of response.partyTimers) {
      if (!partyTimersByRank[partyTimer.rank]) {
        partyTimersByRank[partyTimer.rank] = [partyTimer];
      } else {
        partyTimersByRank[partyTimer.rank].push(partyTimer);
      }
    }
    const fields = [];
    for (let i = 1; i <= PARTYTIMER_CAP; i++) {
      if (i in partyTimersByRank) {
        const partyTimers = partyTimersByRank[i];
        const valueStrings = [];
        for (const partyTimer of partyTimers) {
          const peopleString =
            partyTimer.pastYearUniqueRep === 1 ? "person" : "people";
          valueStrings.push(
            `<@${partyTimer.discordId}>: ${partyTimer.pastYearTotalRep} rep (from ${partyTimer.pastYearUniqueRep} ${peopleString})`
          );
        }
        fields.push({
          name: `#${i}`,
          value: valueStrings.join("\n"),
        });
      }
    }
    const partyTimerEmbed = new EmbedBuilder()
      .setColor(0x1abc9c)
      .setTitle(`PartyTimers - Week of <t:${now.unix()}:D>`)
      .setThumbnail("https://api.halofuntime.com/static/HFTLogo.png")
      .addFields(fields)
      .setTimestamp()
      .setFooter({
        text: "Generated by HaloFunTime",
        iconURL: "https://api.halofuntime.com/static/HFTLogo.png",
      });
    partyTimerEmbeds = [partyTimerEmbed];
  }
  const cooldownLine =
    `All ${plusRepCommand} command cooldowns have been reset for the week.` +
    (partyTimerMembers.length > 0
      ? " Hats off to this week's PartyTimers!"
      : " Make sure to give rep so we have some PartyTimers next week!");
  const message = await channel.send({
    content: `${introLine}\n\n${promotionsLine}\n\n${cooldownLine}`,
    embeds: partyTimerEmbeds,
  });
  await message.react("🎉");
  await message.react(HALOFUNTIME_ID_EMOJI_GRUNT_BIRTHDAY);
  await message.react(HALOFUNTIME_ID_EMOJI_HALOFUNTIME_DOT_COM);
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
          `ADDED ${rank.toUpperCase()} role to ${member.user.username}`
        );
        const congratsMessage = `<@${m.user.id}> has earned the <@&${roleId}> role!`;
        congratulationMessages.push(congratsMessage);
      }
      for (m of membersToRemoveRank) {
        const member = await m.roles.remove(roleId);
        console.log(
          `REMOVED ${rank.toUpperCase()} role from ${member.user.username}`
        );
      }
    }
    if (congratulationMessages.length > 0) {
      const linkGamertagMention = await getApplicationCommandMention(
        "link-gamertag",
        client
      );
      const congratsMessage =
        congratulationMessages.join("\n") +
        `\n\n> ℹ️ *To get a rank role, link your gamertag with the* ${linkGamertagMention} *command. Rank roles are ` +
        "updated every 15 minutes based on the highest rank you have achieved during the current ranking period. " +
        `Removing the* <@&${HALOFUNTIME_ID_ROLE_RANKED}> *role in <id:customize> or changing your linked gamertag ` +
        "will remove your rank role.*";
      const channel = client.channels.cache.get(
        HALOFUNTIME_ID_CHANNEL_LFG_RANKED
      );
      await channel.send({
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
