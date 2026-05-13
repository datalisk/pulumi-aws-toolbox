import * as aws from "@pulumi/aws";
import * as awsNative from "@pulumi/aws-native";
import * as pulumi from "@pulumi/pulumi";
import { ComponentResource, ComponentResourceOptions, Output } from "@pulumi/pulumi";
import { computeSubnetIpv6Cidr } from "./cidr";

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
export class Vpc extends ComponentResource implements IVpc {
    readonly cidrIpv4: string;
    readonly cidrIpv6: Output<string>;
    readonly ipv4MaskBits: number;
    readonly name: string;
    readonly privateSubnetIds: Output<string>[];
    readonly publicSubnetIds: Output<string>[];
    readonly vpcId: Output<string>;

    private readonly eicSecurityGroup: aws.ec2.SecurityGroup;
    private readonly subnets: aws.ec2.Subnet[];
    private readonly vpc: aws.ec2.Vpc;

    constructor(name: string, args: VpcArgs, opts?: ComponentResourceOptions) {
        super("pat:vpc:Vpc", name, args, opts);
        this.cidrIpv4 = "10.0.0.0/16";
        this.name = name;

        if (args.ipv4MaskBits && (args.ipv4MaskBits < 20 || args.ipv4MaskBits > 24)) {
            throw new Error("Unsupported ipv4MaskBits value");
        }
        this.ipv4MaskBits = args.ipv4MaskBits || 22;

        this.vpc = new aws.ec2.Vpc(name, {
            cidrBlock: this.cidrIpv4,
            enableDnsSupport: true,
            enableDnsHostnames: true,
            assignGeneratedIpv6CidrBlock: args.ipv6IpamPoolId ? undefined : true,
            ipv6IpamPoolId: args.ipv6IpamPoolId,
            ipv6NetmaskLength: args.ipv6IpamPoolId ? 56 : undefined,
            tags: {
                Name: name
            }
        }, { parent: this });
        this.vpcId = this.vpc.id;

        const internetGateway = new aws.ec2.InternetGateway(`${name}-igw`, {
            vpcId: this.vpc.id,
            tags: {
                Name: `${name}-igw`,
            },
        }, { parent: this });

        const ipv6EgressGateway = new aws.ec2.EgressOnlyInternetGateway(`${name}-ipv6-egw`, {
            vpcId: this.vpc.id,
            tags: {
                Name: `${name}-ipv6-egw`,
            },
        }, { parent: this });

        const publicSubnets = [
            this.createPublicSubnet("a", this.vpc, internetGateway),
            this.createPublicSubnet("b", this.vpc, internetGateway),
            this.createPublicSubnet("c", this.vpc, internetGateway),
        ];

        const privateSubnets = [
            this.createPrivateSubnet("a", this.vpc, ipv6EgressGateway),
            this.createPrivateSubnet("b", this.vpc, ipv6EgressGateway),
            this.createPrivateSubnet("c", this.vpc, ipv6EgressGateway),
        ];

        this.cidrIpv6 = this.vpc.ipv6CidrBlock;
        this.privateSubnetIds = privateSubnets.map(subnet => subnet.id);
        this.publicSubnetIds = publicSubnets.map(subnet => subnet.id);
        this.subnets = publicSubnets.concat(privateSubnets);

        const eic = this.createInstanceConnectEndpoint(this.privateSubnetIds[0]);
        this.eicSecurityGroup = eic.sg;
    }

    getSubnet(subnetId: pulumi.Input<string>) {
        const subnet = this.subnets.find(subnet => subnet.id === subnetId);
        if (!subnet) throw new Error(`Subnet ${subnetId} not found`);
        return subnet;
    }

    private createPublicSubnet(az: string, vpc: aws.ec2.Vpc, internetGateway: aws.ec2.InternetGateway) {
        const name = `${this.name}-${az}-public`;
        const subnetIndex = az.charCodeAt(0) - 'a'.charCodeAt(0); // a->0, b->1 etc.
        const ipv4CidrBlock = this.computeSubnetIpv4Cidr(subnetIndex);
        const ipv6CidrBlock = vpc.ipv6CidrBlock.apply(networkCidr => computeSubnetIpv6Cidr(networkCidr, subnetIndex));

        const subnet = new aws.ec2.Subnet(name, {
            vpcId: vpc.id,
            availabilityZone: pulumi.interpolate`${aws.getRegionOutput().name}${az}`,
            cidrBlock: ipv4CidrBlock,
            ipv6CidrBlock: ipv6CidrBlock,
            mapPublicIpOnLaunch: false,
            assignIpv6AddressOnCreation: true,
            tags: {
                Name: name
            },
        }, {
            parent: this,
            deleteBeforeReplace: true,
        });

        const routeTable = new aws.ec2.RouteTable(name, {
            vpcId: vpc.id,
            routes: [
                {
                    cidrBlock: "0.0.0.0/0",
                    gatewayId: internetGateway.id
                },
                {
                    ipv6CidrBlock: "::/0",
                    gatewayId: internetGateway.id
                },
            ],
            tags: {
                Name: name
            },
        }, { parent: this });

        new aws.ec2.RouteTableAssociation(name, {
            subnetId: subnet.id,
            routeTableId: routeTable.id,
        }, { parent: this });

        return subnet;
    }

