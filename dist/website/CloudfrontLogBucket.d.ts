import * as pulumi from "@pulumi/pulumi";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";
/**
 * Creates a S3 bucket to store CloudFront standard logs.
 * On deletion the bucket's content will be deleted too, so configure it as 'protected' or 'retainOnDelete' if necessary.
 */
export declare class CloudfrontLogBucket extends ComponentResource {
    readonly bucketRegionalDomainName: pulumi.Output<string>;
    constructor(name: string, args: CloudfrontLogBucketArgs, opts?: ComponentResourceOptions);
}
export interface CloudfrontLogBucketArgs {
}
