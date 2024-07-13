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
} from '@clack/prompts';
import { CreateOptions, Prompt, Selected, Template, TemplateOptions } from './types';
import color from 'chalk';
import path from 'node:path';
import fs from 'fs-extra';
import ignore from 'ignore';
import util from './util';

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
			dir = projectName;
		}
	}

	if (dir != '.' && !(await fs.exists(dir))) {
		await fs.mkdir(dir);
	}

	const templateOptions: TemplateOptions = {
		projectName,
		dir,
		error: (msg: string) => program.error(color.red(`ERROR: ${msg}`)),
	};

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

	if (!(await fs.exists(template.path))) {
		program.error(
			`ERROR: The template '${template.name}' was configured with an incorrect path: "${template.path}". "${template.path}" does not exist.`
		);
	}

	const ig = ignore();

	if (template.excludeFiles) {
		ig.add(template.excludeFiles);
	}

	// If respectGitIgnore is not provided or set to true use gitignore
	if (respectGitIgnore == undefined || respectGitIgnore) {
		const ignorePath = path.join(template.path, '.gitignore');

		if (await fs.exists(ignorePath)) {
			ig.add((await fs.readFile(ignorePath)).toString());
		}
	}

	loading.start(`Creating ${projectName}`);

	const files = await fs.readdir(template.path);

	for (const file of files) {
		if (ig.ignores(file)) continue;

		const filePath = path.join(template.path, file);

		await fs.copy(filePath, path.join(dir, file));
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
		await runPrompts(loading, template.prompts, templateOptions);
	}

	outro(
		customization?.outro ? await customization.outro({ appName, version }) : "You're all set!"
	);
};

const runPrompts = async (loading: Spinner, prompts: Prompt[], opts: TemplateOptions) => {
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

			let selected: Selected;

			if (conf && prompt.yes) {
				selected = prompt.yes;
			} else if (!conf && prompt.no) {
				selected = prompt.no;
			} else {
				continue;
			}

			const prompts = await run(selected, loading, opts);

			if (prompts) {
				await runPrompts(loading, prompts, opts);
			}
		} else if (prompt.kind == 'select') {
			if (!prompt.options) throw new Error(`Select prompts must have specified options.`);
			const selection = await select({
				message: prompt.message,
				initialValue: prompt.initialValue,
				options: prompt.options.map((option) => ({
					label: option.name,
					value: option.name,
				})),
			});

			if (isCancel(selection)) {
				cancel('Cancelled.');
				process.exit(0);
			}

			for (const option of prompt.options) {
				// we don't compare by index here because initial value is important
				if (option.name != selection) continue;

				const prompts = await run(option.select, loading, opts);

				if (prompts) {
					await runPrompts(loading, prompts, opts);
				}

				break;
			}
		} else if (prompt.kind == 'multiselect') {
			if (!prompt.options)
				throw new Error(`multiselect prompts must have specified options.`);

			const selection = await multiselect({
				message: prompt.message,
				required: prompt.required ?? false,
				initialValues: Array.isArray(prompt.initialValue) ? prompt.initialValue : [],
				options: prompt.options.map((option) => ({
					label: option.name,
					value: option.name,
				})),
			});

			if (isCancel(selection)) {
				cancel('Cancelled.');
				process.exit(0);
			}

			for (const option of prompt.options) {
				// we don't compare by index here because initial value is important
				if (!selection.includes(option.name)) continue;

				const prompts = await run(option.select, loading, opts);

				if (prompts) {
					await runPrompts(loading, prompts, opts);
				}
			}
		}
	}
};

const run = async (selected: Selected, loading: Spinner, opts: TemplateOptions) => {
	loading.start(selected.startMessage);

	const prompts = await selected.run(opts);

	loading.stop(selected.endMessage);

	return prompts;
};

export { create, util };

export * from './types';
