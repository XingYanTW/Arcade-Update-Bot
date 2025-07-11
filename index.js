const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const schedule  = require('node-schedule')


const { maimai } = require('./games/maimai.js');
const { maiintl } = require('./games/maiintl.js');
const { chunithm } = require('./games/chunithm.js');
const { chuintl } = require('./games/chuintl.js');
const { ongeki } = require('./games/ongeki.js');
const { checkchannels } = require('./functions/checkchannels.js');
const { initsongs } = require('./functions/initsongs.js');
const { richpresence } = require('./functions/richpresence.js');

dotenv.config();

const token = process.env.BOTTOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	main();
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isAutocomplete()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error(error);
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.login(token);

// Connect to SQLite database (it will create the database file if it doesn't exist)
const db = new sqlite3.Database('database.db', (err) => {
	if (err) {
		return console.error(err.message);
	}
	console.log('Connected to the SQLite database.');
});

// Create table if it does not exist
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS channels (
	ChannelId TEXT PRIMARY KEY,
	Maimai BOOLEAN NOT NULL CHECK (Maimai IN (0, 1)),
	Maimaiintl BOOLEAN NOT NULL CHECK (Maimaiintl IN (0, 1)),
	Chunithm BOOLEAN NOT NULL CHECK (Chunithm IN (0, 1)),
	Chunithmintl BOOLEAN NOT NULL CHECK (Chunithmintl IN (0, 1)),
	ongeki BOOLEAN NOT NULL CHECK (ongeki IN (0, 1))
  );
  `;

db.run(createTableQuery, (err) => {
	if (err) {
		return console.error(err.message);
	}
	console.log('Table created or already exists.');
});

// Close the database connection
db.close((err) => {
	if (err) {
		return console.error(err.message);
	}
	console.log('Closed the database connection.');
});



// Main function
async function main() {
	await initsongs();
	//await richpresence(client);
	//await download();
	/*await checkchannels(client);
	await maimai(client);
	await chunithm(client);
	await chuintl(client);
	await maiintl(client);
	await ongeki(client);*/
	console.log('Current Time:' + new Date);
	console.log('Next Scheduled Time:' + sche.nextInvocation());
}

var taskFreq = '*/30 * * * *'

var sche = schedule.scheduleJob(taskFreq, () => {
	main();
})