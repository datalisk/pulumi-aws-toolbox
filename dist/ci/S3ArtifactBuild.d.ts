import * as pulumi from "@pulumi/pulumi";
import { BuildSpec } from "./BuildSpec";
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
export declare function createS3ArtifactBuild(name: string, args: CreateArtifactArgs): S3Folder;
export interface CreateArtifactArgs {
    artifactStore: S3ArtifactStore;
    artifactName: pulumi.Input<string>;
    buildSpec: BuildSpec;
}
