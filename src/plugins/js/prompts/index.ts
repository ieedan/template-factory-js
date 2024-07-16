import { PM, Prompt } from '../../../types';
import { execa } from 'execa';

/** Prompts the user to ask if they would like to install dependencies.
 * If they choose yes it will install dependencies unless `choosePackageManager` is true
 * then the it will ask what package manager the user would like to user then install dependencies using that package manager.
 *
 * @example
 * ```ts
 * import { installDependencies } from 'template-factory/plugins/js/prompts';
 *
 * await create({
 *		//...
 *		templates: [
 *			{
 *				//...
 *				prompts: [installDependencies({ pm: 'npm' })],
 *			},
 *		],
 *	});
 * ```
 *
 * @param pm Default selected package manager or package manager to use if you aren't asking the user
 * @param choosePackageManager When true will prompt the user asking what package manager they would like to use
 * @param allowedPackageManagers Allows you to set what package managers a user is allowed to install with
 * @returns
 */
const installDependencies = <T>({
	pm = 'npm',
	choosePackageManager = true,
	allowedPackageManagers = ['npm', 'pnpm', 'yarn', 'bun'],
}: {
	pm: PM;
	choosePackageManager?: boolean;
	allowedPackageManagers?: PM[];
}): Prompt<T> => {
	return {
		kind: 'confirm',
		message: 'Install dependencies?',
		yes: {
			run: async ({ dir }) => {
				if (choosePackageManager) {
					return [
						{
							kind: 'select',
							message: 'What package manager do you want to use?',
							initialValue: pm,
							options: allowedPackageManagers.map((pm) => ({
								name: pm,
								select: {
									run: async ({ dir }) => {
										await execa({ cwd: dir })`${pm} install`;
									},
									startMessage: `Installing dependencies with ${pm}`,
									endMessage: 'Installed dependencies',
								},
							})),
						},
					];
				} else {
					await execa({ cwd: dir })`${pm} install`;
				}
			},
			startMessage: 'Installing dependencies',
			endMessage: 'Installed dependencies',
		},
	};
};

export { installDependencies };
