const axios = require("axios");
const {
  HALOFUNTIME_ID_CHANNEL_LOGS,
  HALOFUNTIME_ID_ROLE_MEMBER,
  HALOFUNTIME_ID,
} = require("../constants");
const { getCurrentSeason, SEASON_05, SEASON_06 } = require("../utils/seasons");

const checkParticipantGames = async (client) => {
  if (getCurrentSeason() !== SEASON_05) {
    // TODO: Update this to S6
    return;
  }
  const guild = client.guilds.cache.get(HALOFUNTIME_ID);
  const members = await guild.members.fetch();
  const membersArray = Array.from(members.values()).filter(
    (m) => !m.user.bot && m.roles.cache.has(HALOFUNTIME_ID_ROLE_MEMBER)
  );
  const discordUserIds = membersArray.map((m) => m.user.id);
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const response = await axios
    .post(
      `${HALOFUNTIME_API_URL}/season-06/check-participant-games`,
      {
        discordUserIds: discordUserIds,
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
    console.error("Ran into an error checking participant games.");
    return;
  }
  const channel = client.channels.cache.get(HALOFUNTIME_ID_CHANNEL_LOGS);
  if (response.newGameCount > 0) {
    const message = await channel.send({
      content: `Fetched ${response.newGameCount} new game${
        response.newGameCount === 1 ? "" : "s"
      } (${response.totalGameCount} total).`,
    });
    await message.react("🆕");
  }
};

module.exports = {
  checkParticipantGames: checkParticipantGames,
};
