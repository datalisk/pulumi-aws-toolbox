import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { ComponentResourceOptions } from "@pulumi/pulumi";
import { BaseLambdaArgs } from "./Builder";
/**
 * Creates a Nodejs AWS Lambda with useful defaults for small & simple tasks.
 */
export declare class SimpleNodeLambda extends pulumi.ComponentResource {
    readonly function: aws.lambda.Function;
    constructor(name: string, args: SimpleNodeLambdaArgs, opts?: ComponentResourceOptions, type?: string);
}
export interface SimpleNodeLambdaArgs extends BaseLambdaArgs {
    /**
     * A directory with the JS source code to deploy.
     * It must contain a index.js/index.mjs file with a handler function.
     */
    codeDir: string;
    /**
     * Map of environment variables for the function.
     */
    environmentVariables?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
    /**
     * Amount of memory in MB your Lambda Function can use at runtime. Defaults to `128`. See [Limits](https://docs.aws.amazon.com/lambda/latest/dg/limits.html)
     */
    memorySize?: number;
    /**
     * Amount of time your Lambda Function has to run in seconds. Defaults to `60`.
     */
    timeout?: number;
}
