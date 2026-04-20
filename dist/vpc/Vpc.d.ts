import * as pulumi from "@pulumi/pulumi";
import { ComponentResource, ComponentResourceOptions, Output } from "@pulumi/pulumi";
/**
 * Design:
 *  - Creates public and private subnets for three availability zones.
 *  - Focused on use of IPv6 instead of IPv4 (no NAT gateways provided)
 *
 * Resources in a public subnet:
 *  - can be reached from the internet (via IPv4 and IPv6)
 *  - can communicate to the internet (via IPv4 and IPv6)
 *  - for IPv4, resources need to have a public IPv4 address (not supported by AWS Lambda)
 *
 * Resources in a private subnet:
 *  - cannot be reached from the internet
 *  - can communicate to the internet only via IPv6
 *  - applications in a private subnet may have to be configured to prefer IPv6 addresses over IPv4
 */
export declare class Vpc extends ComponentResource implements IVpc {
    readonly cidrIpv4: string;
    readonly cidrIpv6: Output<string>;
    readonly ipv4MaskBits: number;
    readonly name: string;
    readonly privateSubnetIds: Output<string>[];
    readonly publicSubnetIds: Output<string>[];
    readonly vpcId: Output<string>;
    private readonly eicSecurityGroup;
    private readonly subnets;
    private readonly vpc;
    constructor(name: string, args: VpcArgs, opts?: ComponentResourceOptions);
    getSubnet(subnetId: pulumi.Input<string>): import("@pulumi/aws/ec2/subnet").Subnet;
    private createPublicSubnet;
    private createPrivateSubnet;
    /**
     * Adds a rule to the given StdSecurityGroup that allows traffic from the EIC.
     */
    grantEicIngressFor(name: string, securityGroupId: pulumi.Output<string>): void;
    private computeSubnetIpv4Cidr;
    private createInstanceConnectEndpoint;
}
export interface VpcArgs {
    /**
     * How many bits the IPv4 address should have, e.g. 24 which would mean the public subnet for zone A would get CIDR 10.0.0.0/24.
     * Allowed range: 20 - 24
     * Default: 22
     */
    readonly ipv4MaskBits?: number;
    /**
     * If set, uses the given IPAM IPv6 pool. Otherwise a Amazon-provided IPv6 CIDR block is used.
     */
    readonly ipv6IpamPoolId?: pulumi.Input<string>;
}
/**
 * VPC interface to support other VPC components as well like awsx Crosswalk.
 */
export interface IVpc {
    readonly cidrIpv4: pulumi.Input<string>;
    readonly cidrIpv6: pulumi.Input<string>;
    readonly privateSubnetIds: pulumi.Input<string>[];
    readonly publicSubnetIds: pulumi.Input<string>[];
    readonly vpcId: pulumi.Input<string>;
}
