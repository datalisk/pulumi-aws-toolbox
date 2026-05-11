import * as pulumi from "@pulumi/pulumi";
import { getVersion } from "../ci";
import { BuildSpec } from "./BuildSpec";
import { S3ArtifactProvider } from "./provider/S3ArtifactProvider";
import { S3ArtifactStore } from "./S3ArtifactStore";
import { S3Folder } from "./S3Folder";


/**
 * Registers a CI build for the given artifact.
 * 
 * The artifact version is composed of
 * - the Git commit hash when the source dir was last changed
 * - and a hash of the build spec (commands, env vars etc).
 * 
 * The artifact will be built and deployed when the artifact version is not yet present in the S3ArtifactStore.
 * 
 * @param name logical resource name
 * @param args 
 * @returns a S3Folder instance
 */
export function createS3ArtifactBuild(name: string, args: CreateArtifactArgs): S3Folder {
    const sourceCodeVersion = pulumi.output(getVersion(args.buildSpec.sourceDir));
    const artifactVersion = pulumi.interpolate`${sourceCodeVersion}-${getBuildSpecHash(args.buildSpec)}`;

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

function getBuildSpecHash(buildSpec: BuildSpec): string {
    const json = JSON.stringify(buildSpec);
    const hash = require('crypto').createHash('sha256');
    hash.update(json);
    return hash.digest('hex').substring(0, 4);
}
