const fs = require('fs');

async function compareJson(folder) {
	try {
		console.log(`[DEBUG] Starting compareJson with folder: ${folder}`);

		//if old.json doesn't exist, rename new.json to old.json
		if (!fs.existsSync(`./json/${folder}/old.json`)) {
			console.log('[DEBUG] old.json does not exist');
			fs.renameSync(`./json/${folder}/new.json`, `./json/${folder}/old.json`);
			console.log('[INFO] old.json not found, new.json renamed to old.json');
			return;
		}

		console.log('[DEBUG] old.json exists, reading files');
		const oldData = JSON.parse(fs.readFileSync(`./json/${folder}/old.json`));
		const newData = JSON.parse(fs.readFileSync(`./json/${folder}/new.json`));

		console.log('[DEBUG] Files read successfully');
		//console.log('[DEBUG] oldData (first 5 items):', oldData.slice(0, 5));
		//console.log('[DEBUG] newData (first 5 items):', newData.slice(0, 5));

		//get new objects from newData that are not in oldData
		const newObjects = getNewData(oldData, newData);

		//console.log('[DEBUG] newObjects:', newObjects);

		if (newObjects.length > 0) {
			console.log('[INFO] New Objects found:', newObjects);
			fs.writeFileSync(`./json/${folder}/newObjects.json`, JSON.stringify(newObjects, null, 2));
			fs.renameSync(`./json/${folder}/new.json`, `./json/${folder}/old.json`);
		} else {
			console.log('[INFO] No new objects found, skipping!');
			fs.writeFileSync(`./json/${folder}/newObjects.json`, JSON.stringify(newObjects, null, 2));
			fs.removeSync(`./json/${folder}/new.json`);
			//fs.renameSync(`./json/${folder}/new.json`, `./json/${folder}/old.json`);
		}
	} catch (error) {
		console.error('Error comparing JSON files:', error.message);
	}
}

function getNewData(oldData, newData) {
	const oldDataSet = new Set(oldData.map(item => JSON.stringify(item)));
	return newData.filter(item => !oldDataSet.has(JSON.stringify(item)));
  }

module.exports = {
	compareJson: compareJson
}