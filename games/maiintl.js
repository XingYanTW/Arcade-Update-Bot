const { getChannelIds } = require('../functions/getChannelIds.js');
const { download } = require('../functions/download.js');
const { compareJson } = require('../functions/compareJson');
const { getChannelSettings } = require('../functions/database.js')
const moment = require('moment');
const axios = require('axios');
const fs = require('fs');


// Load Images
async function LoadImages(channelIds, client) {
	try {
		if (!fs.existsSync('./json/maiintl/newObjects.json')) {
			console.log('[INFO] newObjects.json not found, skipping!');
			return;
		}
		const data = JSON.parse(fs.readFileSync('./json/maiintl/newObjects.json'));
		const imageFolder = 'images';
		fs.mkdirSync(imageFolder, { recursive: true });
		for (const item of data) {
			//Change data month to 2 digits
			if (item.date[1] < 10) {
				item.date[1] = '0' + item.date[1];
			}
			//Change data day to 2 digits
			if (item.date[2] < 10) {
				item.date[2] = '0' + item.date[2];
			}
			const date = item.date.join('-');
			const imageUrl = `https://maimai.sega.com/assets/img/download/pop/download/${date}/pop.jpg`;
			const imageFileName = `${imageFolder}/${date}_pop.jpg`;

			console.log(`Downloading image from: ${imageUrl}`);

			const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
			//fs.writeFileSync(imageFileName, imageResponse.data, 'binary');
			console.log(`Downloaded and saved image: ${imageFileName}`);

			for (const channelId of channelIds) {
				try {
					const settings = await getChannelSettings(channelId);
					if (settings && settings.Maimaiintl) {
						await postImageToDiscord(imageUrl, item, channelId, client);
					} else {
					}
				} catch (err) {
					console.error('Error fetching channel settings:', err);
				}
			}
		}
	} catch (err) {
		console.error(err);
	}

}

async function postImageToDiscord(imageUrl, item, channelId, client) {
	console.log(channelId);
	const avatarUrl = "https://graph.facebook.com/maimaiDX/picture?type=square";
	const embedMessage = {
		embeds: [
			{
				title: item.title,
				color: 4571344,
				image: { url: imageUrl },
				author: { name: 'maimai でらっくす', icon_url: avatarUrl },
				footer: { text: `Generated at ${moment().format('YYYY-MM-DD')}` },
				thumbnail: { url: 'https://maimai.sega.com/assets/img/buddeis/top/kv_logo.png' },
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

async function maiintl(client) {
	await download('maiintl', 'https://maimai.sega.com/assets/data/index.json')
	await compareJson('maiintl');
	const channelIds = await getChannelIds();
	console.log(channelIds);
	if (channelIds.length === 0) {
		console.error('No channels found in the database.');
		return;
	}
	await LoadImages(channelIds, client);
}

module.exports = {
	maiintl: maiintl
}
