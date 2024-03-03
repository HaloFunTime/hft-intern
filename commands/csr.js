const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const { getApplicationCommandMention } = require("../utils/formatting");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("csr")
    .setDescription("Check a player's CSR")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("gamertag")
        .setDescription("Get CSR for an Xbox Live gamertag")
        .addStringOption((option) =>
          option
            .setName("gamertag")
            .setDescription("A valid Xbox Live gamertag")
            .setMaxLength(15)
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName("quiet")
            .setDescription("Should I post the result quietly?")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("member")
        .setDescription("Get CSR for a Discord member")
        .addUserOption((option) =>
          option
            .setName("member")
            .setDescription("A member of HaloFunTime")
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName("quiet")
            .setDescription("Should I post the result quietly?")
            .setRequired(false)
        )
    ),
  async execute(interaction) {
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const quiet = interaction.options.getBoolean("quiet") ?? false;
    let gamertag = interaction.options.getString("gamertag");
    if (!gamertag) {
      const member = interaction.options.getUser("member");
      const response = await axios
        .get(
          `${HALOFUNTIME_API_URL}/link/discord-to-xbox-live?discordId=${
            member.id
          }&discordUsername=${encodeURIComponent(member.username)}`,
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
      if ("error" in response) {
        const linkGamertagMention = await getApplicationCommandMention(
          "link-gamertag",
          interaction.client
        );
        // Send a reply that potentially pings the member if they haven't linked a gamertag
        await interaction.reply({
          content:
            `<@${member.id}> hasn't linked a gamertag on HaloFunTime. ` +
            `They can use ${linkGamertagMention} at any time to do so.`,
          allowedMentions: { users: [member.id] },
          ephemeral: quiet,
        });
      } else {
        gamertag = response.xboxLiveGamertag;
      }
    }
    const response = await axios
      .get(
        `${HALOFUNTIME_API_URL}/halo-infinite/csr?gamertag=${encodeURIComponent(
          gamertag
        )}`,
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
    if ("error" in response) {
      if (response.error.details?.detail) {
        await interaction.reply({
          content: response.error.details.detail,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `An unknown error occurred while attempting to fetch CSR data for \`${gamertag}\`.`,
          ephemeral: true,
        });
      }
    } else {
      const rankEmbeds = [];
      for (let playlist of response.playlists) {
        const currentCSR = playlist.current.csr;
        // Only build an embed if the player has valid rank data
        if (currentCSR !== -1) {
          const currentTierDescription = playlist.current.tierDescription;
          // Build the image name
          const imageName = currentTierDescription
            .replace(" ", "-")
            .toLowerCase();
          const rankEmbed = new EmbedBuilder()
            .setTitle(playlist.playlistName)
            .setThumbnail(
              `https://api.halofuntime.com/static/csr_images/${imageName}.png`
            )
            .addFields({
              name: `${currentTierDescription} (${currentCSR})`,
              value: "**GT:** `" + response.gamertag + "`",
            })
            .setTimestamp()
            .setFooter({
              text: "Current CSR",
            });
          rankEmbeds.push(rankEmbed);
        }
      }
      if (rankEmbeds.length === 0) {
        let description = `\`${response.gamertag}\` is currently unranked.`;
        if (response.gamertag === "HFT Intern") {
          description +=
            "\n\nThis is because quantifying my greatness is impossible.\nYou mortals wouldn't understand.";
        }
        rankEmbeds.push(
          new EmbedBuilder().setTitle("Unranked").setDescription(description)
        );
      }
      await interaction.reply({
        embeds: rankEmbeds,
        ephemeral: quiet,
      });
    }
  },
};
