/** Returns an absolute path to the relative path provided where the
 * relative path is relative to the file containing the code currently being executed
 *
 * @param relativePath Relative path
 * @param importMetaURL
 * ```ts
 * import.meta.url
 * ```
 * @returns
 */
const relative = (relativePath: string, importMetaURL: string) => {
	const url = new URL(relativePath, importMetaURL);
	const path = url.pathname.slice(1);

	return decodeURIComponent(path);
};

export { relative };
