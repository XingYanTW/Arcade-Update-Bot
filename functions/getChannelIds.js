const sqlite3 = require('sqlite3');

// Fetch channel IDs from the database
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
    getChannelIds: getChannelIds
};
