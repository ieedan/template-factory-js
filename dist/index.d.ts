import { CreateOptions } from './types.js';

declare const create: ({ appName, respectGitIgnore, templates }: CreateOptions) => Promise<void>;

export { create };
