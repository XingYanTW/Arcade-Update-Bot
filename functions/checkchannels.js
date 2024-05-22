const {getChannelIds} = require("./getChannelIds");
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

/**
 * Check the channels that the bot is in and log them to the console.
 * @param {Client} client The Discord client object.
 */

async function checkchannels(client) {
    getChannelIds().then(channelIds => {
        channelIds.forEach(channelId => {
            console.log(`Checking channel ${channelId}`);
            console.log(client.guilds.cache.map(guild => guild.channels.cache.get(channelId)));
            //if channel is not found, log it
            if (!client.guilds.cache.map(guild => guild.channels.cache.get(channelId)).some(channel => channel)) {
                console.log(`Channel ${channelId} not found.`);
                const deleteQuery = `DELETE FROM channels WHERE ChannelId = ?;`;

                db.run(deleteQuery, [channelId], function (err) {
                    if (err) {
                        console.error(err.message);
                        console.log('There was an error while deleting the channel.');
                    }
                    console.log('Channel deleted successfully!');
                });
            }
        });
    });
}

module.exports = {
    checkchannels: checkchannels
}