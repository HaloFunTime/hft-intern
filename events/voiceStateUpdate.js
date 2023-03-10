const axios = require("axios");
const dayjs = require("dayjs");
const { HALOFUNTIME_ID_CATEGORY_FUN_TIME_FRIDAY } = require("../constants.js");

async function attemptFunTimeFridayVoiceConnect(voiceState) {
  if (voiceState.channel.parentId !== HALOFUNTIME_ID_CATEGORY_FUN_TIME_FRIDAY)
    return;
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const response = await axios
    .post(
      `${HALOFUNTIME_API_URL}/fun-time-friday/voice-connect`,
      {
        connectorDiscordId: voiceState.member.user.id,
        connectorDiscordTag: voiceState.member.user.tag,
        connectedAt: dayjs().toISOString(),
        channelId: voiceState.channelId,
        channelName: voiceState.channel.name,
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
      if (error.response.data) {
        return error.response.data;
      }
    });
  // Log if an error happens
  if (response.success === false || "error" in response) {
    console.log(response.error);
  }
}

async function attemptFunTimeFridayVoiceDisconnect(voiceState) {
  if (voiceState.channel.parentId !== HALOFUNTIME_ID_CATEGORY_FUN_TIME_FRIDAY)
    return;
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const response = await axios
    .post(
      `${HALOFUNTIME_API_URL}/fun-time-friday/voice-disconnect`,
      {
        disconnectorDiscordId: voiceState.member.user.id,
        disconnectorDiscordTag: voiceState.member.user.tag,
        disconnectedAt: dayjs().toISOString(),
        channelId: voiceState.channelId,
        channelName: voiceState.channel.name,
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
      if (error.response.data) {
        return error.response.data;
      }
    });
  // Log if an error happens
  if (response.success === false || "error" in response) {
    console.log(response.error);
  }
}

async function joinedChannel(voiceState) {
  console.log(
    `${voiceState.guild?.name}: ${voiceState.member?.user?.tag} joined the ${voiceState.channel?.name} voice channel.`
  );
  attemptFunTimeFridayVoiceConnect(voiceState);
}

async function leftChannel(voiceState) {
  console.log(
    `${voiceState.guild?.name}: ${voiceState.member?.user?.tag} left the ${voiceState.channel?.name} voice channel.`
  );
  attemptFunTimeFridayVoiceDisconnect(voiceState);
}

module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState) {
    // Initial join: oldState has no channel, newState has channel
    if (!oldState.channel && newState.channel) {
      await joinedChannel(newState);
    }
    // Channel jump join: oldState has channel, newState has channel, both are different
    if (
      oldState.channel &&
      newState.channel &&
      oldState.channel !== newState.channel
    ) {
      await leftChannel(oldState);
      await joinedChannel(newState);
    }
    // Terminal leave: oldState has channel, newState has no channel
    if (oldState.channel && !newState.channel) {
      await leftChannel(oldState);
    }
  },
};
