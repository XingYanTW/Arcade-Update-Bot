const fs = require('fs');

async function compareJson(folder) {
	try {
		const oldData = JSON.parse(fs.readFileSync(`./${folder}/old.json`));
		const newData = JSON.parse(fs.readFileSync(`./${folder}/new.json`));
		
		const newObjects = newData.filter(newObj => 
			!oldData.some(oldObj => JSON.stringify(oldObj.date) === JSON.stringify(newObj.date))
		);
		
		if (newObjects.length > 0) {
			console.log('[INFO] New Objects:', newObjects);
			fs.writeFileSync(`./${folder}/newObjects.json`, JSON.stringify(newObjects, null, 2));
			fs.renameSync(`./${folder}/new.json`, `./${folder}/old.json`);
		} else {
			console.log('[INFO] Same file, Skipping!');
			fs.writeFileSync(`./${folder}/newObjects.json`, JSON.stringify(newObjects, null, 2));
			fs.renameSync(`./${folder}/new.json`, `./${folder}/old.json`);
		}
	} catch (error) {
		console.error('Error comparing JSON files:', error.message);
	}
}

module.exports = {
    compareJson: compareJson
}