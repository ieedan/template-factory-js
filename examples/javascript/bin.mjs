#!/usr/bin/env node
import { create } from 'template-factory';
import fs from 'fs-extra';

const main = async () => {
	const { version, name } = JSON.parse(
		fs.readFileSync(new URL('package.json', import.meta.url), 'utf-8')
	);

	await create({
		appName: name,
		version: version,
		templates: [
			{
				name: 'Notes',
				flag: 'notes',
				path: new URL('templates/notes', import.meta.url).pathname.slice(1),
			},
		],
	});
};

main();
