import * as pulumi from "@pulumi/pulumi";
import { BuildSpec } from '../BuildSpec.js';
import { executeCommand } from './build-utils.js';
import { isFolderPresent, s3PutFolder } from "./deploy-utils.js";

export class S3ArtifactProvider implements pulumi.dynamic.ResourceProvider<Inputs, Outputs> {
    private artifactExists = false;

    async check(_: Inputs, news: Inputs) {
        this.artifactExists = await isFolderPresent(news.bucketName, news.bucketPath);
        console.log(`Artifact ${this.artifactExists ? 'already exists' : 'does not exist'} at s3://${news.bucketName}/${news.bucketPath}`);
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
            console.log(`No build required. Using existing artifact.`)
        }

        const outs: Outputs = {};
        return { id, outs };
    }

    private async buildAndDeploy(args: Inputs) {
        for (const cmd of args.buildSpec.commands) {
            console.log(`Executing ${cmd}`);
            await executeCommand(args.buildSpec.sourceDir, cmd);
        }

        console.log(`Uploading artifact to s3://${args.bucketName}/${args.bucketPath}`);
        await s3PutFolder(args.buildSpec.outputDir, args.bucketName, args.bucketPath);
    }

}

interface Inputs {
    bucketName: string;
    bucketPath: string;
    buildSpec: BuildSpec;
}

interface Outputs {
}
