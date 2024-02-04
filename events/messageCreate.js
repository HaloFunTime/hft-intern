const axios = require("axios");
const { ChannelType, MessageType } = require("discord.js");
const {
  HALOFUNTIME_ID_CHANNEL_LFG_8S,
  HALOFUNTIME_ID_CHANNEL_LFG_BTB,
  HALOFUNTIME_ID_CHANNEL_LFG_CUSTOMS,
  HALOFUNTIME_ID_CHANNEL_LFG_FFA,
  HALOFUNTIME_ID_CHANNEL_LFG_MCC_CO_OP,
  HALOFUNTIME_ID_CHANNEL_LFG_MCC_CUSTOMS,
  HALOFUNTIME_ID_CHANNEL_LFG_MCC_MATCHMAKING,
  HALOFUNTIME_ID_CHANNEL_LFG_PVE,
  HALOFUNTIME_ID_CHANNEL_LFG_RANKED,
  HALOFUNTIME_ID_CHANNEL_LFG_SOCIAL,
  HALOFUNTIME_ID_CHANNEL_LFG_TESTING,
  HALOFUNTIME_ID_CHANNEL_PASSION_PATROL,
  HALOFUNTIME_ID_CHANNEL_WAYWO,
  HALOFUNTIME_ID_ROLE_8S,
  HALOFUNTIME_ID_ROLE_BTB,
  HALOFUNTIME_ID_ROLE_CUSTOMS,
  HALOFUNTIME_ID_ROLE_FFA,
  HALOFUNTIME_ID_ROLE_MCC_CO_OP,
  HALOFUNTIME_ID_ROLE_MCC_CUSTOMS,
  HALOFUNTIME_ID_ROLE_MCC_MATCHMAKING,
  HALOFUNTIME_ID_ROLE_PVE,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_BRONZE,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_DIAMOND,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_GOLD,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_ONYX,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_PLATINUM,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_SILVER,
  HALOFUNTIME_ID_ROLE_SOCIAL,
  HALOFUNTIME_ID_ROLE_TESTING,
} = require("../constants.js");
const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;

const LFG_CHANNEL_IDS_TO_ROLE_IDS = {};
LFG_CHANNEL_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_8S] = [
  HALOFUNTIME_ID_ROLE_8S,
];
LFG_CHANNEL_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_BTB] = [
  HALOFUNTIME_ID_ROLE_BTB,
];
LFG_CHANNEL_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_CUSTOMS] = [
  HALOFUNTIME_ID_ROLE_CUSTOMS,
];
LFG_CHANNEL_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_FFA] = [
  HALOFUNTIME_ID_ROLE_FFA,
];
LFG_CHANNEL_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_MCC_CO_OP] = [
  HALOFUNTIME_ID_ROLE_MCC_CO_OP,
];
LFG_CHANNEL_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_MCC_CUSTOMS] = [
  HALOFUNTIME_ID_ROLE_MCC_CUSTOMS,
];
LFG_CHANNEL_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_MCC_MATCHMAKING] = [
  HALOFUNTIME_ID_ROLE_MCC_MATCHMAKING,
];
LFG_CHANNEL_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_PVE] = [
  HALOFUNTIME_ID_ROLE_PVE,
];
LFG_CHANNEL_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_RANKED] = [
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_ONYX,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_DIAMOND,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_PLATINUM,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_GOLD,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_SILVER,
  HALOFUNTIME_ID_ROLE_RANKED_ARENA_BRONZE,
];
LFG_CHANNEL_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_SOCIAL] = [
  HALOFUNTIME_ID_ROLE_SOCIAL,
];
LFG_CHANNEL_IDS_TO_ROLE_IDS[HALOFUNTIME_ID_CHANNEL_LFG_TESTING] = [
  HALOFUNTIME_ID_ROLE_TESTING,
];

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
          discordUsername: message.author.username,
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

