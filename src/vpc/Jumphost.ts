import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { StdSecurityGroup } from "./StdSecurityGroup";
import { Vpc } from "./Vpc";

/**
 * Creates a jumphost EC2 instance.
 * The instance does not expose a public SSH port. Instead we use AWS EC2 Instance Connect (EIC) for a secure connection to the jumphost.
 */
export class Jumphost extends pulumi.ComponentResource {
    readonly instanceId: pulumi.Output<string>;

    constructor(name: string, args: JumphostArgs, opts?: pulumi.ComponentResourceOptions) {
        super("pat:vpc:Jumphost", name, args, opts);

        const jumphostSubnetId = args.vpc.privateSubnetIds[0];

        const jumphostSg = new StdSecurityGroup(name, {
            vpc: args.vpc,
            ingressPorts: [],
            publicIngress: false,
        }, { parent: this });

        new aws.vpc.SecurityGroupIngressRule(name, {
            securityGroupId: jumphostSg.securityGroupId,
            ipProtocol: "tcp",
            fromPort: 22,
            toPort: 22,
            referencedSecurityGroupId: args.vpc.eicSecurityGroupId
        }, { parent: this });

        const ami = pulumi.output(aws.ec2.getAmi({
            owners: ["amazon"],
            mostRecent: true,
            filters: [
                { name: "name", values: ["al2023-ami-2023.*"] },
                { name: "architecture", values: ["arm64"] },
            ],
        }));

        const instance = new aws.ec2.Instance(name, {
            ami: ami.id,
            instanceType: "t4g.nano",
            subnetId: jumphostSubnetId,
            vpcSecurityGroupIds: [jumphostSg.securityGroupId],
            tags: {
                Name: name,
            },
        }, { parent: this });
        this.instanceId = instance.id;
    }
}


export interface JumphostArgs {
    readonly vpc: Vpc;
}
