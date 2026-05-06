import { ComponentResource, ComponentResourceOptions, Output } from "@pulumi/pulumi";
import { IVpc } from "./Vpc";
/**
 * A simple security group for many standard cases.
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
