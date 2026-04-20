import * as aws from "@pulumi/aws";
export declare function assumeRolePolicyForAwsService(serviceName: AwsService): aws.iam.PolicyDocument;
export type AwsService = "lambda";
