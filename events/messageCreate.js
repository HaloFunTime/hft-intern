const axios = require("axios");
const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;

async function chatter(message) {
  const chatterPayload = await axios
    .get(
      `${HALOFUNTIME_API_URL}/intern/random-chatter?channelId=${message.channelId}`,
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
  // Return without trying to chatter if error data is present
  if ("error" in chatterPayload) return;
  const channel = message.client.channels.cache.get(message.channelId);
  channel.send(chatterPayload.chatter);
}

async function pauseChatter(message) {
  // Check the message member's roles - if they lack a FunTimer role above 2, chirp them and refuse to pause chatter
  const funTimerRoles = (message.member?.roles?.cache || []).filter((role) =>
    /FunTimer/.test(role.name)
  );
  let funTimerRank = 0;
  funTimerRoles.forEach((role) => {
    funTimerRank = parseInt(role.name.split(" ")[1]);
  });
  if (funTimerRank > 2) {
    const chatterPausePayload = await axios
      .post(
        `${HALOFUNTIME_API_URL}/intern/pause-chatter`,
        {
          discordUserId: message.author.id,
          discordUserTag: message.author.tag,
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
    // Return without saying anything if error data is present
    if ("error" in chatterPausePayload) return;
    // Send a reverence or acceptance quip based on FunTimer rank
    const quipPayload = await axios
      .get(
        `${HALOFUNTIME_API_URL}/intern/random-chatter-pause-${
          funTimerRank > 9 ? "reverence" : "acceptance"
        }-quip`,
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
    // Return a default quip if an error is present
    let quip = "";
    if ("error" in quipPayload) {
      quip = "Alright.";
    } else {
      quip = quipPayload.quip;
    }
    await message.reply(quip);
  } else {
    // Send a denial quip
    const quipPayload = await axios
      .get(`${HALOFUNTIME_API_URL}/intern/random-chatter-pause-denial-quip`, {
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
      quip = "Nah.";
    } else {
      quip = quipPayload.quip;
    }
    await message.reply(quip);
  }
}

async function attemptChatterPause(message) {
  // Do not attempt to pause chatter if the message was authored by this bot
  if (message.author.id === message.client.user.id) return;
  // Do not attempt to pause chatter if the message was sent by another application
  if (message.applicationId) return;
  // Do not attempt to pause chatter if the message mentions no one
  if (message.mentions.users.size === 0) return;
  // Do not attempt to pause chatter if the message does not mention the bot specifically
  const message_mentioned_bot = message.mentions.users.reduce((acc, user) => {
    if (acc) return true;
    return user.id === message.client.user.id;
  }, false);
  if (!message_mentioned_bot) return;
  // Do not attempt to pause chatter if the message content does not match a lenient "shut up" regular expression
  const shutUp = /(shut){1}.+(up){1}/i;
  if (!shutUp.test(message.content)) return;
  // Chatter pause away!
  await pauseChatter(message);
}

async function attemptChatter(message) {
  // Do not chatter if the message was authored by this bot
  if (message.author.id === message.client.user.id) return;
  // Do not chatter if the message was sent by another application
  if (message.applicationId) return;
  // Do not chatter if the random roll fails
  if (Math.random() > 0.001) return;
  // Chatter away!
  await chatter(message);
}

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (message.inGuild()) {
      console.log(
        `${message.guild?.name}: ${message.author?.tag} sent a message in the #${message.channel?.name} channel.`
      );
      await attemptChatterPause(message);
      await attemptChatter(message);
    }
  },
};
