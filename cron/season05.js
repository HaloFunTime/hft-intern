const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS,
  HALOFUNTIME_ID_CHANNEL_DOMAIN_CHALLENGE,
  HALOFUNTIME_ID_ROLE_TEAM_HFT_INTERN,
  HALOFUNTIME_ID_ROLE_TEAM_FUNTIMEBOT,
  HALOFUNTIME_ID_EMOJI_FUNTIMEBOT,
  HALOFUNTIME_ID_EMOJI_HFT_INTERN,
  HALOFUNTIME_ID,
} = require("../constants");
const members = require("../utils/members");
const { getCurrentSeason, SEASON_05 } = require("../utils/seasons");
dayjs.extend(utc);
dayjs.extend(timezone);

const announceNewDomain = async (client) => {
  if (getCurrentSeason() !== SEASON_05) {
    return;
  }
  const channel = client.channels.cache.get(
    HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS
  );
  const message = await channel.send({
    content: `A new Domain has been revealed!\n\nUse the \`/check-domains\` command in <#${HALOFUNTIME_ID_CHANNEL_DOMAIN_CHALLENGE}> to see what it is...`,
  });
  await message.react(HALOFUNTIME_ID_EMOJI_FUNTIMEBOT);
  await message.react(HALOFUNTIME_ID_EMOJI_HFT_INTERN);
  await message.react("📊");
};

const processReassignments = async (client) => {
  if (getCurrentSeason() !== SEASON_05) {
    return;
  }
  const now = dayjs().tz("America/Denver");
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const response = await axios
    .post(
      `${HALOFUNTIME_API_URL}/season-05/process-reassignments`,
      {
        date: now.format("YYYY-MM-DD"),
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
    console.log(response);
    console.error("Ran into an error processing reassignments.");
    return;
  }
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);
  const channel = client.channels.cache.get(
    HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS
  );
  for (const pr of response.processedReassignments) {
    const member = await guild.members.fetch(pr.discordUserId);
    const { roleId, emojiId, emojiString } =
      await members.updateDomainChallengeTeamRole(
        member,
        response.assignedTeam
      );
    let messageText = `<@${pr.discordUserId}> `;
    if (roleId) {
      messageText += `has been reassigned to ${emojiString} ${roleId}.`;
    } else {
      messageText += "is no longer assigned to a team.";
    }
    messageText += ` *${pr.reason}*`;
    const message = await channel.send({
      allowedMentions: { users: [pr.discordUserId] },
      content: messageText,
    });
    if (emojiId) {
      await message.react(emojiId);
    } else {
      await message.react("📊");
    }
  }
};

const weeklyTeamRecap = async (client) => {
  if (getCurrentSeason() !== SEASON_05) {
    return;
  }
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const teamScoresResponse = await axios
    .get(`${HALOFUNTIME_API_URL}/season-05/check-teams`, {
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
  // Log and return if error data is present
  if ("error" in teamScoresResponse) {
    console.log(teamScoresResponse);
    console.error("Ran into an error retrieving the weekly team recap.");
    return;
  }

  function domainString(domains) {
    return `${domains} ${domains === 1 ? "Domain" : "Domains"}`;
  }

  function memberString(members) {
    return `${members} ${members === 1 ? "member has" : "members have"}`;
  }

  const introLine = `The week has ended and it's time to check our scores for the <#${HALOFUNTIME_ID_CHANNEL_DOMAIN_CHALLENGE}>.`;
  const scoreLines = [];
  let domainsFunTimeBot = 0;
  let domainsHFTIntern = 0;
  for (const teamScore of teamScoresResponse.teamScores) {
    if (teamScore.team === "FunTimeBot") {
      domainsFunTimeBot = teamScore.domainsMastered;
    } else if (teamScore.team === "HFT Intern") {
      domainsHFTIntern = teamScore.domainsMastered;
    }
    scoreLines.push(
      `> **Team ${teamScore.team}**'s ${memberString(
        teamScore.memberCount
      )} mastered **${domainString(teamScore.domainsMastered)}**.`
    );
  }
  let resultLine;
  if (domainsFunTimeBot > domainsHFTIntern) {
    resultLine = `__<@&${HALOFUNTIME_ID_ROLE_TEAM_FUNTIMEBOT}> is beating <@&${HALOFUNTIME_ID_ROLE_TEAM_HFT_INTERN}> by **${domainString(
      domainsFunTimeBot - domainsHFTIntern
    )}!**__`;
  } else if (domainsHFTIntern > domainsFunTimeBot) {
    resultLine = `__<@&${HALOFUNTIME_ID_ROLE_TEAM_HFT_INTERN}> is beating <@&${HALOFUNTIME_ID_ROLE_TEAM_FUNTIMEBOT}> by **${domainString(
      domainsHFTIntern - domainsFunTimeBot
    )}!**__`;
  } else {
    resultLine = `__**<@&${HALOFUNTIME_ID_ROLE_TEAM_FUNTIMEBOT}> and <@&${HALOFUNTIME_ID_ROLE_TEAM_HFT_INTERN}> are tied!**__`;
  }

  const channel = client.channels.cache.get(
    HALOFUNTIME_ID_CHANNEL_ANNOUNCEMENTS
  );
  const message = await channel.send({
    content: `${introLine}\n\n${scoreLines.join("\n")}\n\n${resultLine}`,
  });
  await message.react(HALOFUNTIME_ID_EMOJI_FUNTIMEBOT);
  await message.react(HALOFUNTIME_ID_EMOJI_HFT_INTERN);
  await message.react("📊");
};

module.exports = {
  announceNewDomain: announceNewDomain,
  processReassignments: processReassignments,
  weeklyTeamRecap: weeklyTeamRecap,
};
