import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { ComponentResourceOptions } from "@pulumi/pulumi";
import { IVpc } from "../vpc";
/**
 * Builer that makes it easier to create a AWS Lambda.
 * Can be used to create a log group, role, and VPC config that can be used to construct the actual lambda function.
 */
export declare class Builder {
    name: string;
    args: BaseLambdaArgs;
    opts?: ComponentResourceOptions;
    constructor(name: string, args: BaseLambdaArgs, opts?: ComponentResourceOptions);
    createLogGroup(): import("@pulumi/aws/cloudwatch/logGroup").LogGroup;
    createRole(): import("@pulumi/aws/iam/role").Role;
    createVpcConfig(): aws.types.input.lambda.FunctionVpcConfig | undefined;
}
export interface BaseLambdaArgs {
    /**
     * Inline policies for the Lambda function.
     */
    roleInlinePolicies?: RoleInlinePolicy[];
    /**
     * Additional managed policys for the lambda function.
     * Policies to write to the CloudWatch log group and to use the VPC (if relevant) are added automatically.
     */
    roleManagedPolicies?: string[];
    /**
     * If specified, the Lambda will be created using the VPC's private subnets.
     */
    vpc?: IVpc;
}
export interface RoleInlinePolicy {
    /**
     * Name of the role policy.
     */
    name: pulumi.Input<string>;
    /**
     * Policy document as a JSON formatted string.
     */
    policy: pulumi.Input<string | aws.iam.PolicyDocument>;
}
