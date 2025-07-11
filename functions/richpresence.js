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

    const title = song.title || 'Unknown';
    const artist = song.artist || 'Unknown';
    const bpm = song.bpm || 'Unknown';

    const Youtube = require('youtube-search-api');
    const ytdl = require('ytdl-core');
    let videoLength = '';
    try {
        const query = `maimai 譜面確認用 外部出力 ${title}`;
        const results = await Youtube.GetListByKeyword(query, false, 1);
        if (results && results.items && results.items.length > 0) {
            const videoId = results.items[0].id;
            if (videoId) {
                const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                try {
                    const info = await ytdl.getInfo(videoUrl);
                    const seconds = parseInt(info.videoDetails.lengthSeconds, 10);
                    const min = Math.floor(seconds / 60);
                    const sec = seconds % 60;
                    const minStr = min.toString().padStart(2, '0');
                    const secStr = sec.toString().padStart(2, '0');
                    videoLength = `${minStr}:${secStr}`;
                } catch (err) {
                    // 若 ytdl-core 失敗，改用 Youtube Search API 回傳的長度欄位
                    if (results.items[0].length && typeof results.items[0].length === 'string') {
                        videoLength = results.items[0].length;
                    } else if (results.items[0].length && results.items[0].length.simpleText) {
                        videoLength = results.items[0].length.simpleText;
                    } else {
                        videoLength = 'Unknown';
                    }
                }
            }
        }
    } catch (err) {
        console.warn('[WARN] Youtube search or fetch failed:', err.message);
    }
    if (videoLength && videoLength !== 'Unknown' && videoLength.includes(':')) {
        const parts = videoLength.split(':');
        if (parts.length === 2) {
            const minStr = parts[0].toString().padStart(2, '0');
            const secStr = parts[1].toString().padStart(2, '0');
            videoLength = `${minStr}:${secStr}`;
        }
    }
    let seconds = 0;
    let min = 0;
    let sec = 0;
    let totalSeconds = 0;
    if (videoLength && videoLength !== 'Unknown' && videoLength.includes(':')) {
        const parts = videoLength.split(':');
        if (parts.length === 2) {
            min = parseInt(parts[0], 10);
            sec = parseInt(parts[1], 10);
            totalSeconds = min * 60 + sec;
        }
    }
    let currentSeconds = 0;
    if (totalSeconds > 0) {
        currentSeconds = Math.floor(Math.random() * totalSeconds);
    }
    const currentMin = Math.floor(currentSeconds / 60);
    const currentSec = currentSeconds % 60;
    const currentTime = `${currentMin.toString().padStart(2, '0')}:${currentSec.toString().padStart(2, '0')}`;
    let bar = '';
    if (totalSeconds > 0) {
        const barLength = 26;
        const pos = Math.floor((currentSeconds / totalSeconds) * barLength);
        for (let i = 0; i < barLength; i++) {
            if (i === pos) {
                bar += '◉';
            } else {
                bar += '━';
            }
        }
    } else {
        bar = '━━━━━━━━━━◉━━━━━━━━━━';
    }
    // Rich Presence 樣式
    let detailsStr = `${currentTime} ${bar} ${videoLength || '??:??'}`;
    if (detailsStr.length > 128) {
        detailsStr = detailsStr.slice(0, 128);
        console.warn('[WARN] details 欄位超過 128 字元，已截斷');
    }
    const maxStateLength = 64; 
    let stateStr = detailsStr;
    if (stateStr.length < maxStateLength) {
        const totalPad = maxStateLength - stateStr.length;
        const leftPad = Math.floor(totalPad / 2);
        const rightPad = totalPad - leftPad;
        stateStr = ' '.repeat(leftPad) + stateStr + ' '.repeat(rightPad);
    }
    client.user.setPresence({
        activities: [{
            name: `🎵 ${title} — ${artist}`,
            type: 2,
            state: stateStr,
        }],
        status: 'online',
    });
    console.log(`[INFO] Rich presence set to: ${title} by ${artist} (${currentTime}/${videoLength || '??:??'})`);


    // 動態進度條：每秒更新一次
    if (totalSeconds > 0) {
        let elapsed = 0;
        const barLength = 26;
        const updateBar = () => {
            const currentMin = Math.floor(elapsed / 60);
            const currentSec = elapsed % 60;
            const currentTime = `${currentMin.toString().padStart(2, '0')}:${currentSec.toString().padStart(2, '0')}`;
            let bar = '';
            const pos = Math.floor((elapsed / totalSeconds) * barLength);
            for (let i = 0; i < barLength; i++) {
                if (i === pos) {
                    bar += '◉';
                } else {
                    bar += '━';
                }
            }
            let detailsStr = `${currentTime} ${bar} ${videoLength || '??:??'}`;
            if (detailsStr.length > 128) {
                detailsStr = detailsStr.slice(0, 128);
            }
            const maxStateLength = 64;
            let stateStr = detailsStr;
            if (stateStr.length < maxStateLength) {
                const totalPad = maxStateLength - stateStr.length;
                const leftPad = Math.floor(totalPad / 2);
                const rightPad = totalPad - leftPad;
                stateStr = ' '.repeat(leftPad) + stateStr + ' '.repeat(rightPad);
            }
            client.user.setPresence({
                activities: [{
                    name: `🎵 ${title} — ${artist}`,
                    type: 2,
                    state: stateStr,
                }],
                status: 'online',
            });
            if (elapsed < totalSeconds) {
                setTimeout(() => {
                    elapsed++;
                    updateBar();
                }, 1000);
            } else {
                // 歌曲播完自動換下一首
                richpresence(client);
            }
        };
        updateBar();
    } else {
        // 無法取得長度時只顯示一次
        let detailsStr = `00:00 ━━━━━━━━━━◉━━━━━━━━━━ ${videoLength || '??:??'}`;
        if (detailsStr.length > 128) {
            detailsStr = detailsStr.slice(0, 128);
        }
        const maxStateLength = 64;
        let stateStr = detailsStr;
        if (stateStr.length < maxStateLength) {
            const totalPad = maxStateLength - stateStr.length;
            const leftPad = Math.floor(totalPad / 2);
            const rightPad = totalPad - leftPad;
            stateStr = ' '.repeat(leftPad) + stateStr + ' '.repeat(rightPad);
        }
        client.user.setPresence({
            activities: [{
                name: `🎵 ${title} — ${artist}`,
                type: 2,
                state: stateStr,
            }],
            status: 'online',
        });
        console.warn('[WARN] Video length is unknown, rich presence will not auto-update');
    }
}


module.exports = {
    richpresence : richpresence
}