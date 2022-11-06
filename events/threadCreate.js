const {
  HALOFUNTIME_LFG_CHANNEL_ID,
  HALOFUNTIME_MCC_LFG_CHANNEL_ID,
  HALOFUNTIME_WELCOME_CHANNEL_ID,
} = require("../constants.js");

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

async function attemptLfgHelp(thread) {
  // Do not send an LFG Help message if the thread is not in the LFG or MCC LFG forum channel
  if (
    thread.parentId !== HALOFUNTIME_LFG_CHANNEL_ID &&
    thread.parentId !== HALOFUNTIME_MCC_LFG_CHANNEL_ID
  )
    return;
  if (thread.sendable) {
    await thread.send({
      content: `Thanks for making an LFG post, <@${thread.ownerId}>!\n\n\
      Your post is now visible to everyone on HaloFunTime, and anyone may comment on it or hit the "follow" bell to \
      see it show up in the Discord sidebar and opt in to receiving pings from messages on this post.\n\n
      You can force your friends to follow this post by @-mentioning them directly, but keep in mind that Discord \
      won't force people from a role to follow your post if you @-mention a role that 100 or more people have.`,
    });
  }
}

module.exports = {
  name: "threadCreate",
  async execute(thread) {
    await attemptWelcome(thread);
    await attemptLfgHelp(thread);
  },
};
