import * as aws from "@pulumi/aws";
import * as awsInputs from "@pulumi/aws/types/input";
import * as pulumi from "@pulumi/pulumi";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";
import { assumeRolePolicyForAwsService } from "../util/iam";
import { IVpc, StdSecurityGroup } from "../vpc";

/**
 * Base class that makes it easier to create a AWS Lambda.
 * Creates a log group, role that can be used to construct the actual Function.
 */
export abstract class BaseLambda extends ComponentResource {
    readonly functionArn: pulumi.Output<string>;
    readonly functionName: pulumi.Output<string>;

    constructor(name: string, args: BaseLambdaArgs, opts?: ComponentResourceOptions, type?: string) {
        super(type ?? "pat:lambda:BaseLambda", name, args, opts);

        const logGroup = new aws.cloudwatch.LogGroup(name, {
            name: pulumi.interpolate`/aws/lambda/${name}`,
            retentionInDays: 365,
        }, { parent: this });

        const role = new aws.iam.Role(name, {
            assumeRolePolicy: assumeRolePolicyForAwsService("lambda"),
            managedPolicyArns: [
                (args.vpc != undefined ? aws.iam.ManagedPolicies.AWSLambdaVPCAccessExecutionRole : aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole),
                ...(args.roleManagedPolicies ?? []),
            ],
            inlinePolicies: args.roleInlinePolicies,
        }, { parent: this });

        const vpcConfig = args.vpc != undefined ? (() => {
            const sg = new StdSecurityGroup(name, {
                vpc: args.vpc,
                ingressPorts: [],
                publicIngress: false,
            });

            return {
                subnetIds: args.vpc.privateSubnetIds,
                securityGroupIds: [sg.securityGroupId],
                ipv6AllowedForDualStack: true,
            };
        })() : undefined;

        const func = new aws.lambda.Function(name,
            args.build(logGroup, role.arn, vpcConfig)
            , {
                dependsOn: [logGroup],
                parent: this
            });

        this.functionArn = func.arn;
        this.functionName = func.name;
    }
}

export interface BaseLambdaArgs {

    build: (logGroup: aws.cloudwatch.LogGroup, roleArn: pulumi.Input<aws.ARN>, vpcConfig?: aws.types.input.lambda.FunctionVpcConfig) => aws.lambda.FunctionArgs;

    roleInlinePolicies?: pulumi.Input<pulumi.Input<awsInputs.iam.RoleInlinePolicy>[]>;

    /**
     * Additional managed policys for the lambda. A policy to write to Cloudwatch Logs is added automatically.
     */
    roleManagedPolicies?: aws.ARN[];

    /**
     * If specified, the Lambda will created using the VPC's private subnets.
     */
    vpc?: IVpc;

}