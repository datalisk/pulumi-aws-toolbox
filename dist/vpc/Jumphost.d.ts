import * as pulumi from "@pulumi/pulumi";
import { Vpc } from "./Vpc";
/**
 * Creates a jumphost EC2 instance.
 * The instance does not expose a public SSH port. Instead we use AWS EC2 Instance Connect (EIC) for a secure connection to the jumphost.
 */
export declare class Jumphost extends pulumi.ComponentResource {
    readonly instanceId: pulumi.Output<string>;
    constructor(name: string, args: JumphostArgs, opts?: pulumi.ComponentResourceOptions);
}
export interface JumphostArgs {
    readonly vpc: Vpc;
}
