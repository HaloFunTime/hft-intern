const {
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_8S_WITH_FRIENDS,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_BTB_AND_CHILL,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_CASUAL_4V4_HALO,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_CRAZY_CUSTOM_GAMES,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_FIREFIGHT_FUN,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_FORGE_MAP_TESTS,
  HALOFUNTIME_ID_CHANNEL_LFG_THREAD_RANKED_ARENA_GRIND,
  HALOFUNTIME_ID_CHANNEL_LFG,
  HALOFUNTIME_ID_ROLE_8S,
  HALOFUNTIME_ID_ROLE_BTB,
  HALOFUNTIME_ID_ROLE_CUSTOMS,
  HALOFUNTIME_ID_ROLE_PVE,
  HALOFUNTIME_ID_ROLE_RANKED,
  HALOFUNTIME_ID_ROLE_SOCIAL,
  HALOFUNTIME_ID_ROLE_TESTING,
} = require("../constants");

async function updateLfgThreadMembership(oldMember, newMember) {
  const lfgChannel = oldMember.client.channels.cache.get(
    HALOFUNTIME_ID_CHANNEL_LFG
  );
  // Old Roles
  const oldRoles = oldMember.roles.cache.filter(
    (r) => !newMember.roles.cache.has(r.id)
  );
  oldRoles.forEach(async (role) => {
    let thread;
    let reason;
    if (role.id === HALOFUNTIME_ID_ROLE_8S) {
      thread = lfgChannel.threads.cache.find(
        (t) => t.id === HALOFUNTIME_ID_CHANNEL_LFG_THREAD_8S_WITH_FRIENDS
      );
      reason = "Removed 8s Role";
    } else if (role.id === HALOFUNTIME_ID_ROLE_BTB) {
      thread = lfgChannel.threads.cache.find(
        (t) => t.id === HALOFUNTIME_ID_CHANNEL_LFG_THREAD_BTB_AND_CHILL
      );
      reason = "Removed BTB Role";
    } else if (role.id === HALOFUNTIME_ID_ROLE_CUSTOMS) {
      thread = lfgChannel.threads.cache.find(
        (t) => t.id === HALOFUNTIME_ID_CHANNEL_LFG_THREAD_CRAZY_CUSTOM_GAMES
      );
      reason = "Removed Customs Role";
    } else if (role.id === HALOFUNTIME_ID_ROLE_PVE) {
      thread = lfgChannel.threads.cache.find(
        (t) => t.id === HALOFUNTIME_ID_CHANNEL_LFG_THREAD_FIREFIGHT_FUN
      );
      reason = "Removed PvE Role";
    } else if (role.id === HALOFUNTIME_ID_ROLE_RANKED) {
      thread = lfgChannel.threads.cache.find(
        (t) => t.id === HALOFUNTIME_ID_CHANNEL_LFG_THREAD_RANKED_ARENA_GRIND
      );
      reason = "Removed Ranked Role";
    } else if (role.id === HALOFUNTIME_ID_ROLE_SOCIAL) {
      thread = lfgChannel.threads.cache.find(
        (t) => t.id === HALOFUNTIME_ID_CHANNEL_LFG_THREAD_CASUAL_4V4_HALO
      );
      reason = "Removed Social Role";
    } else if (role.id === HALOFUNTIME_ID_ROLE_TESTING) {
      thread = lfgChannel.threads.cache.find(
        (t) => t.id === HALOFUNTIME_ID_CHANNEL_LFG_THREAD_FORGE_MAP_TESTS
      );
      reason = "Removed Testing Role";
    }
    if (thread) {
      try {
        await thread.members.remove(newMember.id, reason);
      } catch (error) {
        console.log(error);
      }
    }
  });
  // New Roles
  const newRoles = newMember.roles.cache.filter(
    (r) => !oldMember.roles.cache.has(r.id)
  );
  newRoles.forEach(async (role) => {
    let thread;
    let reason;
    if (role.id === HALOFUNTIME_ID_ROLE_8S) {
      thread = lfgChannel.threads.cache.find(
        (t) => t.id === HALOFUNTIME_ID_CHANNEL_LFG_THREAD_8S_WITH_FRIENDS
      );
      reason = "Added 8s Role";
    } else if (role.id === HALOFUNTIME_ID_ROLE_BTB) {
      thread = lfgChannel.threads.cache.find(
        (t) => t.id === HALOFUNTIME_ID_CHANNEL_LFG_THREAD_BTB_AND_CHILL
      );
      reason = "Added BTB Role";
    } else if (role.id === HALOFUNTIME_ID_ROLE_CUSTOMS) {
      thread = lfgChannel.threads.cache.find(
        (t) => t.id === HALOFUNTIME_ID_CHANNEL_LFG_THREAD_CRAZY_CUSTOM_GAMES
      );
      reason = "Added Customs Role";
    } else if (role.id === HALOFUNTIME_ID_ROLE_PVE) {
      thread = lfgChannel.threads.cache.find(
        (t) => t.id === HALOFUNTIME_ID_CHANNEL_LFG_THREAD_FIREFIGHT_FUN
      );
      reason = "Added PvE Role";
    } else if (role.id === HALOFUNTIME_ID_ROLE_RANKED) {
      thread = lfgChannel.threads.cache.find(
        (t) => t.id === HALOFUNTIME_ID_CHANNEL_LFG_THREAD_RANKED_ARENA_GRIND
      );
      reason = "Added Ranked Role";
    } else if (role.id === HALOFUNTIME_ID_ROLE_SOCIAL) {
      thread = lfgChannel.threads.cache.find(
        (t) => t.id === HALOFUNTIME_ID_CHANNEL_LFG_THREAD_CASUAL_4V4_HALO
      );
      reason = "Added Social Role";
    } else if (role.id === HALOFUNTIME_ID_ROLE_TESTING) {
      thread = lfgChannel.threads.cache.find(
        (t) => t.id === HALOFUNTIME_ID_CHANNEL_LFG_THREAD_FORGE_MAP_TESTS
      );
      reason = "Added Testing Role";
    }
    if (thread) {
      try {
        await thread.members.add(newMember.id, reason);
      } catch (error) {
        console.log(error);
      }
    }
  });
}

module.exports = {
  name: "guildMemberUpdate",
  async execute(oldMember, newMember) {
    await updateLfgThreadMembership(oldMember, newMember);
  },
};
