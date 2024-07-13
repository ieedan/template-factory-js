import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	entries: ['src/index', 'src/types', 'src/util'],
	declaration: true,
	clean: true,
});
