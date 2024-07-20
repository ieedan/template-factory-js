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
	/** Files allow you to make modifications to files in the project in a more ergonomic way */
	files?: File<State>[];
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

export type Prompt<State> =
	| ({ kind: 'select' } & SelectPrompt<State>)
	| ({ kind: 'multiselect' } & MultiselectPrompt<State>)
	| ({ kind: 'confirm' } & ConfirmPrompt<State>)
	| ({ kind: 'text' } & TextPrompt<State>)
	| ({ kind: 'password' } & PasswordPrompt<State>);

export type SelectPrompt<State> = {
	/** The initial value for the prompt
	 *
	 *  For multiselect prompts this will be an array of option names
	 */
	initialValue?: string;
	/** Message when prompt is shown */
	message: string;
	/** The options available for the prompt (only for `select` or `multiselect` prompts) */
	options: PromptOption<State>[];
	/** Allows you to run code based on the result of a prompt */
	result?: PromptResult<State, string>;
};

export type MultiselectPrompt<State> = {
	/** The initial value for the prompt
	 *
	 *  For multiselect prompts this will be an array of option names
	 */
	initialValue?: string[];
	/** Message when prompt is shown */
	message: string;
	/** Determines whether the user is required to select an option */
	required?: boolean;
	/** The options available for the prompt (only for `select` or `multiselect` prompts) */
	options: PromptOption<State>[];
	result?: PromptResult<State, string[]>;
};

export type ConfirmPrompt<State> = {
	/** The initial value for the prompt
	 *
	 *  For multiselect prompts this will be an array of option names
	 */
	initialValue?: boolean;
	/** Message when prompt is shown */
	message: string;
	yes?: Selected<State>;
	no?: Selected<State>;
	result?: PromptResult<State, boolean>;
};

export type TextPrompt<State> = {
	/** The initial value for the prompt
	 *
	 *  For multiselect prompts this will be an array of option names
	 */
	initialValue?: string;
	/** Message when prompt is shown */
	message: string;
	/** Value shown as a placeholder */
	placeholder?: string;
	/** Allows you to validate the user input */
	validate?: (value: string) => string | void;
	result: PromptResult<State, string>;
};

export type PasswordPrompt<State> = {
	/** Message when prompt is shown */
	message: string;
	/** Allows you to validate the user input */
	validate?: (value: string) => string | void;
	result: PromptResult<State, string>;
};

export type PromptResult<State, T> = {
	/** Runs after any option or yes/no code will also run after any child prompts or
	 *  the option or yes/no code.
	 *
	 *  Useful when you need to operate with the result of a prompt.
	 *
	 * @param result Result of the parent prompt
	 * @param opts Options from the template
	 * @returns
	 */
	run: (result: T, opts: TemplateOptions<State>) => Promise<Prompt<State>[] | void>;
	/** Message shown while `run` function is executing (not shown while running child prompts) */
	startMessage?: string;
	/** Message shown when `run` function is done (not shown while running child prompts) */
	endMessage?: string;
};

export type PromptOption<State> = {
	/** Name of option */
	name: string;
	/** Hint to be shown to the user next to the name of the option */
	hint?: string;
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

export type ContentFunction<State, ContentType> = {
	content: (
		info: { name: string; content: ContentType },
		opts: TemplateOptions<State>
	) => Promise<{ name: string; content: ContentType }>;
};

export type File<State> = {
	/** The path relative to your template
	 *
	 *  @example "package.json"
	 */
	path: string;
} & (
	| ({ type: 'json' } & ContentFunction<State, Object>)
	| ({ type: 'text' } & ContentFunction<State, string>)
);

export type AppInfo = {
	/** The name you provided to the `appName` property */
	appName: string;
	/** The version you provided to the `version` property */
	version: string;
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
	/** Version of your application ex: (1.0.0)
	 *
	 *  @example
	 *  const { version } = JSON.parse(
	 *			fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
	 *	);
	 */
	version: string;
	/** Customizations for style of the program not effecting logic */
	customization?: {
		/** Runs on program startup this allows you to customize the message shown by the `intro()` function */
		intro?: (info: AppInfo) => Promise<string>;
		/** Runs on program startup this allows you to customize the message shown by the `outro()` function */
		outro?: (info: AppInfo) => Promise<string>;
	};
};

export type PM = 'npm' | 'pnpm' | 'yarn' | 'bun';
