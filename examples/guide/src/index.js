import { execa } from 'execa';
import { create } from 'template-factory';

const main = async () => {
	await create({
		appName: 'guide',
		version: '1.0.0',
		templates: [
			{
				name: 'SvelteKit',
				path: 'templates/sveltekit',
				flag: 'sveltekit',
                prompts: [
                    {
                        kind: "confirm",
                        message: "Would you like to install @threlte?",
                        yes: {
                            run: async ({ dir }) => {
                                await execa({ cwd: dir })`npm install three @threlte/core`;
                            },
                            startMessage: "Installing @threlte",
                            endMessage: "Installed @threlte"
                        }
                    }
                ]
			},
		],
	});
};

main();
