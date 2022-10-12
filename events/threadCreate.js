const { HALOFUNTIME_WELCOME_CHANNEL_ID } = require("../constants.js");

async function attemptWelcome(thread) {
  // Do not send a welcome message if the thread is not in the Welcome channel
  if (thread.parentId !== HALOFUNTIME_WELCOME_CHANNEL_ID) return;
  if (thread.sendable) {
    await thread.send({
      content:
        "https://tenor.com/view/halo-halo2-elite-sangheili-greetings-gif-25839730",
    });
  }
}

module.exports = {
  name: "threadCreate",
  async execute(thread) {
    await attemptWelcome(thread);
  },
};
