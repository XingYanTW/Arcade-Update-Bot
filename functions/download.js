const fs = require('fs');
const fetch = require('node-fetch');

async function download(folder, url) {
	try {
        fs.mkdirSync(folder, { recursive: true });
		const response = await fetch(url);
		const json = await response.json();
		fs.writeFileSync(`./${folder}/new.json`, JSON.stringify(json, null, 2));
		console.log(`Downloaded and saved ./${folder}/new.json`);
	} catch (error) {
		console.error('Error downloading the file:', error.message);
	}
}

module.exports = {
    download: download
}