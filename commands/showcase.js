const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("showcase")
    .setDescription("View someone's file Showcase")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("The member whose Showcase you'd like to view")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("quiet")
        .setDescription("Should I post the result quietly?")
        .setRequired(true)
    ),
  async execute(interaction) {
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const member = interaction.options.getUser("member");
    const quiet = interaction.options.getBoolean("quiet");
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/showcase/check-showcase`,
        {
          discordUserId: member.id,
          discordUsername: member.username,
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
    if ("error" in response) {
      await interaction.reply({
        content: `We couldn't check <@${member.id}>'s Showcase at this time. Sorry about that.`,
        ephemeral: true,
      });
    } else {
      function mapEmbed(mapFile) {
        return new EmbedBuilder()
          .setTitle("Map: " + mapFile.name)
          .setURL(mapFile.waypointURL)
          .setDescription(`*${mapFile.description}*`)
          .setThumbnail(mapFile.thumbnailURL)
          .addFields(
            {
              name: "Total Plays",
              value: `${mapFile.plays}`,
              inline: true,
            },
            {
              name: "Bookmarks",
              value: `${mapFile.favorites}`,
              inline: true,
            },
            {
              name: "Rating Info",
              value: `${
                Math.round(
                  (Number(mapFile.averageRating) + Number.EPSILON) * 1000
                ) / 1000
              }/5 (${mapFile.ratings} ratings)`,
              inline: true,
            }
          );
      }
      function modeEmbed(modeFile) {
        return new EmbedBuilder()
          .setTitle("Mode: " + modeFile.name)
          .setURL(modeFile.waypointURL)
          .setDescription(`*${modeFile.description}*`)
          .setThumbnail(modeFile.thumbnailURL)
          .addFields(
            {
              name: "Total Plays",
              value: `${modeFile.plays}`,
              inline: true,
            },
            {
              name: "Bookmarks",
              value: `${modeFile.favorites}`,
              inline: true,
            },
            {
              name: "Rating Info",
              value: `${
                Math.round(
                  (Number(modeFile.averageRating) + Number.EPSILON) * 1000
                ) / 1000
              }/5 (${modeFile.ratings} ratings)`,
              inline: true,
            }
          );
      }
      function prefabEmbed(prefabFile) {
        return new EmbedBuilder()
          .setTitle("Prefab: " + prefabFile.name)
          .setURL(prefabFile.waypointURL)
          .setDescription(`*${prefabFile.description}*`)
          .setThumbnail(prefabFile.thumbnailURL)
          .addFields(
            {
              name: "Bookmarks",
              value: `${prefabFile.favorites}`,
              inline: true,
            },
            {
              name: "Rating Info",
              value: `${
                Math.round(
                  (Number(prefabFile.averageRating) + Number.EPSILON) * 1000
                ) / 1000
              }/5 (${prefabFile.ratings} ratings)`,
              inline: true,
            }
          );
      }
      if (response.showcaseFiles.length > 0) {
        // Build embeds
        const allEmbeds = [];
        allEmbeds.push(
          new EmbedBuilder()
            .setTitle(`Halo Infinite Showcase for ${member.username}`)
            .setDescription(
              `See something you like? Let <@${member.id}> know!\n\n` +
                "Add files to your Showcase with the `/showcase-add` command."
            )
            .setThumbnail("https://api.halofuntime.com/static/HFTLogo.png")
        );
        for (let i = 0; i < response.showcaseFiles.length; i++) {
          const showcaseFile = response.showcaseFiles[i];
          if (showcaseFile.fileType === "map") {
            allEmbeds.push(mapEmbed(showcaseFile));
          } else if (showcaseFile.fileType === "mode") {
            allEmbeds.push(modeEmbed(showcaseFile));
          } else if (showcaseFile.fileType === "prefab") {
            allEmbeds.push(prefabEmbed(showcaseFile));
          }
        }
        await interaction.reply({
          allowedMentions: { parse: [] },
          embeds: allEmbeds,
          ephemeral: quiet,
        });
      } else {
        await interaction.reply({
          allowedMentions: { users: [member.id] },
          content: `<@${member.id}> hasn't added any files to their Showcase. They can do so at any time with the \`/showcase-add\` command.`,
          ephemeral: quiet,
        });
      }
    }
  },
};
