import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { defaultSecurityHeadersConfig } from "./utils";

/**
 * Creates a Cloudfront ResponseHeadersPolicy which sets the
 * cache-control header to indicate that the response will not be updated while it's fresh.
 */
export class ImmutableResponseHeadersPolicy extends pulumi.ComponentResource {
    readonly policyId: pulumi.Output<pulumi.ID>;

    constructor(name: string, args: ImmutableResponseHeadersPolicyArgs, opts?: pulumi.ComponentResourceOptions) {
        super("pat:website:ImmutableResponseHeadersPolicy", name, args, opts);

        const maxAge = (args.days ?? 365) * 24 * 60 * 60;

        const policy = new aws.cloudfront.ResponseHeadersPolicy(name, {
            securityHeadersConfig: defaultSecurityHeadersConfig,
            customHeadersConfig: {
                items: [{
                    header: "cache-control",
                    value: `public, max-age=${maxAge}, immutable`,
                    override: true,
                }],
            }
        }, {
            parent: this,
        });

        this.policyId = policy.id;
    }
}

export interface ImmutableResponseHeadersPolicyArgs {
    /**
     * For how many days the immutable resource should be cached and considered fresh (default: 365).
     */
    readonly days?: number;
}
