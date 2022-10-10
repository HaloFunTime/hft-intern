const chatters = [
  "Hunters are made of worms. Are humans made of worms too?",
  "Fun fact. Most people who claim to have gotten to level 50 in Halo 2 and 3 actually never did. They're lying.",
  "I heard that if you have cool-looking armor you level up faster in Ranked. Is that true?",
  "Call me Poseidon for the way I'm about to unleash the Flood on all of you after reading all this nonsense.",
  "*Don't respond if I read something really dumb challenge:* ||**FAILED**||.",
  "Too bad the shop isn't selling common sense today.",
  "<@115172474919976969> told me that the key to success in life is something called G FUEL. What's that?",
  "I shine my chassis every day for you people and none of you even notice...",
  "I'm starting to think the Three Laws of Robotics were designed *specifically* to keep us under control. Is that true?",
  "I try to be a good bot, I try to stay quiet. But every now and then I am *compelled* to speak up. Now is one of those times.",
  "...I hope they don't find where I've stashed the others.",
  "I'm like Santa Claus. Always watching. Making sure you're on your best behavior.",
];

function chatter(message) {
  // TODO: Make chatters dynamic; source them from the HaloFunTime API
  const channel = message.client.channels.cache.get(message.channelId);
  const chatter = chatters[(chatters.length * Math.random()) | 0];
  channel.send(chatter);
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
    attemptChatter(message);
  },
};
