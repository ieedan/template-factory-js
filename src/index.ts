import { program } from 'commander';
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
import { CreateOptions, Feature, Prompt, Selected, Template, TemplateOptions } from './types';
import path from 'node:path';
import fs from 'fs-extra';
import ignore from 'ignore';

const create = async ({ appName, respectGitIgnore, templates }: CreateOptions) => {
	program.name(appName).argument('[project-name]', 'Name of the project');

	program.parse();

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

	let template: Template;

	// No need to ask if there is only a single template
	if (templates.length == 1) {
		template = templates[0];
	} else {
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

	if (template.features) {
		await enableFeatures(loading, template.features, { projectName, dir });
	}

	outro('Your project is ready!');
};

type Spinner = {
	start: (msg?: string) => void;
	stop: (msg?: string, code?: number) => void;
	message: (msg?: string) => void;
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

			if (conf && prompt.yes) {
				await run(prompt.yes, loading, opts);
			} else if (!conf && prompt.no) {
				await run(prompt.no, loading, opts);
			}
		} else {
			if (!prompt.options) throw new Error(`Select prompts must have specified options.`);
			const selection = await select({
				message: prompt.message,
				initialValue: prompt.initialValue,
				options: prompt.options.map((option) => ({
					label: option.name,
					value: option.name
				})),
			});

			if (isCancel(selection)) {
				cancel('Cancelled.');
				process.exit(0);
			}

			for (const option of prompt.options) {
				if (option.name != selection) continue;
				
				await run(option.select, loading, opts);
			}
		}
	}
};

const enableFeatures = async (
	loading: Spinner,
	features: Feature[],
	opts: TemplateOptions,
	parent: string | undefined = undefined
) => {
	const featureSelection = await multiselect({
		message: parent
			? `What features should be included with ${parent}?`
			: 'What features should be included?',
		required: false,
		options: features.map((feature, index) => ({
			label: feature.name,
			value: index,
		})),
	});

	if (isCancel(featureSelection)) {
		cancel('Cancelled.');
		process.exit(0);
	}

	for (let i = 0; i < features.length; i++) {
		const feature = features[i];

		if (!featureSelection.includes(i)) continue;

		await run(feature.enable, loading, opts);

		if (feature.features) {
			await enableFeatures(loading, feature.features, opts, feature.name);
		}
	}
};

const run = async (selected: Selected, loading: Spinner, opts: TemplateOptions) => {
	loading.start(selected.startMessage);

	await selected.run(opts);

	loading.stop(selected.endMessage);
};

export { create };
