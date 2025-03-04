import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

/**
 * References assets stored in a S3 folder.
 */
export interface S3Folder {

    bucket: aws.s3.Bucket | aws.s3.BucketV2;

    /**
     * The path inside the bucket where the data is located.
     * Starts without a slash, and ends without a slash.
     * Example: "frontend/abcd1234"
     */
    path: pulumi.Input<string>;

    /**
     * If implemented, provides a convience function to register bucket policy statements.
     * 
     * Example:
     * CloudFront will need read access to a S3 folder to deliver content.
     * The StaticWebsite component will call this function once the distribution ARN is known,
     * so that bucket policies can be set up by the S3ArtifactStore.
     */
    addBucketPolicyStatement?(statement: aws.iam.PolicyStatement): void;

}
