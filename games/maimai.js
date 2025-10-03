const { getChannelIds } = require('../functions/getChannelIds.js');
const { download } = require('../functions/download.js');
const { compareJson } = require('../functions/compareJson');
const { getChannelSettings } = require('../functions/database.js')
const moment = require('moment');
const axios = require('axios');
const fs = require('fs');
const { ButtonBuilder, ButtonStyle } = require('discord.js');

// Load Images
async function LoadImages(channelIds, client) {
    try {
        if (!fs.existsSync('./json/mai/newObjects.json')) {
            console.log('[INFO] newObjects.json not found, skipping!');
            return;
        }
        const data = JSON.parse(fs.readFileSync('./json/mai/newObjects.json'));
        const imageFolder = 'images';
        fs.mkdirSync(imageFolder, { recursive: true });
        for (const item of data) {
            // Extract year, month, and day from the string
            const myDate = moment(item.date, 'YYYY年 MM月 DD日').toDate();
            const date = moment(myDate).format('YYYY-MM-DD');
            const imageUrl = item.thumbnail;
            const imageFileName = `${imageFolder}/${date}_pop.jpg`;

            console.log(`[DEBUG] Downloading image from: ${imageUrl}`);

            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            //fs.writeFileSync(imageFileName, imageResponse.data, 'binary');
            console.log(`[DEBUG] Downloaded and saved image: ${imageFileName}`);

            for (const channelId of channelIds) {
                try {
                    const settings = await getChannelSettings(channelId);
                    console.log(`[DEBUG] Channel ID: ${channelId}, Settings: ${JSON.stringify(settings)}`);
                    if (settings && settings.Maimai) {
                        await postImageToDiscord(imageUrl, item, channelId, client);
                    } else {
                        console.log(`[DEBUG] Maimai setting not enabled for channel ID: ${channelId}`);
                    }
                } catch (err) {
                    console.error('[ERROR] Error fetching channel settings:', err);
                }
            }
        }
    } catch (err) {
        console.error('[ERROR]', err);
    }
}

async function postImageToDiscord(imageUrl, item, channelId, client) {
    console.log(`[DEBUG] Posting image to Discord, Channel ID: ${channelId}`);
    const avatarUrl = "https://www.google.com/s2/favicons?sz=64&domain=maimai.sega.jp";
    const embedMessage = {
        embeds: [
            {
                title: item.title,
                //description: item.permalink,
                color: 4571344,
                image: { url: imageUrl },
                author: { name: 'maimai でらっくす', icon_url: avatarUrl },
                footer: { text: `${moment().format('YYYY-MM-DD')}` },
				thumbnail: { url: 'https://maimai.sega.jp/storage/root/logo.png' },
			},
        ],
        username: 'maimai でらっくす',
        avatar_url: avatarUrl,
    };

    const button = new ButtonBuilder()
        .setLabel('閱讀更多')
        .setURL(item.permalink)
        .setStyle(ButtonStyle.Link);
    embedMessage.components = [{ type: 1, components: [button] }];

    const channel = client.channels.cache.get(channelId);
    if (!channel) {
        console.error(`[ERROR] Channel with ID ${channelId} not found.`);
        return;
    }

    channel.send(embedMessage).then(() => {
        console.log(`[INFO] Message sent to channel ID ${channelId}`);
    }).catch(console.error);
}

async function maimai(client) {
    console.log('[DEBUG] Starting maimai function');
    await download('mai', 'https://info-maimai.sega.jp/wp-json/thistheme/v1/articlesRest');
    console.log('[DEBUG] Download completed');
    await compareJson('mai');
    console.log('[DEBUG] JSON comparison completed');
    const channelIds = await getChannelIds();
    console.log('[DEBUG] Channel IDs:', channelIds);
    if (channelIds.length === 0) {
        console.error('[ERROR] No channels found in the database.');
        return;
    }
    await LoadImages(channelIds, client);
    console.log('[DEBUG] LoadImages completed');
}

module.exports = {
    maimai: maimai
}