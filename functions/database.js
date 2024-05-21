// utils/database.js
const sqlite3 = require('sqlite3').verbose();

// Helper function to get channel settings
function getChannelSettings(channelId) {
    const db = new sqlite3.Database('database.db');
    return new Promise(function(resolve, reject) {
        const query = 'SELECT * FROM channels WHERE ChannelId = ?';
        db.get(query, [channelId], function(err, row) {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Export functions
module.exports = {
    getChannelSettings: getChannelSettings
};