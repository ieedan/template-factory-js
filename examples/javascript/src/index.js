import { create, util } from 'template-factory';
import fs from 'fs-extra';

const main = async () => {
	const { version, name } = JSON.parse(
		fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
	);

	await create({
		appName: name,
		version: version,
		templates: [
			{
				name: 'Notes',
				flag: 'notes',
				path: util.relative('../templates/notes', import.meta.url),
				excludeFiles: ["template-files"]
			},
		],
	});
};

main();