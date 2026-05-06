import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { S3Folder } from "../ci/S3Folder";
/**
 * Opinionated component for hosting a website.
 * See the README.md for the full documentation.
 */
export declare class StaticWebsite extends pulumi.ComponentResource {
    readonly name: string;
    readonly domain: pulumi.Output<string>;
    readonly distributionArn: pulumi.Output<string>;
    private distribution;
    constructor(name: string, args: WebsiteArgs, opts?: pulumi.CustomResourceOptions);
}
export interface WebsiteArgs {
    /**
     * ARN of the HTTPS certificate. The ACM certificate must be created in the us-east-1 region!
     */
    readonly acmCertificateArn_usEast1: string;
    /**
     * Optionally, protects the website with HTTP basic auth.
     */
    readonly basicAuth?: BasicAuthArgs;
    readonly hostedZoneId: pulumi.Input<string>;
    /**
     * Specifies the routes to be served.
     * The first route to match a requested path wins.
     * The last route must use path pattern "/", and is the default route.
     *
     * Internally, this gets translated into CloudFront cache behaviors.
     */
    readonly routes: Route[];
    /**
     * The subdomain within the hosted zone or null if the zone apex should be used.
     */
    readonly subDomain?: string;
    readonly webAclId?: pulumi.Input<string>;
}
export type Route = CustomRoute | LambdaRoute | S3Route | SingleAssetRoute | VpcRoute;
export declare enum RouteType {
    Custom = 0,
    Lambda = 1,
    SingleAsset = 2,
    S3 = 3,
    VPC = 4
}
/**
 * Serves the given route from a custom server.
 */
export type CustomRoute = {
    readonly type: RouteType.Custom;
    readonly pathPattern: string;
    readonly originDomainName: pulumi.Input<string>;
    /**
     * Caching policy. By default, caching is disabled.
     */
    readonly cachePolicyId?: pulumi.Input<string>;
    readonly originRequestPolicyId?: pulumi.Input<string>;
};
export type VpcRoute = {
    readonly type: RouteType.VPC;
    readonly pathPattern: string;
    readonly vpcOriginId: pulumi.Input<string>;
    readonly originDomainName: pulumi.Input<string>;
    /**
     * Caching policy. By default, caching is disabled.
     */
    readonly cachePolicyId?: pulumi.Input<string>;
    readonly originRequestPolicyId?: pulumi.Input<string>;
};
/**
 * Serves the given route from a Lambda function.
 *
 * The function may use AWS_IAM for authentication.
 * Requests to the function URL will get signed and a invoke permission is automatically added.
 */
export type LambdaRoute = {
    readonly type: RouteType.Lambda;
    readonly pathPattern: string;
    /**
     * The function URL resource to integrate.
     */
    readonly functionUrl: aws.lambda.FunctionUrl;
    /**
     * If the OAC should be used to sign requests to the Lambda origin.
     * Default is true.
     *
     * Can be set to disabled on first creation, to workaround an issue with CloudFront, see
     * "Before you create an OAC or set it up in a CloudFront distribution, make sure the OAC has permission to access the Lambda function URL."
     * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-lambda.html#create-oac-overview-lambda
     */
    readonly useOriginAccessControl?: boolean;
};
/**
 * Serves the given route from a S3 bucket location.
 * Automatically handles URL rewrites, so that when the user loads /product, it will internally load /product/index.html from S3.
 *
 * You must make sure the bucket has a resource policy that allows read access from CloudFront.
 * If you're using S3ArtifactStore, this can be achieved by calling it's createBucketPolicy method.
 */
export type S3Route = {
    readonly type: RouteType.S3;
    readonly pathPattern: string;
    /**
     * Where the static assets are stored in S3.
     */
    readonly s3Folder: S3Folder;
    /**
     * Optionally, specify your own viewer request function (instead of using our default).
     * If configured, basic auth protection is not available for this route.
     */
    readonly viewerRequestFunctionArn?: pulumi.Input<string>;
    /**
     * Optionally, specify a viewer response function.
     */
    readonly viewerResponseFunctionArn?: pulumi.Input<string>;
    /**
     * If 'trailingSlash' is false (the default), trailing slashes are not used.
     * When the user loads /about, it will internally load /about.html from S3.
     * When /about/ is requested it will result in a redirect to a URL without the trailing slash.
     *
     * If 'trailingSlash' is true, we append /index.html to requests that end with a slash or don’t include a file extension in the URL.
     */
    readonly trailingSlash?: boolean;
    /**
     * Caching policy. By default, resources are cached for one minute.
     */
    readonly originCachePolicyId?: pulumi.Input<string>;
    /**
     * The response header policy to be used.
     *
     * By default:
     * Uses a policy that sets caching headers that allow the browser to cache resources but forces it to re-validate them before each use.
     * If 'immutable' is true, returns headers that allow the browser to cache resources forever.
     */
    readonly responseHeadersPolicyId?: pulumi.Input<string>;
};
export type SingleAssetRoute = {
    readonly type: RouteType.SingleAsset;
    /**
     * Must start with a slash. Must not contain wildcard characters.
     */
    readonly pathPattern: string;
    readonly content: string | pulumi.Output<string>;
    readonly contentType: string;
};
export interface BasicAuthArgs {
    readonly username: string;
    readonly password: string;
}
