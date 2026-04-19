import * as child_process from "child_process";
import * as fs from "fs";
import { promisify } from "util";

const exec = promisify(child_process.exec);

/**
 * Computes a version ID for the given path in the repository using the git history.
 * Useful for building immutable build artifacts.
 * 
 * Determines the hash of the git commit when anything underneath the given paths were last changed and truncates the commit hash to eight characters.
 * Git CLI must be installed!
 * 
 * @param paths the paths, relative to the current working dir
 */
export async function getVersion(...paths: string[]): Promise<string> {
    for (const path of paths) {
        // check that the path exists
        await fs.promises.access(path);
    }

    const pathArgs = paths.map(p => `'${p}'`).join(' ');
    const { stdout } = await exec(`git log -n 1 --pretty=format:%H -- ${pathArgs}`);
    if (stdout.trim().length == 0) throw new Error(`Paths ${pathArgs} not found in history`);

    const version = stdout.substring(0, 8);
    return version;
}
