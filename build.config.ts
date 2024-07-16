import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	entries: [
		'src/index.ts',
		'src/types.ts',
		'src/util/index.ts',
		'src/plugins/js/prompts/index.ts',
		'src/plugins/js/util/index.ts',
	],
	declaration: true,
	clean: true,
});