async function attemptLfgHelp(message) {
  // Do not attempt LFG help if the message was authored by this bot
  if (message.author.id === message.client.user.id) return;
  // Do not attempt LFG help if the message was sent by another application
  if (message.applicationId) return;
  // Do not attempt LFG help if the message was not sent in an LFG channel
  if (!(message.channelId in LFG_CHANNEL_IDS_TO_ROLE_IDS)) return;
  // Do not attempt LFG help if the message contains role or member mentions, or is a direct reply
  if (
    message.mentions.roles.size > 0 ||
    message.mentions.users.size > 0 ||
    message.type === MessageType.Reply
  )
    return;
  // Do not attempt LFG help if the sender has already been offered help in the past
  const response = await axios
    .post(
      `${HALOFUNTIME_API_URL}/discord/lfg-channel-help-prompt`,
      {
        discordUserId: message.author.id,
        discordUsername: message.author.username,
        lfgChannelId: message.channelId,
        lfgChannelName: message.channel.name,
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
  // Log if an error happens
  if (response.success === false || "error" in response) {
    console.log(response.error);
    return;
  } else if (response.success && response.new) {
    // Deduce appropriate LFG roles based on the channelId
    const pingRecommendations = [];
    const roleIds = LFG_CHANNEL_IDS_TO_ROLE_IDS[message.channelId] || [];
    for (const roleId of roleIds) {
      pingRecommendations.push(`<@&${roleId}>`);
    }
    if (pingRecommendations.length > 0) {
      const roleText =
        pingRecommendations.length === 1
          ? "this LFG role"
          : "one of these LFG roles";
      const messageContent = `I noticed that your message didn't mention anyone. Try directly replying to someone or mentioning ${roleText}: ${pingRecommendations.join(
        " "
      )}.`;
      // Send the LFG Help message
      await message.reply({
        content: messageContent,
        allowedMentions: { users: [message.author.id] },
        ephemeral: true,
      });
    }
  }
}

async function attemptPassionPatrolAction(message) {
  // Do not attempt a Passion Patrol action if the message was authored by this bot
  if (message.author.id === message.client.user.id) return;
  // Do not attempt a Passion Patrol action if the message was sent by another application
  if (message.applicationId) return;
  // Do not attempt a Passion Patrol action if the message mentions no one
  if (message.mentions.users.size === 0) return;
  // Do not attempt a Passion Patrol action if the message does not mention the bot specifically
  const messageMentionedBot = message.mentions.users.reduce((acc, user) => {
    if (acc) return true;
    return user.id === message.client.user.id;
  }, false);
  if (!messageMentionedBot) return;
  // Do not attempt a Passion Patrol action if the message content does not match a lenient "passion patrol" regular expression
  const passionPatrol = /(passion){1}.+(patrol){1}/i;
  if (!passionPatrol.test(message.content)) return;
  // Retrieve the current chief of the Passion Patrol
  const passionPatrolChannel = message.client.channels.cache.get(
    HALOFUNTIME_ID_CHANNEL_PASSION_PATROL
  );
  const matches = passionPatrolChannel.topic.match(/(\d+)/);
  if (!matches) return;
  // Do not attempt a Passion Patrol action if the message was not sent by the Chief of the Passion Patrol
  const passionPatrolChiefId = matches[0];
  if (message.author.id !== passionPatrolChiefId) return;
  // Attempt actions on mentioned users based on whether "add" or "remove" was said
  let actionTaken = false;
  await message.mentions.users.forEach(async (user) => {
    if (user.id === message.client.user.id) return;
    const add = /(add){1}/i;
    const remove = /(remove){1}/i;
    if (add.test(message.content)) {
      await passionPatrolChannel.permissionOverwrites.create(user.id, {
        ReadMessageHistory: true,
        SendMessages: true,
        ViewChannel: true,
      });
      await passionPatrolChannel.send(
        `<@${user.id}> has been added to the Passion Patrol by <@${passionPatrolChiefId}>.`
      );
      actionTaken = true;
    } else if (remove.test(message.content)) {
      await passionPatrolChannel.permissionOverwrites.delete(
        user.id,
        "Chief's orders."
      );
      await passionPatrolChannel.send(
        `<@${user.id}> has been removed from the Passion Patrol by <@${passionPatrolChiefId}>.`
      );
      actionTaken = true;
    }
  });
}

async function attemptRandomBeanReward(message) {
  // Do not award a Pathfinder Bean if the random roll fails
  if (Math.random() > 0.01) return;
  // Bean time!
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const response = await axios
    .post(
      `${HALOFUNTIME_API_URL}/pathfinder/change-beans`,
      {
        discordId: message.author.id,
        discordUsername: message.author.username,
        beanDelta: 1,
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
  } else if (response.success) {
    await message.react("🫘");
  }
}

async function recordWaywoComment(message) {
  // Do not record a WAYWO comment if the message was authored by this bot
  if (message.author.id === message.client.user.id) return;
  // Do not record a WAYWO comment if the message was sent by another application
  if (message.applicationId) return;
  // Do not record a WAYWO comment if the message was not sent in a thread
  if (message.channel.type !== ChannelType.PublicThread) return;
  // Do not record a WAYWO comment if the message was not sent in a thread belonging to the WAYWO forum channel
  if (message.channel.parentId !== HALOFUNTIME_ID_CHANNEL_WAYWO) return;
  // Record data in the backend
  const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
  const response = await axios
    .post(
      `${HALOFUNTIME_API_URL}/pathfinder/waywo-comment`,
      {
        commenterDiscordId: message.author.id,
        commenterDiscordUsername: message.author.username,
        commentId: message.id,
        commentLength: message.content.length,
        postId: message.channelId,
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
  } else if (response.awardedBean) {
    await message.react("🫘");
  } else if (!response.awardedBean) {
    // Reward a Pathfinder Bean anyway 1% of the time to drive everyone crazy trying to figure out how to trigger it
    await attemptRandomBeanReward(message);
  }
}

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (message.inGuild()) {
      console.log(
        `${message.guild?.name}: ${message.author?.username} sent a message in the #${message.channel?.name} channel.`
      );
      await attemptChatterPause(message);
      await attemptChatter(message);
      await attemptLfgHelp(message);
      await attemptPassionPatrolAction(message);
      await recordWaywoComment(message);
    }
  },
};
