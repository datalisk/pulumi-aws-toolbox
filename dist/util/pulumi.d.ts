import * as pulumi from "@pulumi/pulumi";
export declare function resolveOutput<T>(input: pulumi.Output<T>): Promise<T>;
/**
 * Delays further processing of an output by a given number of milliseconds.
 * Useful to force a short wait when resources are only eventually consistent.
 *
 * The delay is skipped during preview phase.
 */
export declare function delayedOutput<T>(input: pulumi.Output<T>, millis: number): pulumi.Output<T>;
export declare function delay(millis: number): Promise<unknown>;
