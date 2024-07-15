export type TemplateOptions<State> = {
	/** The directory of the new project */
	dir: string;
	/** Name of the project as entered by the user */
	projectName: string;
	/** Call this to stop execution and write the message to the console */
	error: (msg: string) => void;
	/** Your template state */
	state: State;
};

export type Template<State = unknown> = {
	/** Name of the template */
	name: string;
	/** Path to the template from the root of your project
	 *
	 *  To make sure paths are resolved correctly please pass them like this:
	 * 	```js
	 * 	{
	 * 		//...
	 *  	path: new URL('templates/sveltekit', import.meta.url).pathname.slice(1)
	 *  }
	 *  ```
	 */
	path?: string;
	/** Repository to clone as a template
	 *
	 *  @example
	 *  'https://github.com/ieedan/create.git
	 */
	repo?: string;
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
	/** Specify prompts that are used to select options or features
	 *
	 *  [API Reference](https://github.com/ieedan/template-factory-js?tab=readme-ov-file#prompts)
	 */
	prompts?: Prompt<State>[];
	/** Template files allow you to use an existing file and replace code inside based on the newly created project */
	templateFiles?: TemplateFile<State>[];
	/** Runs after files have been copied and replacements made but before features have been selected
	 *
	 *  This is generally a good place to generate files.
	 */
	copyCompleted?: (opts: TemplateOptions<State>) => Promise<void>;
	/** Runs after the outro allowing you to show next steps or run final cleanup code. */
	completed?: (opts: TemplateOptions<State>) => Promise<void>;
	/** Initial state for the template */
	state?: State;
};

export type Prompt<State> = {
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
	options?: PromptOption<State>[];
	yes?: Selected<State>;
	no?: Selected<State>;
	result?: {
		/** Runs after any option or yes/no code will also run after any child prompts or
		 *  the option or yes/no code.
		 *
		 *  Useful when you need to operate with the result of a prompt.
		 *
		 * @param result Result of the parent prompt
		 * @param opts Options from the template
		 * @returns
		 */
		run: (
			result: unknown | unknown[],
			opts: TemplateOptions<State>
		) => Promise<Prompt<State>[] | void>;
		/** Message shown while `run` function is executing (not shown while running child prompts) */
		startMessage?: string;
		/** Message shown when `run` function is done (not shown while running child prompts) */
		endMessage?: string;
	};
};

export type PromptKind = 'confirm' | 'select' | 'multiselect';

export type PromptOption<State> = {
	/** Name of option */
	name: string;
	select?: Selected<State>;
};

export type Selected<State> = {
	/** Custom code to run when this selection was made by the user.
	 *
	 *  To run more prompts dependent on this one return a list of prompts.
	 */
	run: (opts: TemplateOptions<State>) => Promise<Prompt<State>[] | void>;
	/** Message shown while `run` function is executing (not shown while running child prompts) */
	startMessage?: string;
	/** Message shown when `run` function is done (not shown while running child prompts) */
	endMessage?: string;
};

export type TemplateFile<State> = {
	/** The path relative to your template
	 *
	 *  @example "package.json"
	 */
	path: string;
	/** List of replacements to be made in the file once copied */
	replacements: Replace<State>[];
};

export type Replace<State> = {
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
	replace: (opts: TemplateOptions<State>) => string;
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
	 *  const { version } = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
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
