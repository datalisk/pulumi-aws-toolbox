import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { ComponentResourceOptions } from "@pulumi/pulumi";
import { S3Folder } from "../ci";
import { BaseLambdaArgs, Builder } from "./Builder";

/**
 * Creates a Nodejs AWS Lambda with useful defaults for small & simple tasks.
 */
export class SimpleNodeLambda extends pulumi.ComponentResource {
    readonly function: aws.lambda.Function;

    // TODO remove type param
    constructor(name: string, args: SimpleNodeLambdaArgs, opts?: ComponentResourceOptions, type?: string) {
        super(type ?? "pat:lambda:SimpleNodeLambda", name, args, opts);

        const builder = new Builder(name, args, { parent: this });
        const logGroup = builder.createLogGroup();
        const role = builder.createRole();
        const vpcConfig = builder.createVpcConfig();

        this.function = new aws.lambda.Function(name, {
            ...this.getCodeArgs(args),
            handler: args.handler ?? `index.handler`,
            runtime: aws.lambda.Runtime.NodeJS24dX,
            architectures: ["arm64"],
            role: role.arn,
            memorySize: args.memorySize ?? 128,
            timeout: args.timeout ?? 60,
            environment: {
                variables: args.environmentVariables,
            },
            vpcConfig,
            loggingConfig: {
                logGroup: logGroup.name,
                logFormat: "Text",
            },
        }, {
            parent: this
        });
    }

    private getCodeArgs(args: SimpleNodeLambdaArgs) {
        if (!args.codeDir && !args.codeS3Folder) {
            throw new Error("Either codeDir or codeS3Folder must be provided.");
        }

        if (args.codeDir && args.codeS3Folder) {
            throw new Error("Only one of codeDir or codeS3Folder can be provided.");
        }

        return args.codeDir ? {
            description: args.codeDir.substring(args.codeDir.lastIndexOf('/') + 1),
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(args.codeDir),
            })
        } : {
            description: args.codeS3Folder!.path,
            s3Bucket: args.codeS3Folder!.bucket.bucket,
            s3Key: pulumi.interpolate`${args.codeS3Folder!.path}/function.zip`,
        };
    }
}

export interface SimpleNodeLambdaArgs extends BaseLambdaArgs {
    /**
     * A local directory with the JS source code to deploy.
     */
    codeDir?: string;

    /**
     * A S3 folder containing a function.zip file to deploy as the Lambda code.
     * Example: { bucket: myBucket, path: "backend/abcd1234" }
     */
    codeS3Folder?: S3Folder;

    /**
     * The handler name.
     * Defaults to "index.handler", which means the function will look for a index.js or index.mjs file with an exported handler function.
     */
    handler?: string;

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
