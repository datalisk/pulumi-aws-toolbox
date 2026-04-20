import * as pulumi from "@pulumi/pulumi";
/**
 * Creates a Cloudfront ResponseHeadersPolicy which sets the
 * cache-control header to indicate that the response will not be updated while it's fresh.
 */
export declare class ImmutableResponseHeadersPolicy extends pulumi.ComponentResource {
    readonly policyId: pulumi.Output<pulumi.ID>;
    constructor(name: string, args: ImmutableResponseHeadersPolicyArgs, opts?: pulumi.ComponentResourceOptions);
}
export interface ImmutableResponseHeadersPolicyArgs {
    /**
     * For how many days the immutable resource should be cached and considered fresh (default: 365).
     */
    readonly days?: number;
}
