import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";
/**
 * Creates a S3 bucket where single file assets can be stored for delivery by a CloudFront distribution.
 */
export declare class SingleAssetBucket extends ComponentResource {
    readonly assets: SingleAsset[];
    private bucket;
    private name;
    private publicAccess;
    constructor(name: string, args: SingleAssetBucketArgs, opts?: ComponentResourceOptions);
    getBucket(): aws.s3.Bucket;
    /**
     * Creates a policy that allows the given distribution to read assets from the bucket.
     */
    setupAccessPolicy(distributionArn: pulumi.Input<string>): void;
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
