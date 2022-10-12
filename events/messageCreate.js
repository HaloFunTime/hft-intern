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

function attemptChatter(message) {
  // Do not chatter if the message was authored by this bot
  if (message.author.id === message.client.user.id) return;
  // Do not chatter if the message was sent by another application
  if (message.applicationId) return;
  // Do not chatter if the random roll fails
  if (Math.random() > 0.001) return;
  chatter(message);
}

module.exports = {
  name: "messageCreate",
  async execute(message) {
    console.log(
      `${message.guild?.name}: ${message.author?.tag} sent a message in the #${message.channel?.name} channel.`
    );
    await attemptChatter(message);
  },
};
