import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { ComponentResourceOptions } from "@pulumi/pulumi";
import { assumeRolePolicyForAwsService } from "../util/iam";
import { IVpc, StdSecurityGroup } from "../vpc";

/**
 * Builer that makes it easier to create a AWS Lambda.
 * Can be used to create a log group, role, and VPC config that can be used to construct the actual lambda function.
 */
export class Builder {
    name: string;
    args: BaseLambdaArgs;
    opts?: ComponentResourceOptions;

    constructor(name: string, args: BaseLambdaArgs, opts?: ComponentResourceOptions) {
        this.name = name;
        this.args = args;
        this.opts = opts;
    }

    createLogGroup() {
        return new aws.cloudwatch.LogGroup(this.name, {
            name: pulumi.interpolate`/aws/lambda/${this.name}`,
            retentionInDays: 365,
        }, this.opts);
    }

    createRole() {
        const role = new aws.iam.Role(`${this.name}-execute`, {
            assumeRolePolicy: assumeRolePolicyForAwsService("lambda"),
        }, this.opts);

        // attach execution policy for VPC and logging
        if (this.args.vpc != undefined) {
            new aws.iam.RolePolicyAttachment(`${this.name}-execute`, {
                role: role,
                policyArn: aws.iam.ManagedPolicy.AWSLambdaVPCAccessExecutionRole,
            }, this.opts);
        } else {
            new aws.iam.RolePolicyAttachment(`${this.name}-execute`, {
                role: role,
                policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
            }, this.opts);
        }

        // create user policies - not using 'inlinePolicies' property because removal behavior is exteremly suprising
        this.args.roleManagedPolicies?.forEach((policyArn, index) => {
            new aws.iam.RolePolicyAttachment(`${this.name}-${index}`, {
                role: role,
                policyArn,
            }, this.opts);
        });
        this.args.roleInlinePolicies?.forEach(inlinePolicy => {
            new aws.iam.RolePolicy(`${this.name}-${inlinePolicy.name}`, {
                role: role,
                policy: inlinePolicy.policy,
            }, this.opts);
        });

        return role;
    }

    createVpcConfig(): aws.types.input.lambda.FunctionVpcConfig | undefined {
        if (this.args.vpc != undefined) {
            const sg = new StdSecurityGroup(this.name, {
                vpc: this.args.vpc,
                ingressPorts: [],
                publicIngress: false,
            });

            return {
                subnetIds: this.args.vpc.privateSubnetIds,
                securityGroupIds: [sg.securityGroupId],
                ipv6AllowedForDualStack: true,
            };
        } else {
            return undefined;
        }
    }
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
