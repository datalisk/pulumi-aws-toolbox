import * as pulumi from "@pulumi/pulumi";
import { BuildSpec } from "./BuildSpec";
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
export declare function createS3ArtifactBuild(name: string, args: CreateArtifactArgs): S3Folder;
export interface CreateArtifactArgs {
    artifactStore: S3ArtifactStore;
    artifactName: pulumi.Input<string>;
    buildSpec: BuildSpec;
}
