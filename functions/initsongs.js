async function initsongs() {
    //load json from https://dp4p6x0xfi5o9.cloudfront.net/maimai/data.json
    const fs = require('fs');
    const axios = require('axios');
    const path = './json/mai';
    const url = 'https://otoge-db.net/maimai/data/music-ex.json';
    try {
        console.log('[DEBUG] Starting initsongs function');
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
            console.log('[INFO] Created directory:', path);
        }

        const response = await axios.get(url);
        const data = response.data;

        fs.writeFileSync(`${path}/songlist.json`, JSON.stringify(data, null, 2));
        console.log('[INFO] Data written to songlist.json successfully');
    } catch (error) {
        console.error('Error fetching or writing data:', error.message);
    }

    // filter json to only include songs in category 'maimai'
    let songlistRaw = JSON.parse(fs.readFileSync(`${path}/songlist.json`, 'utf8'));
    // 若 songlistRaw 是物件且有 songs 欄位，則取 songs，否則直接用 songlistRaw
    let songlist = Array.isArray(songlistRaw) ? songlistRaw : (Array.isArray(songlistRaw.songs) ? songlistRaw.songs : []);
    if (!Array.isArray(songlist) || songlist.length === 0) {
        console.warn('[WARN] songlist is not an array or is empty. Check the structure of songlist.json');
    }
    // 只保留 title、artist、bpm 欄位
    const maimaiSongs = songlist.map(song => ({
        title: song.title,
        artist: song.artist,
        bpm: song.bpm
    }));
    const maimaiSongsPath = `${path}/maimaiSongs.json`;
    fs.writeFileSync(maimaiSongsPath, JSON.stringify(maimaiSongs, null, 2));
    console.log('[INFO] Filtered maimai songs written to maimaiSongs.json successfully');

}
module.exports = {
	initsongs: initsongs
}