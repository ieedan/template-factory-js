export type TemplateOptions = {
	/** The directory of the new project */
	dir: string;
	/** Name of the project as entered by the user */
	projectName: string;
};

export type Template = {
	/** Name of the template */
	name: string;
	/** Path to the template from the root of your project */
	path: string;
	/** The value for the `-t` / `--template` used to select this template
	 *
	 *  @example
	 *  // should include no whitespace
	 *  "sveltekit-starter"
	 */
	flag: string;
	/** Files/Directories that should be excluded from being copied
	 *
	 *  This uses .gitignore syntax. If you haven't set respectGitIgnore to false then
	 *  any files/directories in your .gitignore file will be excluded.
	 */
	excludeFiles?: string[];
	/** Specify prompts that are used to select options or features */
	prompts?: Prompt[];
	/** Template files allow you to use an existing file and replace code inside based on the newly created project */
	templateFiles?: TemplateFile[];
	/** Runs after files have been copied and replacements made but before features have been selected */
	copyCompleted?: (opts: TemplateOptions) => Promise<void>;
};

export type Prompt = {
	/** What kind of prompt */
	kind: PromptKind;
	/** The initial value for the prompt
	 *
	 *  For multiselect prompts this will be an array of option names
	 */
	initialValue?: unknown | unknown[];
	/** Message when prompt is shown */
	message: string;
	/** Determines whether the user must select an option (only for `multiselect` prompts) */
	required?: boolean;
	/** The options available for the prompt (only for `select` or `multiselect` prompts) */
	options?: PromptOption[];
	yes?: Selected;
	no?: Selected;
};

export type PromptKind = 'confirm' | 'select' | 'multiselect';

export type PromptOption = {
	/** Name of option */
	name: string;
	select: Selected;
};

export type Selected = {
	/** Custom code to run when this selection was made by the user.
	 *
	 *  To run more prompts dependent on this one return a list of prompts.
	 */
	run: (opts: TemplateOptions) => Promise<Prompt[] | void>;
	/** Message shown while `run` function is executing (not shown while running child prompts) */
	startMessage?: string;
	/** Message shown when `run` function is done (not shown while running child prompts) */
	endMessage?: string;
};

export type TemplateFile = {
	/** The path relative to your template
	 *
	 *  @example "package.json"
	 */
	path: string;
	/** List of replacements to be made in the file once copied */
	replacements: Replace[];
};

export type Replace = {
	/** Matches this string */
	match: string;
	/** Replaces the match string in all locations
	 *
	 *  @example
	 *  ```ts
	 *  // Replaces the placeholder name with the name of the project
	 *  const replacement = {
	 *      match: 'placeholder-project-name'
	 *      replace: ({ projectName }) => projectName
	 *  }
	 *  ```
	 */
	replace: (opts: TemplateOptions) => string;
};

export type CreateOptions = {
	/** Name of your application */
	appName: string;
	/** When enabled will exclude any patterns matched in the .gitignore file
	 *
	 * @default
	 * true
	 */
	respectGitIgnore?: boolean;
	/** A list of template applications or a single template application.
	 *
	 *  If only a single template is provided it will skip asking the user to select a template.
	 */
	templates: Template[];
	/** Version of your application
	 *
	 *  @example
	 *  import { readPackage } from 'read-pkg';
	 *
	 *  // get the version of your project
	 *  (await readPackage()).version;
	 */
	version: string;
	/** Customizations for style of the program not effecting logic */
	customization?: {
		/** Runs on program startup this allows you to customize the message shown by the `intro()` function */
		intro?: ({ appName, version }: { appName: string; version: string }) => Promise<string>;
		/** Runs on program startup this allows you to customize the message shown by the `outro()` function */
		outro?: ({ appName, version }: { appName: string; version: string }) => Promise<string>;
	};
};
