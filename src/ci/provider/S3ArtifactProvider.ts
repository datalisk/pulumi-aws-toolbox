import * as pulumi from "@pulumi/pulumi";
import { executeCommand } from './build-utils.js';
import { isFolderPresent, s3PutFolder } from "./deploy-utils.js";

export class S3ArtifactProvider implements pulumi.dynamic.ResourceProvider<Inputs, Outputs> {
    private artifactExists = false;

    async check(_: Inputs, news: Inputs) {
        this.artifactExists = await isFolderPresent(news.bucketName, news.bucketPath);
        console.log(`${this.describe(news)}: ${this.artifactExists ? 'Already exists' : 'Does not exist'}`);
        return {};
    }

    async diff(): Promise<pulumi.dynamic.DiffResult> {
        if (this.artifactExists) {
            // do nothing
            return {};
        } else {
            // force replacement (create-delete)
            return {
                replaces: ["bucketPath"]
            };
        }
    }

    async create(args: Inputs) {
        const id = `${args.bucketName}:${args.bucketPath}`;

        if (!this.artifactExists) {
            await this.buildAndDeploy(args);
        } else {
            // another dev stack may have already built/deployed it
            console.log(`${this.describe(args)}: Using existing artifact.`)
        }

        const outs: Outputs = {};
        return { id, outs };
    }

    private async buildAndDeploy(args: Inputs) {
        for (const cmd of args.buildSpec.commands) {
            console.log(`${this.describe(args)}: Executing ${cmd}`);
            const envs = args.buildSpec.environmentVariables ?? {};
            await executeCommand(args.buildSpec.sourceDir, cmd, envs);
        }

        console.log(`${this.describe(args)}: Uploading...`);
        await s3PutFolder(args.buildSpec.outputDir, args.bucketName, args.bucketPath);
        console.log(`${this.describe(args)}: Uploaded`);
    }

    private describe(args: Inputs): string {
        return `Artifact ${args.bucketPath}`;
    }

}

interface Inputs {
    bucketName: string;
    bucketPath: string;
    buildSpec: ProviderBuildSpec;
}

interface ProviderBuildSpec {
    readonly sourceDir: string;

    readonly commands: string[];

    readonly environmentVariables?: {
        [key: string]: string;
    };

    /**
     * The path of the directory that will be used for the artifact's content.
     */
    readonly outputDir: string;
}


interface Outputs {
}
