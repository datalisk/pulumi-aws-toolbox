import * as pulumi from "@pulumi/pulumi";
export declare function createHostDnsRecords(name: string, fullDomain: pulumi.Input<string>, ipv4Address: pulumi.Input<string>, ipv6Address: pulumi.Input<string>, ttl: number, opts?: pulumi.ComponentResourceOptions): Promise<void>;
