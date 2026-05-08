import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { SingleAssetBucket } from "./SingleAssetBucket";
import { ViewerRequestFunction, ViewerResponseFunction } from "./cloudfront-function";
import { ComfortRoute, CommonRouteProps, Route, RouteType, SingleAssetRoute } from "./route-types";
import { defaultSecurityHeadersConfig } from "./utils";


/**
 * Defines the routes of the website, i.e. which content should be served on which path pattern and how it should be cached.
 * 
 * Does not create the CloudFront distribution itself.
 * Therefore, it also does not set up read/invoke permissions for the origins.
 */
export class Routing {
    private readonly props: WebsiteRoutingProps;
    private readonly s3OriginAccessControl: aws.cloudfront.OriginAccessControl;
    private defaultResponseHeadersPolicy: aws.cloudfront.ResponseHeadersPolicy | undefined;
    public singleAssetBucket: SingleAssetBucket | undefined;
    public effectiveRoutes: EffectiveRoute[];

    constructor(props: WebsiteRoutingProps) {
        this.props = props;
        const { name, parent } = props;

        this.s3OriginAccessControl = new aws.cloudfront.OriginAccessControl(name, {
            originAccessControlOriginType: "s3",
            signingBehavior: "always",
            signingProtocol: "sigv4",
        }, { parent });

        const singleAssetRoutes = props.routes.filter(r => r.type == RouteType.SingleAsset) as SingleAssetRoute[];
        if (singleAssetRoutes.length > 0) {
            const singleAssetBucket = new SingleAssetBucket(`${name}-asset`, {
                assets: singleAssetRoutes.map(route => ({
                    content: route.content,
                    contentType: route.contentType,
                    path: route.pathPattern,
                }))
            }, { parent });
            this.singleAssetBucket = singleAssetBucket;
        }

        this.effectiveRoutes = this.createRoutes();
    }

    private createRoutes(): EffectiveRoute[] {
        const effectiveRoutes = this.props.routes.map((route, index) => {
            if (route.type == RouteType.Primitive) {
                return route;
            } else {
                return this.createRoute(route, index);
            }
        });

        if (effectiveRoutes.length == 0) {
            throw new Error("At least one route must be defined");
        }

        const defaultRoute = effectiveRoutes.at(-1)!;
        if (defaultRoute.pathPattern !== "/*") {
            throw new Error("The default route must use path pattern '/*'");
        }
        return effectiveRoutes;
    }

    private createRoute(route: ComfortRoute, index: number): EffectiveRoute {
        const httpsCustomOriginConfig = {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "https-only",
            originSslProtocols: ["TLSv1.2"]
        };

        if (route.type == RouteType.Custom) {
            return {
                pathPattern: route.pathPattern,
                origin: {
                    originId: `route-${route.pathPattern}`,
                    domainName: route.originDomainName,
                    customOriginConfig: httpsCustomOriginConfig
                },
                cacheBehavior: this.getRouteCacheBehavior(route, index)
            };
        } else if (route.type == RouteType.VPC) {
            return {
                pathPattern: route.pathPattern,
                origin: {
                    originId: `route-${route.pathPattern}`,
                    domainName: route.originDomainName,
                    vpcOriginConfig: {
                        vpcOriginId: route.vpcOriginId,
                    },
                },
                cacheBehavior: this.getRouteCacheBehavior(route, index)
            };
        } else if (route.type == RouteType.Lambda) {
            return {
                pathPattern: route.pathPattern,
                origin: {
                    originId: `route-${route.pathPattern}`,
                    domainName: route.functionUrl.functionUrl.apply(url => new URL(url).host),
                    customOriginConfig: httpsCustomOriginConfig,
                },
                cacheBehavior: {
                    ...(this.getRouteCacheBehavior(route, index)),
                    originRequestPolicyId: route.originRequestPolicyId ?? getOriginRequestPolicyId('Managed-AllViewerExceptHostHeader'),
                }
            };
        } else if (route.type == RouteType.S3) {
            return {
                pathPattern: route.pathPattern,
                origin: {
                    originId: `route-${route.pathPattern}`,
                    domainName: pulumi.output(route.s3Folder.bucket).bucketRegionalDomainName,
                    originAccessControlId: this.s3OriginAccessControl.id,
                    originPath: pulumi.output(route.s3Folder.path).apply(path => path !== '' ? `/${path}` : undefined) as any, // originPath type is declared incorrectly
                },
                cacheBehavior: this.getRouteCacheBehavior(route, index)
            };
        } else if (route.type == RouteType.SingleAsset) {
            return {
                pathPattern: route.pathPattern,
                origin: {
                    originId: `route-${route.pathPattern}`,
                    domainName: this.singleAssetBucket!.getBucket().bucketRegionalDomainName,
                    originAccessControlId: this.s3OriginAccessControl.id,
                },
                cacheBehavior: this.getRouteCacheBehavior(route, index)
            };
        } else {
            throw new Error(`Unsupported route ${route}`);
        }
    }

