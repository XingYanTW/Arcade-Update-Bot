const {SlashCommandBuilder} = require('@discordjs/builders');
const {PermissionsBitField} = require("discord.js");
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delchannel')
        .setDescription('Delete reminder from channel.'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({content: 'You do not have permission to use this command.', ephemeral: true});
        }
        const channelId = interaction.channel.id

        const deleteQuery = `
		DELETE FROM channels WHERE ChannelId = ?;
		`;

        db.run(deleteQuery, [channelId], function (err) {
            if (err) {
                console.error(err.message);
                return interaction.reply({content: 'There was an error while deleting the channel.', ephemeral: true});
            }
            return interaction.reply({content: 'Channel deleted successfully!', ephemeral: true});
        });
    },
};
