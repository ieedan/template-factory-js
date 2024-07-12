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
import path from 'node:path';
import fs from 'fs-extra';
import ignore from 'ignore';

/** Just here for internal functions */
type Spinner = {
	start: (msg?: string) => void;
	stop: (msg?: string, code?: number) => void;
	message: (msg?: string) => void;
};

const create = async ({ appName, respectGitIgnore, templates }: CreateOptions) => {
	program
		.name(appName)
		.argument('[project-name]', 'Name of the project')
		.addOption(
			new Option('-t, --template <name>', 'Template').choices(
				templates.map((template) => template.flag)
			)
		);

	program.parse();

	const options = program.opts();

	intro(appName);

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
		}
	}

	if (dir != '.' && !(await fs.exists(dir))) {
		await fs.mkdir(dir);
	}

	const empty = (await fs.readdir(dir)).length == 0;

	if (!empty) {
		const cont = await confirm({ message: 'Directory is not empty continue?' });

		if (!cont) {
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

	await fs.copy(template.path, dir, {
		filter: (file) => {
			const filePath = path
				.normalize(file)
				.toString()
				.replaceAll(path.normalize(template.path + '\\'), '');

			return !ig.ignores(filePath);
		},
	});

	loading.stop(`Created ${projectName}`);

	if (template.templateFiles) {
		for (const file of template.templateFiles) {
			const filePath = path.join(dir, file.path);
			const content = (await fs.readFile(filePath)).toString();

			let newContent = '';

			file.replacements.forEach((replacement) => {
				newContent = content.replace(
					replacement.match,
					replacement.replace({ projectName: projectName, dir })
				);
			});

			await fs.writeFile(filePath, newContent);
		}
	}

	if (template.copyCompleted) {
		await template.copyCompleted({ projectName, dir });
	}

	if (template.prompts) {
		await runPrompts(loading, template.prompts, { projectName, dir });
	}

	outro('Your project is ready!');
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
				// warn of invalid config
				console.warn(
					conf
						? `A \`yes\` result was not specified in the configuration of: ${prompt.message}`
						: `A \`no\` result was not specified in the configuration of: ${prompt.message}`
				);
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

export { create };

export * from './types';