    private createPrivateSubnet(az: string, vpc: aws.ec2.Vpc, ipv6EgressGateway: aws.ec2.EgressOnlyInternetGateway) {
        const name = `${this.name}-${az}-private`;
        const subnetIndex = (az.charCodeAt(0) - 'a'.charCodeAt(0)) + 3; // a->3, b->4 etc.
        const ipv4CidrBlock = this.computeSubnetIpv4Cidr(subnetIndex);
        const ipv6CidrBlock = vpc.ipv6CidrBlock.apply(networkCidr => computeSubnetIpv6Cidr(networkCidr, subnetIndex));

        const subnet = new aws.ec2.Subnet(name, {
            vpcId: vpc.id,
            availabilityZone: pulumi.interpolate`${aws.getRegionOutput().name}${az}`,
            cidrBlock: ipv4CidrBlock,
            ipv6CidrBlock: ipv6CidrBlock,
            mapPublicIpOnLaunch: false,
            assignIpv6AddressOnCreation: true,
            tags: {
                Name: name
            },
        }, {
            parent: this,
            deleteBeforeReplace: true,
        });

        const routeTable = new aws.ec2.RouteTable(name, {
            vpcId: vpc.id,
            routes: [
                {
                    ipv6CidrBlock: "::/0",
                    egressOnlyGatewayId: ipv6EgressGateway.id,
                },
            ],
            tags: {
                Name: name
            },
        }, { parent: this });

        new aws.ec2.RouteTableAssociation(name, {
            subnetId: subnet.id,
            routeTableId: routeTable.id,
        }, { parent: this });

        return subnet;
    }

    /**
     * Adds a rule to the given security group that allows traffic from the EIC.
     */
    grantEicIngressFor(name: string, securityGroupId: pulumi.Input<string>) {
        new aws.vpc.SecurityGroupIngressRule(name, {
            securityGroupId: securityGroupId,
            ipProtocol: "tcp",
            fromPort: 22,
            toPort: 22,
            referencedSecurityGroupId: this.eicSecurityGroup.id,
        }, { parent: this });
    }

    private computeSubnetIpv4Cidr(subnetIndex: number) {
        // ipv4MaskBits 24 -> 1
        // ipv4MaskBits 23 -> 2
        // ipv4MaskBits 22 -> 4
        // ipv4MaskBits 21 -> 8
        // ipv4MaskBits 20 -> 16
        const multiplier = Math.pow(2, 24 - this.ipv4MaskBits);
        return `10.0.${subnetIndex * multiplier}.0/${this.ipv4MaskBits}`;
    }

    private createInstanceConnectEndpoint(subnetId: pulumi.Input<string>) {
        const sg = new aws.ec2.SecurityGroup(`${this.name}-eic`, {
            vpcId: this.vpc.id,
        }, { parent: this });

        new aws.vpc.SecurityGroupEgressRule(`${this.name}-eic-ipv4`, {
            securityGroupId: sg.id,
            ipProtocol: "tcp",
            fromPort: 0,
            toPort: 65535,
            cidrIpv4: this.cidrIpv4,
        }, { parent: this });

        new awsNative.ec2.InstanceConnectEndpoint(this.name, {
            subnetId: subnetId,
            securityGroupIds: [sg.id],
            tags: [
                {
                    key: "Name",
                    value: this.name,
                }
            ],
        }, { parent: this });

        return {
            sg,
        }
    }

    // private createNatGateway(name: string, subnet: aws.ec2.Subnet) {
    //     const natGwIp = new aws.ec2.Eip(name, {
    //         domain: "vpc",
    //         tags: {
    //             Name: name
    //         }
    //     }, { parent: this });
    //     const natGateway = new aws.ec2.NatGateway(name, {
    //         allocationId: natGwIp.id,
    //         subnetId: subnet.id,
    //         tags: {
    //             Name: name
    //         },
    //     }, { parent: this });
    //     return natGateway;
    // }
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
