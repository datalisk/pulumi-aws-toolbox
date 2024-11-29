import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";
import { S3Artifact } from "./S3Artifact";


/**
 * Creates a S3 bucket where build artifacts can be stored.
 */
export class S3ArtifactStore extends ComponentResource {
    private args: S3ArtifactStoreArgs;
    private bucket: aws.s3.BucketV2;
    private name: string;
    private publicAccess: aws.s3.BucketPublicAccessBlock;
    private readAccessRequests: ReadAccessRequest[];

    constructor(name: string, args: S3ArtifactStoreArgs, opts?: ComponentResourceOptions) {
        super("pat:build:S3ArtifactStore", name, args, opts);
        this.args = args;
        this.name = name;
        this.readAccessRequests = [];

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
     * Returns a S3Artifact object for the given version that links to the storage location in S3.
     * The referenced artifact may not exist yet at the storage location.
     */
    getArtifactVersion(version: string): S3Artifact {
        const path = `${this.args.artifactName}/${version}`;
        return new S3Artifact(this.bucket, this.args.artifactName, version, (arn) => {
            this.readAccessRequests.push({ distributionArn: arn, path });
        });
    }

    /**
     * Creates a bucket resource policy based on registered read access requests, for example, to allow a StaticWebsite resource to access the stored assets.
     */
    createBucketPolicy() {
        new aws.s3.BucketPolicy(this.name, {
            bucket: this.bucket.id,
            // TODO migrate to PolicyDocument.Statement notation (see vb backend-service.ts)
            policy: aws.iam.getPolicyDocumentOutput({
                statements: this.readAccessRequests.map((request, requestIndex) => ({
                    sid: `ReadAccessRequest-${requestIndex}`,
                    principals: [{
                        type: "Service",
                        identifiers: ["cloudfront.amazonaws.com"],
                    }],
                    actions: [
                        "s3:GetObject",
                        "s3:ListBucket",
                    ],
                    resources: [
                        pulumi.interpolate`${this.bucket.arn}`,
                        pulumi.interpolate`${this.bucket.arn}/${request.path}/*`,
                    ],
                    conditions: [
                        {
                            test: "StringEquals",
                            variable: "AWS:SourceArn",
                            values: [request.distributionArn],
                        }
                    ],
                })),
            }).json,
        }, {
            parent: this,
            dependsOn: [this.publicAccess]
        });
    }

    getBucketName() {
        return this.bucket.bucket;
    }
}

export interface S3ArtifactStoreArgs {
    readonly artifactName: string;
}

interface ReadAccessRequest {
    distributionArn: pulumi.Input<string>
    path: string;
}
