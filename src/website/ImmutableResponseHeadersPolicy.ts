import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { defaultSecurityHeadersConfig } from "./utils";

export class ImmutableResponseHeadersPolicy extends pulumi.ComponentResource {
    readonly policyId: pulumi.Output<pulumi.ID>;

    constructor(name: string, args: pulumi.Inputs, opts?: pulumi.ComponentResourceOptions) {
        super("pat:website:ImmutableResponseHeadersPolicy", name, args, opts);

        const policy = new aws.cloudfront.ResponseHeadersPolicy(name, {
            securityHeadersConfig: defaultSecurityHeadersConfig,
            customHeadersConfig: {
                items: [{
                    header: "cache-control",
                    value: "public, max-age=2592000, immutable", // response can be stored in browser cache for 30 days
                    override: true,
                }],
            }
        }, {
            parent: this,
        });

        this.policyId = policy.id;
    }
}
