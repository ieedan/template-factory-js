import { Option, program } from 'commander';
import {
	isCancel,
	cancel,
	intro,
	outro,
	text,
	select,
	multiselect,
	spinner,
	confirm,
	password,
} from '@clack/prompts';
import { CreateOptions, Prompt, Selected, Template, TemplateOptions } from './types';
import color from 'chalk';
import path from 'node:path';
import fs from 'fs-extra';
import ignore from 'ignore';
import simpleGit from 'simple-git';

/** Just here for internal functions */
type Spinner = {
	start: (msg?: string) => void;
	stop: (msg?: string, code?: number) => void;
	message: (msg?: string) => void;
};

const create = async ({
	appName,
	version,
	customization,
	respectGitIgnore,
	templates,
}: CreateOptions) => {
	program
		.name(appName)
		.version(version)
		.argument('[project-name]', 'Name of the project')
		.addOption(
			new Option('-t, --template <name>', 'Template').choices(
				templates.map((template) => template.flag)
			)
		);

	program.parse();

	const options = program.opts();

	let message = '';

	if (customization?.intro) {
		message = await customization.intro({ appName, version });
	} else {
		const title = color.bgHex('#303030').white(` ${appName} `);
		const ver = color.gray(` v${version} `);

		message = title + ver;
	}

	intro(message);

	// setup spinner

	const loading = spinner();

	let projectName: string | undefined = program.args[0];
	let dir = '.';

	if (projectName) {
		dir = projectName;
	} else {
		const dirResult = await text({
			defaultValue: '.',
			message: `Where should we create the project?`,
			placeholder: ' (hit Enter to use current directory)',
		});

		if (isCancel(dirResult)) {
			cancel('Cancelled.');
			process.exit(0);
		}

		if (dirResult == '.') {
			projectName = path.basename(process.cwd());
		} else {
			projectName = path.basename(dirResult);
			dir = dirResult;
		}
	}

	if (dir != '.' && !(await fs.exists(dir))) {
		await fs.mkdir(dir, { recursive: true });
	}

	const empty = (await fs.readdir(dir)).length == 0;

	if (!empty) {
		const cont = await confirm({ message: 'Directory is not empty continue?' });

		if (isCancel(cont) || !cont) {
			cancel('Cancelled.');
			process.exit(0);
		}
	}

	let template: Template | undefined = undefined;

	// No need to ask if there is only a single template
	if (templates.length == 1) {
		template = templates[0];
	} else {
		let specifiedByFlag = false;
		for (const temp of templates) {
			if (temp.flag == options.template) {
				template = temp;
				specifiedByFlag = true;
				break;
			}
		}

		if (!specifiedByFlag) {
			const templateSelection = await select({
				message: 'What template should we use?',
				options: templates.map((template, index) => ({
					label: template.name,
					value: index,
				})),
			});

			if (isCancel(templateSelection)) {
				cancel('Cancelled.');
				process.exit(0);
			}

			template = templates[templateSelection as number];
		}
	}

	// this shouldn't happen but its here for TS
	if (!template) return;

	const templateOptions: TemplateOptions<typeof template.state> = {
		projectName,
		dir,
		error: (msg: string) => program.error(color.red(`ERROR: ${msg}`)),
		state: template.state,
	};

	if (template.path == undefined && template.repo == undefined) {
		program.error(
			color.red(
				`ERROR: Either the 'path' or the 'repo' must be configured on the template ${template.name}`
			)
		);
	}

	loading.start(`Creating ${projectName}`);

	const ig = ignore();

	if (template.excludeFiles) {
		ig.add(template.excludeFiles);
	}

	if (template.path) {
		if (!(await fs.exists(template.path))) {
			program.error(
				color.red(
					`ERROR: The template '${template.name}' was configured with an incorrect path: "${template.path}". "${template.path}" does not exist.`
				)
			);
		}

		// If respectGitIgnore is not provided or set to true use gitignore
		if (respectGitIgnore == undefined || respectGitIgnore) {
			const ignorePath = path.join(template.path, '.gitignore');

			if (await fs.exists(ignorePath)) {
				ig.add((await fs.readFile(ignorePath)).toString());
			}
		}

		const files = await fs.readdir(template.path);

		for (const file of files) {
			if (ig.ignores(file)) continue;

			const filePath = path.join(template.path, file);

			await fs.copy(filePath, path.join(dir, file));
		}
	} else if (template.repo) {
		try {
			const git = simpleGit();

			await git.clone(template.repo, dir);

			// remove files that were supposed to be excluded
			const files = await fs.readdir(dir);

			for (const file of files) {
				if (!ig.ignores(file)) continue;

				const fullPath = path.join(dir, file);

				await fs.rm(fullPath, { recursive: true, force: true });
			}
		} catch (err) {
			program.error(
				color.red(`ERROR: While attempting to clone repo and error occurred\n${err}`)
			);
		}
	}

	loading.stop(`Created ${projectName}`);

	if (template.templateFiles) {
		for (const file of template.templateFiles) {
			const filePath = path.join(dir, file.path);
			const content = (await fs.readFile(filePath)).toString();

			let newContent = '';

			file.replacements.forEach((replacement) => {
				newContent = content.replace(
					replacement.match,
					replacement.replace(templateOptions)
				);
			});

			await fs.writeFile(filePath, newContent);
		}
	}

	if (template.copyCompleted) {
		await template.copyCompleted(templateOptions);
	}

	if (template.prompts) {
		await runPrompts(template.prompts, loading, templateOptions);
	}

	outro(
		customization?.outro ? await customization.outro({ appName, version }) : "You're all set!"
	);

	if (template.completed) {
		template.completed(templateOptions);
	}
};

