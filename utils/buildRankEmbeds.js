const { EmbedBuilder } = require("discord.js");

function buildRankEmbeds(csr_data) {
  const rankEmbeds = [];
  console.log(`Now running function "buildRankEmbeds"`)
  // console.log(`About to log value of csr_data that was passed into the function:`)
  // console.log(csr_data)


  for (let playlist of csr_data.playlists) {
    const current_csr = playlist.current.csr;
    if (current_csr !== -1) {
      const currentTierDescription = playlist.current.tierDescription;
      const imageName = currentTierDescription.replace(' ', '-').toLowerCase();
      const rankEmbed = new EmbedBuilder()
        .setTitle(playlist.playlistName)
        .setThumbnail(`https://api.halofuntime.com/static/csr_images/${imageName}.png`)
        .addFields({
          name: `${currentTierDescription} (${current_csr})`,
          value: `**GT:** \`${csr_data.gamertag}\``,
        })
        .setTimestamp()
        .setFooter({ text: 'Current CSR' });
      rankEmbeds.push(rankEmbed);
    }
  }
  if (rankEmbeds.length === 0) {
      let description = `\`${csr_data.gamertag}\` is currently unranked.`;
      if (csr_data.gamertag === "HFT Intern") {
        description +=
          "\n\nThis is because quantifying my greatness is impossible. You mortals wouldn't understand.";
      }
      rankEmbeds.push(
        new EmbedBuilder().setTitle("Unranked").setDescription(description)
      );
    }

    return rankEmbeds;

  }
  
  module.exports = buildRankEmbeds;