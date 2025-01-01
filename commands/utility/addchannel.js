const { SlashCommandBuilder } = require('@discordjs/builders')
const { PermissionsBitField } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addchannel')
		.setDescription('Add remider to channel.')
		.addBooleanOption(option =>
			option.setName('maimai')
				.setDescription('Maimai flag')
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('maimaiintl')
				.setDescription('Maimai International flag')
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('chunithm')
				.setDescription('Chunithm flag')
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('chunithmintl')
				.setDescription('Chunithm International flag')
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('ongeki')
				.setDescription('Ongeki flag')
				.setRequired(true)),
	async execute(interaction) {
		if(!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
			return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
		}
		const channelId = interaction.channelId;
		const maimai = interaction.options.getBoolean('maimai');
		const maimaiintl = interaction.options.getBoolean('maimaiintl');
		const chunithm = interaction.options.getBoolean('chunithm');
		const chunithmintl = interaction.options.getBoolean('chunithmintl');
		const ongeki = interaction.options.getBoolean('ongeki');

		const insertQuery = `
		INSERT INTO channels (ChannelId, Maimai, Maimaiintl, Chunithm, Chunithmintl, ongeki) 
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(ChannelId) DO UPDATE SET
		  Maimai=excluded.Maimai,
		  Maimaiintl=excluded.Maimaiintl,
		  Chunithm=excluded.Chunithm,
		  Chunithmintl=excluded.Chunithmintl,
		  ongeki=excluded.ongeki;
		`;

		db.run(insertQuery, [channelId, maimai, maimaiintl, chunithm, chunithmintl, ongeki], function (err) {
			if (err) {
				console.error(err.message);
				return interaction.reply({ content: 'There was an error while adding the channel.', ephemeral: true });
			}
			return interaction.reply({ content: 'Channel added successfully!', ephemeral: true });
		});
	},
};