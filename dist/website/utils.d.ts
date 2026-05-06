import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
export declare function createCloudfrontDnsRecords(name: string, distribution: aws.cloudfront.Distribution, zoneId: pulumi.Input<string>, subDomain?: pulumi.Input<string>, opts?: pulumi.ComponentResourceOptions): void;
export declare const defaultSecurityHeadersConfig: aws.types.input.cloudfront.ResponseHeadersPolicySecurityHeadersConfig;
/**
 * Returns a policy statement to grant CloudFront read access to the given bucket path.
 * @param pathPattern e.g. '*' or 'content/*'
 */
export declare function createBucketPolicyStatement(bucketArn: pulumi.Input<string>, distributionArn: pulumi.Input<string>, pathPattern: pulumi.Input<string>): aws.iam.PolicyStatement;
