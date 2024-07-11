import { CreateOptions } from './types.mjs';

declare const create: ({ appName, respectGitIgnore, templates }: CreateOptions) => Promise<void>;

export { create };
