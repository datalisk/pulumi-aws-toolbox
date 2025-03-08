import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";
import { S3Folder } from "./S3Folder";


/**
 * Creates a S3 bucket where CI build artifacts can be stored.
 * 
 * EXPERIMENTAL! May change or be removed again!
 */
export class S3ArtifactStore extends ComponentResource {
    private bucket: aws.s3.BucketV2;
    private name: string;
    private publicAccess: aws.s3.BucketPublicAccessBlock;
    private policyStatements: aws.iam.PolicyStatement[];
    private allowAddPolicyStatements = true;

    constructor(name: string, args?: S3ArtifactStoreArgs, opts?: ComponentResourceOptions) {
        super("pat:ci:S3ArtifactStore", name, args, {
            ...opts,
            aliases: [
                { type: "pat:build:S3ArtifactStore" }
            ]
        });

        this.name = name;
        this.policyStatements = [];

        this.bucket = new aws.s3.BucketV2(name, {
            forceDestroy: true,
        }, {
            parent: this,
            protect: opts?.protect,
        });

        new aws.s3.BucketServerSideEncryptionConfigurationV2(name, {
            bucket: this.bucket.bucket,
            rules: [{
                applyServerSideEncryptionByDefault: {
                    sseAlgorithm: "AES256",
                }
            }]
        }, { parent: this });

        new aws.s3.BucketVersioningV2(name, {
            bucket: this.bucket.bucket,
            versioningConfiguration: {
                status: "Enabled",
            },
        }, { parent: this });

        new aws.s3.BucketLifecycleConfigurationV2(name, {
            bucket: this.bucket.bucket,
            rules: [{
                id: "deleteOldVersions",
                status: 'Enabled',
                noncurrentVersionExpiration: {
                    noncurrentDays: 90,
                }
            }]
        }, { parent: this });

        this.publicAccess = new aws.s3.BucketPublicAccessBlock(name, {
            bucket: this.bucket.id,
            blockPublicAcls: true,
            ignorePublicAcls: true,
        }, { parent: this });
    }

    /**
     * Returns a S3Folder that contains a build artifact in S3.
     */
    getArtifact(artifactName: pulumi.Input<string>, version: pulumi.Input<string>): S3Folder {
        const path = pulumi.interpolate`${artifactName}/${version}`;
        return this.getFolderByPath(path);
    }

    private getFolderByPath(path: pulumi.Input<string>): S3Folder {
        return {
            bucket: this.bucket,
            path: path,
            addBucketPolicyStatement: (statement) => {
                this.addPolicyStatement(statement);
            },
        };
    }

    private addPolicyStatement(statement: aws.iam.PolicyStatement) {
        if (!this.allowAddPolicyStatements) {
            throw new Error(`Not allowed to add policies - createBucketPolicy has already been called`);
        }
        this.policyStatements.push(statement);
    }

    /**
     * Creates a bucket resource policy for the added policy statements.
     */
    createBucketPolicy() {
        this.allowAddPolicyStatements = false;

        if (this.policyStatements.length > 0) {
            new aws.s3.BucketPolicy(this.name, {
                bucket: this.bucket.id,
                policy: {
                    Version: "2012-10-17",
                    Statement: this.policyStatements,
                },
            }, {
                parent: this,
                dependsOn: [this.publicAccess]
            });
        }
    }

    getBucketName() {
        return this.bucket.bucket;
    }
}

export interface S3ArtifactStoreArgs {
    readonly artifactName?: string;
}
