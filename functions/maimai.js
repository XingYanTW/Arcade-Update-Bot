const fs = require('fs');
const axios = require('axios');
const moment = require('moment');
const sqlite3 = require('sqlite3').verbose();

const newFileName = './new.json';
const url = 'https://info-maimai.sega.jp/wp-json/thistheme/v1/articlesRest';

async function download() {
	try {
		const response = await fetch(url);
		const json = await response.json();
		fs.writeFileSync(newFileName, JSON.stringify(json, null, 2));
		console.log(chalk.green(`Downloaded and saved ${newFileName}`));
	} catch (error) {
		console.error('Error downloading the file:', error.message);
	}
}

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

async function LoadImages(channelIds, postImageToDiscord) {
	try {
		const data = JSON.parse(fs.readFileSync('./newObjects.json'));
		const imageFolder = 'images';
		fs.mkdirSync(imageFolder, { recursive: true });
		for (const item of data) {
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

async function postImageToDiscord(imageUrl, item, channelId, client) {
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

async function getChannelIds() {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database('database.db');
		const query = `SELECT ChannelId FROM channels`;

		db.all(query, [], (err, rows) => {
			if (err) {
				reject(err);
			} else {
				const channelIds = rows.map(row => BigInt(row.ChannelId).toString());
				resolve(channelIds);
			}
			db.close();
		});
	});
}

module.exports = {
	download,
	compareJson,
	LoadImages,
	postImageToDiscord,
	getChannelIds
};
