import { execa, ExecaError } from 'execa';
import fs from 'fs-extra';
import path from 'node:path';

/** Removes package(s) from package.json without creating `node_modules`
 *
 * @param dir The directory containing the `package.json` to be modified
 * @param packages The packages to be removed
 */
const removeDependencies = async (dir: string, ...packages: string[]) => {
	const file = path.join(dir, 'package.json');

	const packageJsonFile = JSON.parse((await fs.readFile(file)).toString());

	for (const pack of packages) {
		packageJsonFile.devDependencies[pack] = undefined;
		packageJsonFile.dependencies[pack] = undefined;
	}

	const newFile = JSON.stringify(packageJsonFile, null, 2);

	await fs.writeFile(file, newFile);
};

/** Adds package(s) to package.json without creating `node_modules`
 *
 * @param scope Dev dependencies or regular dependencies
 * @param pm Package manager to use
 * @param dir The directory containing the `package.json` to be modified
 * @param packages The packages to be added
 */
const addDependencies = async (
	scope: 'dev' | 'regular',
	{ pm, dir }: { pm: string; dir: string },
	...packages: string[]
) => {
	const flags = [
		scope == 'dev' ? '--save-dev' : '--save',
		'--package-lock-only',
		'--no-package-lock',
	];

	try {
		await execa(pm, ['install', ...flags, ...packages], {
			cwd: dir,
		});
	} catch (error) {
		if (error instanceof ExecaError) {
			console.error(error);
		}
	}
};

export { addDependencies, removeDependencies };
