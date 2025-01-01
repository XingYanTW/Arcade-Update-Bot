const { getChannelIds } = require('../functions/getChannelIds.js');
const { download } = require('../functions/download.js');
const { compareJson } = require('../functions/compareJson.js');
const { getChannelSettings } = require('../functions/database.js')
const moment = require('moment');
const axios = require('axios');
const fs = require('fs');


// Load Images
async function LoadImages(channelIds, client) {
	try {
		//check if the newObjects.json file exists
		if (!fs.existsSync('./json/chuintl/newObjects.json')) {
			console.log('[INFO] newObjects.json not found, skipping!');
			return;
		}
		const data = JSON.parse(fs.readFileSync('./json/chuintl/newObjects.json'));
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
			//fs.writeFileSync(imageFileName, imageResponse.data, 'binary');
			console.log(`Downloaded and saved image: ${imageFileName}`);

			for (const channelId of channelIds) {
				try {
					const settings = await getChannelSettings(channelId);
					if (settings && settings.Chunithmintl) {
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
	const avatarUrl = "https://pbs.twimg.com/profile_images/1735059307195256832/6YSNiEle_400x400.jpg";
	const embedMessage = {
		embeds: [
			{
				title: item.title,
				description: item.permalink,
				color: 0xff2269,
				image: { url: imageUrl },
				author: { name: 'CHUNITHM チュウニズム', icon_url: avatarUrl },
                footer: { text: `Generated at ${moment().format('YYYY-MM-DD')}` },
                thumbnail: { url: 'https://chunithm.sega.com/assets/img/top/kv_logo.png' },
			},
		],
		username: 'CHUNITHM チュウニズム',
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

async function chuintl(client){
    await download('chuintl', 'https://info-chunithm.sega.com/wp-json/thistheme/v1/articlesRest')
	await compareJson('chuintl');
	const channelIds = await getChannelIds();
	console.log(channelIds);
	if (channelIds.length === 0) {
		console.error('No channels found in the database.');
		return;
	}
	await LoadImages(channelIds, client);
}

module.exports = {
    chuintl: chuintl
}
