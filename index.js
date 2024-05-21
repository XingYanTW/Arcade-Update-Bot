const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const moment = require('moment');
const axios = require('axios');

const { getChannelIds } = require('./functions/getChannelIds.js');
const { download } = require('./functions/download.js');




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

/*// Schedule the job to run at the start of every hour
const job = schedule.scheduleJob({ minute: 0, tz: timeZone }, async () => {
	try {
		await main();
	} catch (error) {
		console.error(chalk.red('[ERROR] An unexpected error occurred:'), error.message);
	}

	// Log the next scheduled time
	const nextInvocation = job.nextInvocation();
});*/

// Download the new JSON file
//const newFileName = './new.json';
//const url = 'https://info-maimai.sega.jp/wp-json/thistheme/v1/articlesRest';


// Compare JSON files
async function compareJson() {
	try {
		const oldData = JSON.parse(fs.readFileSync('./old.json'));
		const newData = JSON.parse(fs.readFileSync(`./${newFileName}`));
		
		const newObjects = newData.filter(newObj => 
			!oldData.some(oldObj => JSON.stringify(oldObj.date) === JSON.stringify(newObj.date))
		);
		
		if (newObjects.length > 0) {
			console.log('[INFO] New Objects:', newObjects);
			fs.writeFileSync('newObjects.json', JSON.stringify(newObjects, null, 2));
			fs.renameSync(newFileName, 'old.json');
		} else {
			console.log('[INFO] Same file, Skipping!');
			fs.writeFileSync('newObjects.json', JSON.stringify(newObjects, null, 2));
			fs.renameSync(newFileName, 'old.json');
		}
	} catch (error) {
		console.error('Error comparing JSON files:', error.message);
	}
}

// Load Images
async function LoadImages(channelIds){
	try {
		const data = JSON.parse(fs.readFileSync('./newObjects.json'));
		const imageFolder = 'images';
		fs.mkdirSync(imageFolder, { recursive: true });
		for (const item of data) {
			// Extract year, month, and day from the string
			const myDate = moment(item.date, 'YYYY年 MM月 DD日').toDate();
			const date = moment(myDate).format('YYYY-MM-DD');
			const imageUrl = item.thumbnail;
			const imageFileName = `${imageFolder}/${date}_pop.jpg`;
	
			console.log(`Downloading image from: ${imageUrl}`);
	
			const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
			fs.writeFileSync(imageFileName, imageResponse.data, 'binary');
			console.log(`Downloaded and saved image: ${imageFileName}`);
	
			for (const channelId of channelIds) {
                await postImageToDiscord(imageUrl, item, channelId);
            }
		}
	} catch (err) {
		console.error(err);
	}
	
}

async function postImageToDiscord(imageUrl, item, channelId){
	console.log(channelId);
	const avatarUrl = "https://graph.facebook.com/maimaiDX/picture?type=square";
	const embedMessage = {
        embeds: [
            {
                title: item.title,
                description: item.permalink,
                color: 4571344,
                image: { url: imageUrl },
                author: { name: 'maimai でらっくす', icon_url: avatarUrl },
                footer: { text: `Generated at ${moment().format('YYYY-MM-DD')}` },
                thumbnail: { url: avatarUrl },
            },
        ],
        username: 'maimai でらっくす',
        avatar_url: avatarUrl,
    };

	const channel = client.channels.cache.get(channelId);
    if (!channel) {
        console.error(`Channel with ID ${channelId} not found.`);
        return;
    }

    channel.send(embedMessage).then(() => {
        console.log(`Message sent to channel ID ${channelId}`);
    }).catch(console.error);
}

// Main function
async function main() {
	//await download();
	await download('mai', 'https://info-maimai.sega.jp/wp-json/thistheme/v1/articlesRest')
	await compareJson();
	const channelIds = await getChannelIds();
	console.log(channelIds);
    if (channelIds.length === 0) {
        console.error('No channels found in the database.');
        return;
    }

    await LoadImages(channelIds);
}