import * as aws from "@pulumi/aws";
import { ComponentResource, ComponentResourceOptions, Output } from "@pulumi/pulumi";
import { IVpc } from "./Vpc";

/**
 * A simple security group that
 * - allows ingress on the specified ports from either the public internet or the VPC CIDR block
 * - allows all egress traffic to any destination
 */
export class StdSecurityGroup extends ComponentResource {
    readonly name: string;
    readonly securityGroupId: Output<string>;

    constructor(name: string, args: StdSecurityGroupArgs, opts?: ComponentResourceOptions) {
        super("pat:vpc:StdSecurityGroup", name, args, opts);
        this.name = name;

        const sg = new aws.ec2.SecurityGroup(name, {
            vpcId: args.vpc.vpcId,
            description: name,
        }, { parent: this });
        this.securityGroupId = sg.id;

        for (const port of args.ingressPorts) {
            new aws.vpc.SecurityGroupIngressRule(`${name}-ipv4-${port}`, {
                securityGroupId: sg.id,
                ipProtocol: "tcp",
                fromPort: port,
                toPort: port,
                cidrIpv4: args.publicIngress ? "0.0.0.0/0" : args.vpc.cidrIpv4,
            }, { parent: this });

            new aws.vpc.SecurityGroupIngressRule(`${name}-ipv6-${port}`, {
                securityGroupId: sg.id,
                ipProtocol: "tcp",
                fromPort: port,
                toPort: port,
                cidrIpv6: args.publicIngress ? "::/0" : args.vpc.cidrIpv6,
            }, { parent: this });
        }

        new aws.vpc.SecurityGroupEgressRule(`${name}-ipv4`, {
            securityGroupId: sg.id,
            ipProtocol: "tcp",
            fromPort: 0,
            toPort: 65535,
            cidrIpv4: "0.0.0.0/0",
        }, { parent: this });

        new aws.vpc.SecurityGroupEgressRule(`${name}-ipv6`, {
            securityGroupId: sg.id,
            ipProtocol: "tcp",
            fromPort: 0,
            toPort: 65535,
            cidrIpv6: "::/0",
        }, { parent: this });
    }
}

export interface StdSecurityGroupArgs {
    readonly ingressPorts: number[];
    readonly publicIngress: boolean;
    readonly vpc: IVpc;
}
