import fs from "fs-extra";
import path from "node:path";
import * as template from "./project-template";
import { Template } from "./types";
import { execa } from "execa";

const templates: Template[] = [
	{
		name: "kit-template",
		path: "templates/kit-template",
		excludeFiles: ["README.md"],
		features: [
			{
				name: "Threlte",
				enable: {
					run: async ({ dir }) => {
						await execa({ cwd: dir })`npm install @threlte/core three @types/three`;
					},
					startMessage: "Installing @threlte/core, three, and @types/three",
					endMessage: "Installed Threlte"
				},
				features: [
					"@threlte/extras",
					"@threlte/gltf",
					"@threlte/rapier",
					"@threlte/theatre",
					"@threlte/xr",
					"@threlte/flex",
				].map((pack) => ({
					name: pack,
					enable: {
						run: async ({ dir }) => {
							await execa({ cwd: dir })`npm install ${pack}`;
						},
						startMessage: `Installing ${pack}`,
						endMessage: `Installed ${pack}`
					},
				})),
			},
		],
		templateFiles: [
			{
				path: "package.json",
				replacements: [
					{
						match: '"kit-template"',
						replace: ({ projectName }) => `"${projectName}"`,
					},
				],
			},
		],
		copyCompleted: async ({ dir, projectName }) => {
			const file = path.join(dir, "README.md");

			const content = `# ${projectName}
This project was created for you with the help of [project-template](https://github.com/ieedan/project-template)`;

			await fs.writeFile(file, content);
		},
	},
	{
		name: "rust-template",
		path: "templates/rust-template",
		templateFiles: [
			{
				path: "cargo.toml",
				replacements: [
					{
						match: "rust-template",
						replace: ({ projectName }) => projectName
					}
				]
			}
		]
	}
];

template.create({ appName: "project-template", templates });
