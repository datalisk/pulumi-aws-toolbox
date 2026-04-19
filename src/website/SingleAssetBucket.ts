import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";


/**
 * Creates a S3 bucket where single file assets can be stored for delivery by a CloudFront distribution.
 */
export class SingleAssetBucket extends ComponentResource {
    readonly assets: SingleAsset[];
    private bucket: aws.s3.Bucket;
    private name: string;
    private publicAccess: aws.s3.BucketPublicAccessBlock;

    constructor(name: string, args: SingleAssetBucketArgs, opts?: ComponentResourceOptions) {
        super("pat:website:SingleAssetBucket", name, args, opts);
        this.name = name;
        this.assets = args.assets;

        this.bucket = new aws.s3.Bucket(name, {}, { parent: this });

        const encryption = new aws.s3.BucketServerSideEncryptionConfiguration(name, {
            bucket: this.bucket.bucket,
            rules: [{
                applyServerSideEncryptionByDefault: {
                    sseAlgorithm: "AES256",
                }
            }]
        }, { parent: this });

        this.publicAccess = new aws.s3.BucketPublicAccessBlock(name, {
            bucket: this.bucket.id,
            blockPublicAcls: true,
            ignorePublicAcls: true,
        }, { parent: this });

        for (const asset of args.assets) {
            if (asset.path.includes("*") || asset.path.includes("?")) {
                throw new Error(`Wildcard '${asset.path}' is not allowed`);
            }

            new aws.s3.BucketObject(`${name}-${asset.path}`, {
                bucket: this.bucket.bucket,
                key: asset.path,
                content: asset.content,
                contentType: asset.contentType
            }, { parent: this, dependsOn: [encryption] });
        }
    }

    getBucket(): aws.s3.Bucket {
        return this.bucket;
    }

    /**
     * Creates a policy that allows the given distribution to read assets from the bucket.
     */
    setupAccessPolicy(distributionArn: pulumi.Input<string>) {
        new aws.s3.BucketPolicy(this.name, {
            bucket: this.bucket.id,
            policy: aws.iam.getPolicyDocumentOutput({
                statements: [{
                    sid: `CloudFront-Read`,
                    principals: [{
                        type: "Service",
                        identifiers: ["cloudfront.amazonaws.com"],
                    }],
                    actions: [
                        "s3:GetObject",
                        "s3:ListBucket",
                    ],
                    resources: [
                        this.bucket.arn,
                        pulumi.interpolate`${this.bucket.arn}/*`,
                    ],
                    conditions: [
                        {
                            test: "StringEquals",
                            variable: "AWS:SourceArn",
                            values: [distributionArn],
                        }
                    ],
                }],
            }).json,
        }, {
            parent: this,
            dependsOn: [this.publicAccess]
        });
    }
}

export interface SingleAssetBucketArgs {
    readonly assets: SingleAsset[];
}

export interface SingleAsset {
    /**
     * Must start with a slash.
     */
    readonly path: string;
    readonly content: pulumi.Input<string>;
    readonly contentType: string;
}
