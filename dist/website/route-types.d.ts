import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { S3Folder } from "../ci";
import { ViewerRequestFunction, ViewerResponseFunction } from "./cloudfront-function";
export declare enum RouteType {
    Primitive = 0,
    Custom = 1,
    Lambda = 2,
    SingleAsset = 3,
    S3 = 4,
    VPC = 5
}
export type Route = BasicRoute | ComfortRoute;
export type ComfortRoute = CustomRoute | LambdaRoute | S3Route | SingleAssetRoute | VpcRoute;
/**
 * Low level route definition, where you have to specify all details of the CloudFront configuration, such as origins and cache behaviors yourself.
 */
export type BasicRoute = {
    readonly type: RouteType.Primitive;
    readonly pathPattern: string;
    readonly origin: aws.types.input.cloudfront.DistributionOrigin;
    readonly cacheBehavior: aws.types.input.cloudfront.DistributionDefaultCacheBehavior;
};
export type CommonRouteProps = {
    readonly type: RouteType;
    readonly pathPattern: string;
    /**
     * The caching policy. By default, caching is disabled.
     */
    readonly cachePolicyId?: pulumi.Input<string>;
    readonly originRequestPolicyId?: pulumi.Input<string>;
    /**
     * The response header policy to be used.
     * If not specified, a default policy that includes security headers and a cache-control header with "no-cache" value is used, which allows caching in the browser but forces it to re-validate with the server before each use.
     */
    readonly responseHeadersPolicyId?: pulumi.Input<string>;
    /**
     * Returns the ARN of the viewer request function to be associated with this route or undefined if none should be used.
     * If not specified, a default viewer request function may be created, which automatically handles the configured options of the route e.g. basic auth, URL rewrites, etc.
     *
     * If you specify your own viewer request function, you need to handle these options yourself in the function code. The default function is passed in as a template to the getViewerRequestFunctionArn callback, so you can use it, if you like.
     */
    readonly getViewerRequestFunctionArn?: (template: ViewerRequestFunction) => pulumi.Input<string> | undefined;
    /**
     * Returns the ARN of the viewer response function to be associated with this route or undefined if none should be used.
     * If not specified, a default viewer response function may be created, which automatically handles the configured options of the route e.g. setting cache-control headers based on the 'immutable' option.
     *
     * If you specify your own viewer response function, you need to handle these options yourself in the function code. The default function is passed in as a template to the getViewerResponseFunctionArn callback, so you can use it, if you like.
     */
    readonly getViewerResponseFunctionArn?: (template: ViewerResponseFunction) => pulumi.Input<string> | undefined;
};
/**
 * Serves the given route from a custom server origin.
 */
export type CustomRoute = CommonRouteProps & {
    readonly type: RouteType.Custom;
    readonly originDomainName: pulumi.Input<string>;
};
export type VpcRoute = CommonRouteProps & {
    readonly type: RouteType.VPC;
    readonly originDomainName: pulumi.Input<string>;
    readonly vpcOriginId: pulumi.Input<string>;
};
/**
 * Serves the given route from a Lambda Function URL.
 * Authentication is not supported on Lambda function URLs, as AWS_IAM is inpractical (POST requests from the browser are not supported).
 */
export type LambdaRoute = CommonRouteProps & {
    readonly type: RouteType.Lambda;
    /**
     * The function URL resource to integrate.
     */
    readonly functionUrl: aws.lambda.FunctionUrl;
};
/**
 * Serves the given route from a S3 bucket location.
 */
export type S3Route = CommonRouteProps & {
    readonly type: RouteType.S3;
    /**
     * Where the static assets are stored in S3.
     */
    readonly s3Folder: S3Folder;
};
/**
 * Serves the given route from a single asset stored in a S3 bucket.
 * This is useful for small assets that are more convenient to define inline in code than to include via a build artifact, e.g. the environment variable file for a frontend application.
 * The path pattern must not contain wildcard characters.
 */
export type SingleAssetRoute = CommonRouteProps & {
    readonly type: RouteType.SingleAsset;
    readonly content: string | pulumi.Output<string>;
    readonly contentType: string;
};
