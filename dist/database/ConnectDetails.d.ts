import * as pulumi from "@pulumi/pulumi";
/**
 * Settings to connect to a relational database over the network.
 * The database may be managed/RDS or self-hosted.
 */
export interface ConnectDetails {
    type: DatabaseType;
    host: pulumi.Output<string>;
    port: number;
    name: string;
    username: string;
    password: pulumi.Output<string>;
}
export type DatabaseType = "postgresql" | "mysql";
