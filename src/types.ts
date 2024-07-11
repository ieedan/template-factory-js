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
	prompts?: Prompt[];
	/** Here you can specify optional add-ons to the template */
	features?: Feature[];
	/** Template files allow you to use an existing file and replace code inside based on the newly created project */
	templateFiles?: TemplateFile[];
	/** Runs after files have been copied and replacements made but before features have been selected */
	copyCompleted?: (opts: TemplateOptions) => Promise<void>;
};

export type Prompt = {
	/** What kind of prompt */
	kind: PromptKind;
	/** The initial value for the prompt */
	initialValue?: unknown;
	/** Message when prompt is shown */
	message: string;
	/** The options available for the prompt (only for `select` prompts) */
	options?: PromptOption[];
	yes?: Selected;
	no?: Selected;
};

export type PromptKind = 'confirm' | 'select';

export type PromptOption = {
	/** Name of option */
	name: string;
	select: Selected;
};

export type Feature = {
	/** Name of the feature */
	name: string;
	/** Options for when the feature is enabled */
	enable: Selected;
	/** Child features that can optionally be installed if this feature is installed */
	features?: Feature[];
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

export type Selected = {
	/** What to do when selected */
	run: (opts: TemplateOptions) => Promise<void>;
	/** Message shown while loading */
	startMessage?: string;
	/** Message shown when completed */
	endMessage?: string;
};
