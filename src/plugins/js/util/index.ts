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
	dir: string,
	...packages: { name: string; version: string; scope: 'dev' | 'regular' }[]
) => {
	const file = path.join(dir, 'package.json');

	const packageJsonFile = JSON.parse((await fs.readFile(file)).toString());

	for (const pack of packages) {
		if (pack.scope == 'dev') {
			packageJsonFile.devDependencies[pack.name] = pack.version;
		} else {
			packageJsonFile.dependencies[pack.name] = pack.version;
		}
	}

	const newFile = JSON.stringify(packageJsonFile, null, 2);

	await fs.writeFile(file, newFile);
};

export { addDependencies, removeDependencies };
