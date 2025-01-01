const fs = require('fs');
const fetch = require('node-fetch');

async function download(folder, url) {
    try {
        console.log(`[DEBUG] Starting download with folder: ${folder}, url: ${url}`);
        fs.mkdirSync('./json/'+folder, { recursive: true });
        console.log(`[DEBUG] Folder ${folder} created or already exists`);
        const response = await fetch(url);
        console.log(`[DEBUG] Fetch response status: ${response.status}`);
        const json = await response.json();
        console.log(`[DEBUG] JSON data fetched successfully`);
        fs.writeFileSync(`./json/${folder}/new.json`, JSON.stringify(json, null, 2));
        console.log(`[INFO] Downloaded and saved ./json/${folder}/new.json`);
    } catch (error) {
        console.error('[ERROR] Error downloading the file:', error.message);
    }
}

module.exports = {
    download: download
}