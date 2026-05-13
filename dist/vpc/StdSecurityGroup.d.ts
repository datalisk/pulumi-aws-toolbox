import { ComponentResource, ComponentResourceOptions, Output } from "@pulumi/pulumi";
import { IVpc } from "./Vpc";
/**
 * A simple security group that
 * - allows ingress on the specified ports from either the public internet or the VPC CIDR block
 * - allows all egress traffic to any destination
 */
export declare class StdSecurityGroup extends ComponentResource {
    readonly name: string;
    readonly securityGroupId: Output<string>;
    constructor(name: string, args: StdSecurityGroupArgs, opts?: ComponentResourceOptions);
}
export interface StdSecurityGroupArgs {
    readonly ingressPorts: number[];
    readonly publicIngress: boolean;
    readonly vpc: IVpc;
}
