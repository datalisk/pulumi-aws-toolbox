"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVersion = getVersion;
const child_process = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
const util_1 = require("util");
const exec = (0, util_1.promisify)(child_process.exec);
/**
 * Computes a version ID for the given path in the repository using the git history.
 * Useful for building immutable build artifacts.
 *
 * Determines the hash of the git commit when anything underneath the given paths were last changed and truncates the commit hash to eight characters.
 * Git CLI must be installed!
 *
 * @param paths the paths, relative to the current working dir
 */
async function getVersion(...paths) {
    for (const path of paths) {
        // check that the path exists
        await fs.promises.access(path);
    }
    const pathArgs = paths.map(p => `'${p}'`).join(' ');
    const { stdout } = await exec(`git log -n 1 --pretty=format:%H -- ${pathArgs}`);
    if (stdout.trim().length == 0)
        throw new Error(`Paths ${pathArgs} not found in history`);
    const version = stdout.substring(0, 8);
    return version;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jaS92ZXJzaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFlQSxnQ0FZQztBQTNCRCw2REFBK0M7QUFDL0MsdUNBQXlCO0FBQ3pCLCtCQUFpQztBQUVqQyxNQUFNLElBQUksR0FBRyxJQUFBLGdCQUFTLEVBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBRTNDOzs7Ozs7OztHQVFHO0FBQ0ksS0FBSyxVQUFVLFVBQVUsQ0FBQyxHQUFHLEtBQWU7SUFDL0MsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUN2Qiw2QkFBNkI7UUFDN0IsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDcEQsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLHNDQUFzQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ2hGLElBQUksTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sSUFBSSxDQUFDO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxTQUFTLFFBQVEsdUJBQXVCLENBQUMsQ0FBQztJQUV6RixNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN2QyxPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2hpbGRfcHJvY2VzcyBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tIFwidXRpbFwiO1xuXG5jb25zdCBleGVjID0gcHJvbWlzaWZ5KGNoaWxkX3Byb2Nlc3MuZXhlYyk7XG5cbi8qKlxuICogQ29tcHV0ZXMgYSB2ZXJzaW9uIElEIGZvciB0aGUgZ2l2ZW4gcGF0aCBpbiB0aGUgcmVwb3NpdG9yeSB1c2luZyB0aGUgZ2l0IGhpc3RvcnkuXG4gKiBVc2VmdWwgZm9yIGJ1aWxkaW5nIGltbXV0YWJsZSBidWlsZCBhcnRpZmFjdHMuXG4gKiBcbiAqIERldGVybWluZXMgdGhlIGhhc2ggb2YgdGhlIGdpdCBjb21taXQgd2hlbiBhbnl0aGluZyB1bmRlcm5lYXRoIHRoZSBnaXZlbiBwYXRocyB3ZXJlIGxhc3QgY2hhbmdlZCBhbmQgdHJ1bmNhdGVzIHRoZSBjb21taXQgaGFzaCB0byBlaWdodCBjaGFyYWN0ZXJzLlxuICogR2l0IENMSSBtdXN0IGJlIGluc3RhbGxlZCFcbiAqIFxuICogQHBhcmFtIHBhdGhzIHRoZSBwYXRocywgcmVsYXRpdmUgdG8gdGhlIGN1cnJlbnQgd29ya2luZyBkaXJcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFZlcnNpb24oLi4ucGF0aHM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgcGF0aHMpIHtcbiAgICAgICAgLy8gY2hlY2sgdGhhdCB0aGUgcGF0aCBleGlzdHNcbiAgICAgICAgYXdhaXQgZnMucHJvbWlzZXMuYWNjZXNzKHBhdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IHBhdGhBcmdzID0gcGF0aHMubWFwKHAgPT4gYCcke3B9J2ApLmpvaW4oJyAnKTtcbiAgICBjb25zdCB7IHN0ZG91dCB9ID0gYXdhaXQgZXhlYyhgZ2l0IGxvZyAtbiAxIC0tcHJldHR5PWZvcm1hdDolSCAtLSAke3BhdGhBcmdzfWApO1xuICAgIGlmIChzdGRvdXQudHJpbSgpLmxlbmd0aCA9PSAwKSB0aHJvdyBuZXcgRXJyb3IoYFBhdGhzICR7cGF0aEFyZ3N9IG5vdCBmb3VuZCBpbiBoaXN0b3J5YCk7XG5cbiAgICBjb25zdCB2ZXJzaW9uID0gc3Rkb3V0LnN1YnN0cmluZygwLCA4KTtcbiAgICByZXR1cm4gdmVyc2lvbjtcbn1cbiJdfQ==