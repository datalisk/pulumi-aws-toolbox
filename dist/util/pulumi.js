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
exports.resolveOutput = resolveOutput;
exports.delayedOutput = delayedOutput;
exports.delay = delay;
const pulumi = __importStar(require("@pulumi/pulumi"));
async function resolveOutput(input) {
    return new Promise((resolve, reject) => {
        try {
            input.apply(resolve);
        }
        catch (err) {
            reject(err);
        }
    });
}
/**
 * Delays further processing of an output by a given number of milliseconds.
 * Useful to force a short wait when resources are only eventually consistent.
 *
 * The delay is skipped during preview phase.
 */
function delayedOutput(input, millis) {
    if (!pulumi.runtime.isDryRun()) {
        return input.apply(async (x) => {
            await delay(millis);
            return x;
        });
    }
    else {
        return input;
    }
}
async function delay(millis) {
    return new Promise((resolve) => {
        setTimeout(resolve, millis);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVsdW1pLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWwvcHVsdW1pLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxzQ0FRQztBQVFELHNDQVNDO0FBRUQsc0JBSUM7QUFqQ0QsdURBQXlDO0FBRWxDLEtBQUssVUFBVSxhQUFhLENBQUksS0FBdUI7SUFDMUQsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNuQyxJQUFJLENBQUM7WUFDRCxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ1gsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLGFBQWEsQ0FBSSxLQUF1QixFQUFFLE1BQWM7SUFDcEUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztRQUM3QixPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzNCLE1BQU0sS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BCLE9BQU8sQ0FBQyxDQUFDO1FBQ2IsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO1NBQU0sQ0FBQztRQUNKLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7QUFDTCxDQUFDO0FBRU0sS0FBSyxVQUFVLEtBQUssQ0FBQyxNQUFjO0lBQ3RDLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtRQUMzQixVQUFVLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2hDLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc29sdmVPdXRwdXQ8VD4oaW5wdXQ6IHB1bHVtaS5PdXRwdXQ8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaW5wdXQuYXBwbHkocmVzb2x2ZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuLyoqXG4gKiBEZWxheXMgZnVydGhlciBwcm9jZXNzaW5nIG9mIGFuIG91dHB1dCBieSBhIGdpdmVuIG51bWJlciBvZiBtaWxsaXNlY29uZHMuXG4gKiBVc2VmdWwgdG8gZm9yY2UgYSBzaG9ydCB3YWl0IHdoZW4gcmVzb3VyY2VzIGFyZSBvbmx5IGV2ZW50dWFsbHkgY29uc2lzdGVudC5cbiAqIFxuICogVGhlIGRlbGF5IGlzIHNraXBwZWQgZHVyaW5nIHByZXZpZXcgcGhhc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWxheWVkT3V0cHV0PFQ+KGlucHV0OiBwdWx1bWkuT3V0cHV0PFQ+LCBtaWxsaXM6IG51bWJlcik6IHB1bHVtaS5PdXRwdXQ8VD4ge1xuICAgIGlmICghcHVsdW1pLnJ1bnRpbWUuaXNEcnlSdW4oKSkge1xuICAgICAgICByZXR1cm4gaW5wdXQuYXBwbHkoYXN5bmMgKHgpID0+IHtcbiAgICAgICAgICAgIGF3YWl0IGRlbGF5KG1pbGxpcyk7XG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlbGF5KG1pbGxpczogbnVtYmVyKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSwgbWlsbGlzKTtcbiAgICB9KTtcbn1cbiJdfQ==