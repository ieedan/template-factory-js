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
	/** What to do when selected.
	 * 
	 *  To run more prompts dependent on this one return a list of prompts.
	 */
	run: (opts: TemplateOptions) => Promise<Prompt[] | void>;
	/** Message shown while loading */
	startMessage?: string;
	/** Message shown when completed */
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
};
