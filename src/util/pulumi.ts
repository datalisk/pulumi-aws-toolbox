import * as pulumi from "@pulumi/pulumi";

export async function resolveOutput<T>(input: pulumi.Output<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        try {
            input.apply(resolve);
        } catch (err) {
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
export function delayedOutput<T>(input: pulumi.Output<T>, millis: number): pulumi.Output<T> {
    if (!pulumi.runtime.isDryRun()) {
        return input.apply(async (x) => {
            await delay(millis);
            return x;
        });
    } else {
        return input;
    }
}

export async function delay(millis: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, millis);
    });
}