const runPrompts = async <State>(
	prompts: Prompt<State>[],
	loading: Spinner,
	opts: TemplateOptions<State>
) => {
	for (const prompt of prompts) {
		if (prompt.kind == 'confirm') {
			const conf = await confirm({
				message: prompt.message,
				initialValue: (prompt.initialValue as boolean) ?? false,
			});

			if (isCancel(conf)) {
				cancel('Cancelled.');
				process.exit(0);
			}

			let selected: Selected<State>;

			if (conf && prompt.yes) {
				selected = prompt.yes;
			} else if (!conf && prompt.no) {
				selected = prompt.no;
			} else {
				continue;
			}

			const prompts = await run(selected, loading, opts);

			if (prompts) {
				await runPrompts(prompts, loading, opts);
			}

			if (prompt.result) {
				const command: Selected<State> = {
					run: async (opts) => {
						if (!prompt.result) return;
						return await prompt.result.run(conf, opts);
					},
					startMessage: prompt.result.startMessage,
					endMessage: prompt.result.endMessage,
				};

				const resultPrompts = await run(command, loading, opts);

				if (resultPrompts) {
					await runPrompts(resultPrompts, loading, opts);
				}
			}
		} else if (prompt.kind == 'select') {
			const selection = await select({
				message: prompt.message,
				initialValue: prompt.initialValue,
				options: prompt.options.map((option) => ({
					label: option.name,
					value: option.name,
					hint: option.hint,
				})),
			});

			if (isCancel(selection)) {
				cancel('Cancelled.');
				process.exit(0);
			}

			for (const option of prompt.options) {
				// we don't compare by index here because initial value is important
				if (option.name != selection) continue;

				if (option.select) {
					const prompts = await run(option.select, loading, opts);

					if (prompts) {
						await runPrompts(prompts, loading, opts);
					}
				}

				break;
			}

			if (prompt.result) {
				const command: Selected<State> = {
					run: async (opts) => {
						if (!prompt.result) return;
						return await prompt.result.run(selection, opts);
					},
					startMessage: prompt.result.startMessage,
					endMessage: prompt.result.endMessage,
				};

				const resultPrompts = await run(command, loading, opts);

				if (resultPrompts) {
					await runPrompts(resultPrompts, loading, opts);
				}
			}
		} else if (prompt.kind == 'multiselect') {
			const selection = await multiselect({
				message: prompt.message,
				required: prompt.required ?? false,
				initialValues: Array.isArray(prompt.initialValue) ? prompt.initialValue : [],
				options: prompt.options.map((option) => ({
					label: option.name,
					value: option.name,
					hint: option.hint,
				})),
			});

			if (isCancel(selection)) {
				cancel('Cancelled.');
				process.exit(0);
			}

			for (const option of prompt.options) {
				// we don't compare by index here because initial value is important
				if (!selection.includes(option.name)) continue;

				if (option.select) {
					const prompts = await run(option.select, loading, opts);

					if (prompts) {
						await runPrompts(prompts, loading, opts);
					}
				}
			}

			if (prompt.result) {
				const command: Selected<State> = {
					run: async (opts) => {
						if (!prompt.result) return;
						return await prompt.result.run(selection, opts);
					},
					startMessage: prompt.result.startMessage,
					endMessage: prompt.result.endMessage,
				};

				const resultPrompts = await run(command, loading, opts);

				if (resultPrompts) {
					await runPrompts(resultPrompts, loading, opts);
				}
			}
		} else if (prompt.kind == 'text') {
			const result = await text({
				message: prompt.message,
				initialValue: prompt.initialValue,
				placeholder: prompt.placeholder,
				validate: prompt.validate,
			});

			if (isCancel(result)) {
				cancel('Cancelled.');
				process.exit(0);
			}

			const command: Selected<State> = {
				run: async (opts) => {
					if (!prompt.result) return;
					return await prompt.result.run(result, opts);
				},
				startMessage: prompt.result.startMessage,
				endMessage: prompt.result.endMessage,
			};

			const resultPrompts = await run(command, loading, opts);

			if (resultPrompts) {
				await runPrompts(resultPrompts, loading, opts);
			}
		} else if (prompt.kind == 'password') {
			const result = await password({
				message: prompt.message,
				validate: prompt.validate,
			});

			if (isCancel(result)) {
				cancel('Cancelled.');
				process.exit(0);
			}

			const command: Selected<State> = {
				run: async (opts) => {
					if (!prompt.result) return;
					return await prompt.result.run(result, opts);
				},
				startMessage: prompt.result.startMessage,
				endMessage: prompt.result.endMessage,
			};

			const resultPrompts = await run(command, loading, opts);

			if (resultPrompts) {
				await runPrompts(resultPrompts, loading, opts);
			}
		}
	}
};

const run = async <State>(
	selected: Selected<State>,
	loading: Spinner,
	opts: TemplateOptions<State>
) => {
	if (selected.startMessage) {
		loading.start(selected.startMessage);
	}

	const prompts = await selected.run(opts);

	if (selected.endMessage) {
		loading.stop(selected.endMessage);
	}

	return prompts;
};

export { create };

export * from './types';
