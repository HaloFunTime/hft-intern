const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { attemptRandomGossip } = require("../utils/gossip");
dayjs.extend(utc);
dayjs.extend(timezone);

function randBoxMuller() {
  let x = 0,
    y = 0;
  while (x === 0) x = Math.random(); // Convert [0,1) to (0,1)
  while (y === 0) y = Math.random(); // Ditto above
  let num = Math.sqrt(-2.0 * Math.log(x)) * Math.cos(2.0 * Math.PI * y);
  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) return randBoxMuller(); // Resample between 0 and 1
  return num;
}

const scheduleGossip = async (client) => {
  // Every day, pick a random number of minutes after the cron initation time.
  // Using the Box-Muller transform and Math.random(), we bias RNG to a normal
  // distro centered 12 hours after the cron initiation time - which coincides
  // with peak Halo population hours (10PM Eastern/7PM Pacific). This maximizes
  // the chance that a gossip attempt happens with players around.
  const multiplier = randBoxMuller();
  const minutes = Math.floor(1440 * multiplier);
  const gossipTime = dayjs().add(minutes, "minutes").tz("America/Denver");
  setTimeout(attemptRandomGossip, 1000 * 60 * minutes, client);
  console.log(
    `HFT Intern will attempt to gossip at ${gossipTime.format(
      "YYYY-MM-DDTHH:mm"
    )} (${minutes} minutes from now).`
  );
};

module.exports = {
  scheduleGossip: scheduleGossip,
};