    private getRouteCacheBehavior(route: CommonRouteProps, index: number): aws.types.input.cloudfront.DistributionDefaultCacheBehavior {
        const defaultViewerRequestFunc = this.props.getDefaultViewerRequestFunction(route, index);
        const viewerRequestFuncArn = route.getViewerRequestFunctionArn ? route.getViewerRequestFunctionArn(defaultViewerRequestFunc) : defaultViewerRequestFunc.createOrUndefined()?.arn;

        const defaultViewerResponseFunc = this.props.getDefaultViewerResponseFunction(route, index);
        const viewerResponseFuncArn = route.getViewerResponseFunctionArn ? route.getViewerResponseFunctionArn(defaultViewerResponseFunc) : defaultViewerResponseFunc.createOrUndefined()?.arn;

        const isS3Origin = route.type == RouteType.S3 || route.type == RouteType.SingleAsset;
        const allowedMethods = isS3Origin ? ["HEAD", "GET"] : ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"];

        const defaultOriginRequestPolicyId = isS3Origin ? undefined : getOriginRequestPolicyId('Managed-AllViewer');

        return {
            targetOriginId: `route-${route.pathPattern}`,
            allowedMethods,
            cachedMethods: ["HEAD", "GET"],
            cachePolicyId: route.cachePolicyId ?? this.props.getDefaultCachePolicyArn(route),
            compress: true,
            viewerProtocolPolicy: "redirect-to-https",
            originRequestPolicyId: route.originRequestPolicyId ?? defaultOriginRequestPolicyId,
            responseHeadersPolicyId: this.getDefaultResponseHeadersPolicy().id,
            functionAssociations: getFunctionAssociations(viewerRequestFuncArn, viewerResponseFuncArn),
        };
    }

    private getDefaultResponseHeadersPolicy(): aws.cloudfront.ResponseHeadersPolicy {
        if (this.defaultResponseHeadersPolicy) {
            return this.defaultResponseHeadersPolicy;
        } else {
            const defaultResponseHeadersPolicy = new aws.cloudfront.ResponseHeadersPolicy(`${this.props.name}-default`, {
                securityHeadersConfig: defaultSecurityHeadersConfig,
                customHeadersConfig: {
                    items: [{
                        header: "cache-control",
                        value: "no-cache", // response can be stored in browser cache, but must be validated with the server before each re-use
                        override: false,
                    }],
                }
            }, {
                parent: this.props.parent,
            });
            this.defaultResponseHeadersPolicy = defaultResponseHeadersPolicy;
            return defaultResponseHeadersPolicy;
        }
    }
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

function getFunctionAssociations(viewerRequestFuncArn: pulumi.Input<string> | undefined, viewerResponseFuncArn: pulumi.Input<string> | undefined) {
    const associations = [];

    if (viewerRequestFuncArn != undefined) {
        associations.push({
            eventType: `viewer-request`,
            functionArn: viewerRequestFuncArn,
        });
    }

    if (viewerResponseFuncArn != undefined) {
        associations.push({
            eventType: `viewer-response`,
            functionArn: viewerResponseFuncArn,
        });
    }

    return associations.length > 0 ? associations : undefined;
}

function getOriginRequestPolicyId(name: string): pulumi.Output<string> {
    return aws.cloudfront.getOriginRequestPolicyOutput({ name }).apply(policy => policy.id!!);
}
