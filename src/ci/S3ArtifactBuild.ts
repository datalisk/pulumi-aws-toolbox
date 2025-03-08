import * as pulumi from "@pulumi/pulumi";
import { getVersion } from "../build";
import { BuildSpec } from "./BuildSpec";
import { S3ArtifactProvider } from "./provider/S3ArtifactProvider";
import { S3ArtifactStore } from "./S3ArtifactStore";
import { S3Folder } from "./S3Folder";


/**
 * Registers a CI build for the given artifact.
 * 
 * The artifact version is the Git commit hash when the source dir was last changed.
 * The artifact will be built and deployed when the artifact version is not yet present in the S3ArtifactStore.
 * Therfore, only new commits that change the source dir will trigger a rebuild.
 *  
 * EXPERIMENTAL! This API may change!
 * 
 * @param name logical resource name
 * @param args 
 * @returns a S3Folder instance
 */
export function createS3ArtifactBuild(name: string, args: CreateArtifactArgs): S3Folder {
    const artifactVersion = pulumi.output(getVersion(args.buildSpec.sourceDir));
    const artifact = args.artifactStore.getArtifact(args.artifactName, artifactVersion);

    const build = new S3ArtifactBuild(name, {
        bucketName: artifact.bucket.bucket,
        bucketPath: artifact.path,
        buildSpec: args.buildSpec,
    });

    // return a S3Folder instance, that depends on the build.
    // ensures CloudFront etc doesn't get updated before the build succeeds.
    return args.artifactStore.getArtifact(args.artifactName, build.id.apply(() => artifactVersion));
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
