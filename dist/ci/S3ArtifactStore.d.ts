import * as pulumi from "@pulumi/pulumi";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";
import { S3Folder } from "./S3Folder";
/**
 * Creates a S3 bucket where CI build artifacts can be stored.
 */
export declare class S3ArtifactStore extends ComponentResource {
    private bucket;
    private name;
    private publicAccess;
    private policyStatements;
    private allowAddPolicyStatements;
    constructor(name: string, args?: S3ArtifactStoreArgs, opts?: ComponentResourceOptions);
    /**
     * Returns a S3Folder that contains a build artifact in S3.
     */
    getArtifact(artifactName: pulumi.Input<string>, version: pulumi.Input<string>): S3Folder;
    private getFolderByPath;
    private addPolicyStatement;
    /**
     * Creates a bucket resource policy for the added policy statements.
     */
    createBucketPolicy(): void;
    getBucketName(): pulumi.Output<string>;
}
export interface S3ArtifactStoreArgs {
    readonly artifactName?: string;
}
