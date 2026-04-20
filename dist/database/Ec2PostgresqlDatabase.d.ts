import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { ConnectDetails } from "./ConnectDetails";
/**
 * Creates a self-hosted postgresql database on EC2.
 *
 * Features:
 *  - we can use very cheap instances, like t4g.nano
 *  - using custom server configuration/extension is possible
 *
 * Not suitable for production with high availability and durability requirements.
 *
 * Changing data volume size is not supported and would lead to data loss!
 */
export declare class Ec2PostgresqlDatabase extends pulumi.ComponentResource {
    private readonly args;
    private readonly instance;
    constructor(name: string, args: Ec2PostgresqlDatabaseArgs, opts?: pulumi.ComponentResourceOptions);
    getConnectDetails(): ConnectDetails;
    getInstanceId(): pulumi.Output<string>;
    private createInstanceProfile;
}
export interface Ec2PostgresqlDatabaseArgs {
    /**
     * Size of the data volume in GB.
     */
    dataVolumeSize: pulumi.Input<number>;
    domain: pulumi.Input<string>;
    instanceType: aws.types.enums.ec2.InstanceType;
    password: pulumi.Input<string>;
    securityGroupId: pulumi.Input<string>;
    subnet: aws.ec2.Subnet;
}
export declare const createInitScript: (volume: string, password: pulumi.Input<string>) => pulumi.Output<string>;
export declare const createMountpoint: (volume: string, mountPoint: string) => string;
export declare const installPostgresql: () => string;
export declare const setupPostgresql: () => string;
