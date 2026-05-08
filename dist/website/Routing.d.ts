import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { SingleAssetBucket } from "./SingleAssetBucket";
import { ViewerRequestFunction, ViewerResponseFunction } from "./cloudfront-function";
import { CommonRouteProps, Route } from "./route-types";
/**
 * Defines the routes of the website, i.e. which content should be served on which path pattern and how it should be cached.
 *
 * Does not create the CloudFront distribution itself.
 * Therefore, it also does not set up read/invoke permissions for the origins.
 */
export declare class Routing {
    private readonly props;
    private readonly s3OriginAccessControl;
    private defaultResponseHeadersPolicy;
    singleAssetBucket: SingleAssetBucket | undefined;
    effectiveRoutes: EffectiveRoute[];
    constructor(props: WebsiteRoutingProps);
    private createRoutes;
    private createRoute;
    private getRouteCacheBehavior;
    private getDefaultResponseHeadersPolicy;
}
export interface WebsiteRoutingProps {
    name: string;
    parent: pulumi.Resource;
    readonly routes: Route[];
    readonly getDefaultCachePolicyArn: (route: CommonRouteProps) => pulumi.Input<string>;
    readonly getDefaultViewerRequestFunction: (route: CommonRouteProps, index: number) => ViewerRequestFunction;
    readonly getDefaultViewerResponseFunction: (route: CommonRouteProps, index: number) => ViewerResponseFunction;
}
export interface EffectiveRoute {
    pathPattern: string;
    origin: aws.types.input.cloudfront.DistributionOrigin;
    cacheBehavior: aws.types.input.cloudfront.DistributionDefaultCacheBehavior;
}
