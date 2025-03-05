import * as pulumi from "@pulumi/pulumi";
import { getVersion } from "../build";
import { BuildSpec } from "./BuildSpec";
import { S3ArtifactProvider } from "./provider/S3ArtifactProvider";
import { S3ArtifactStore } from "./S3ArtifactStore";
import { S3Folder } from "./S3Folder";


/**
 * Registers a CI build for the given artifact.
 * 
 * Highly experimental API! Will likely change.
 * 
 * @param name logical resource name
 * @param args 
 * @returns a S3Folder instance
 */
export function createS3ArtifactBuild(name: string, args: CreateArtifactArgs): S3Folder {
    const artifactVersion = pulumi.output(getVersion(args.buildSpec.sourceDir));
    const artifact = args.artifactStore.getArtifact(args.artifactName, artifactVersion);

    new S3ArtifactBuild(name, {
        bucketName: artifact.bucket.bucket,
        bucketPath: artifact.path,
        buildSpec: args.buildSpec,
    });

    return artifact;
}

export interface CreateArtifactArgs {
    artifactStore: S3ArtifactStore,
    artifactName: pulumi.Input<string>;
    buildSpec: BuildSpec;
}

class S3ArtifactBuild extends pulumi.dynamic.Resource {
    constructor(name: string, args: S3ArtifactBuildArgs, opts?: pulumi.CustomResourceOptions) {
        const outs = {
            ...args
        };
        super(new S3ArtifactProvider, name, outs, opts);
    }
}

interface S3ArtifactBuildArgs {
    bucketName: pulumi.Input<string>;
    bucketPath: pulumi.Input<string>;
    buildSpec: BuildSpec;
}
