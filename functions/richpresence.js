async function richpresence(client) {
    const presence = client.user.presence;
    const fs = require('fs');
    const path = './json/mai/maimaiSongs.json';
    if (!fs.existsSync(path)) {
        console.error('[ERROR] maimaiSongs.json not found. Please run initsongs function first.');
        return;
    }
    const maimaiSongs = JSON.parse(fs.readFileSync(path, 'utf8'));
    const song = maimaiSongs[Math.floor(Math.random() * maimaiSongs.length)];
    if (!song) {
        console.error('[ERROR] No songs found in maimaiSongs.json');
        return;
    }
    // 僅使用原始圖片 URL
    presence.activities = [{
        name: song.title,
        type: 0, // 0 for Playing
        details: `by ${song.artist}`,
        state: `BPM: ${song.bpm}`,
    }];
    presence.status = 'online';
    console.log(`[INFO] Rich presence set to: ${song.title} by ${song.artist} (BPM: ${song.bpm})`);
    client.user.setPresence(presence);
}


module.exports = {
    richpresence : richpresence
}