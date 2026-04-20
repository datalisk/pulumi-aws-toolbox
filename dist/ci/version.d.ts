/**
 * Computes a version ID for the given path in the repository using the git history.
 * Useful for building immutable build artifacts.
 *
 * Determines the hash of the git commit when anything underneath the given paths were last changed and truncates the commit hash to eight characters.
 * Git CLI must be installed!
 *
 * @param paths the paths, relative to the current working dir
 */
export declare function getVersion(...paths: string[]): Promise<string>;
