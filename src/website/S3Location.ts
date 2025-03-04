import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

/**
 * References data stored in a S3 folder.
 * @deprecated use S3Folder
 */
export class S3Location {

    private bucket: aws.s3.Bucket | aws.s3.BucketV2;
    private path: pulumi.Output<string>;
    private requestAccess: RequestReadAccessFunction;

    constructor(bucket: aws.s3.Bucket | aws.s3.BucketV2, path: pulumi.Input<string>, requestCloudfrontReadAccess: RequestReadAccessFunction) {
        this.bucket = bucket;
        this.path = pulumi.output(path);
        this.requestAccess = requestCloudfrontReadAccess;

        this.path.apply(path => {
            if (path.startsWith('/') || path.endsWith('/')) throw Error(`Invalid path for S3Location: ${path}`);
        });
    }

    /**
     * Returns the bucket.
     */
    getBucket() {
        return this.bucket;
    }

    /**
     * Returns the path inside the bucket where the data is located.
     * Starts without a slash, and ends without a slash.
     * Example: "frontend/abcd1234"
     */
    getPath() {
        return this.path;
    };

    /**
     * If CloudFront needs read access to this data, it can be requested by calling this method.
     */
    requestCloudfrontReadAccess(distributionArn: pulumi.Input<aws.ARN>) {
        this.requestAccess(distributionArn);
    }

}

export type RequestReadAccessFunction = (distributionArn: pulumi.Input<aws.ARN>) => void;
