import * as pulumi from "@pulumi/pulumi";
import { ComponentResourceOptions } from "@pulumi/pulumi";
import { SimpleNodeLambda } from "../lambda";
/**
 * Creates a AWS Lambda to send email using SES.
 *
 * It acts as a proxy for the SendRawEmail command, allowing you
 *  - to send email from a private subnet using IPv6 (SES doesn't support IPv6 yet)
 *  - to send email from a different account by assuming another role.
 *
 * You can control who can send email, by configuring who can invoke this lambda.
 * If 'assumeRoleArn' isn't specified the lambda can send email via any configured SES identity.
 */
export declare class SesProxyMailer extends SimpleNodeLambda {
    constructor(name: string, args: SesProxyMailerArgs, opts?: ComponentResourceOptions);
}
export interface SesProxyMailerArgs {
    assumeRoleArn?: pulumi.Input<string>;
    /**
     * Optionally, specify which regional SES service to use.
     */
    region?: pulumi.Input<string>;
}
