const { EmbedBuilder } = require("discord.js");

// Receive the response from the request in getCSR.js
// Return an array of Discord embed objects that are formatted to display an Xbox Live Gamertag along with the Halo Infinite CSR ranks for each playlist
function buildRankEmbeds(csr_data) {
  const rank_embeds = [];

  for (let playlist of csr_data.playlists) {
    const current_csr = playlist.current.csr;
    if (current_csr !== -1) {
      const currentTierDescription = playlist.current.tierDescription;
      const imageName = currentTierDescription.replace(" ", "-").toLowerCase();
      const rankEmbed = new EmbedBuilder()
        .setTitle(playlist.playlistName)
        .setThumbnail(
          `https://api.halofuntime.com/static/csr_images/${imageName}.png`
        )
        .addFields({
          name: `${currentTierDescription} (${current_csr})`,
          value: `**GT:** \`${csr_data.gamertag}\``,
        })
        .setTimestamp()
        .setFooter({ text: "Current CSR" });
      rank_embeds.push(rankEmbed);
    }
  }
  if (rank_embeds.length === 0) {
    let description = `\`${csr_data.gamertag}\` is currently unranked.`;
    if (csr_data.gamertag === "HFT Intern") {
      description +=
        "\n\nThis is because quantifying my greatness is impossible. You mortals wouldn't understand.";
    }
    rank_embeds.push(
      new EmbedBuilder().setTitle("Unranked").setDescription(description)
    );
  }

  return rank_embeds;
}

module.exports = buildRankEmbeds;
