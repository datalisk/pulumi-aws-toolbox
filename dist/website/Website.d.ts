import { Zone } from "@pulumi/aws/route53";
import * as pulumi from "@pulumi/pulumi";
import { Route } from "./route-types";
/**
 * Opinionated component for hosting a website.
 *
 * Special behavior:
 * - Automatically requests read access to S3 buckets. If you're using S3ArtifactStore, you still need to call its createBucketPolicy method.
 * - S3 routes: Automatically handles URL rewrites, so that when the user loads /product, it will internally load /product/index.html from S3.
 * - Creates a certificate for the domain in us-east-1.
 *
 * Also see the README.md for additional documentation.
 */
export declare class Website extends pulumi.ComponentResource {
    readonly domain: pulumi.Output<string>;
    readonly distributionArn: pulumi.Output<string>;
    private distribution;
    constructor(name: string, args: WebsiteArgs, opts?: pulumi.ComponentResourceOptions);
}
export interface WebsiteArgs {
    /**
     * Optionally, protects the website with HTTP basic auth.
     */
    readonly basicAuth?: BasicAuthArgs;
    readonly hostedZone: Zone;
    /**
     * Specifies the routes to be served.
     * The first route to match a requested path wins.
     * The last route must use path pattern "/*", and is the default route.
     *
     * Internally, this gets translated into CloudFront origins and cache behaviors.
     */
    readonly routes: Route[];
    /**
     * The subdomain within the hosted zone or null if the zone apex should be used.
     */
    readonly subDomain?: string;
    /**
     * If 'trailingSlash' is false (the default), trailing slashes are not used.
     * When the user loads /about, it will internally load /about.html from S3.
     * When /about/ is requested it will result in a redirect to a URL without the trailing slash.
     *
     * If 'trailingSlash' is true, we append /index.html to requests that end with a slash or don’t include a file extension in the URL.
     *
     * Applies only to S3 routes.
     */
    readonly trailingSlash?: boolean;
    readonly webAclId?: pulumi.Input<string>;
}
export interface BasicAuthArgs {
    readonly username: string;
    readonly password: string;
}
