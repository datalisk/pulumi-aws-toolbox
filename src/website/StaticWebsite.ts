import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { CloudfrontLogBucket } from "./CloudfrontLogBucket";
import { S3Location } from "./S3Location";
import { SingleAssetBucket } from "./SingleAssetBucket";
import { ViewerRequestFunction } from "./cloudfront-function";
import { createCloudfrontDnsRecords, defaultSecurityHeadersConfig } from "./utils";

/**
 * Opinionated component for hosting a website.
 * See the README.md for the full documentation.
 */
export class StaticWebsite extends pulumi.ComponentResource {
    readonly name: string;
    readonly domain: pulumi.Output<string>;

    private distribution: aws.cloudfront.Distribution;

    constructor(name: string, args: WebsiteArgs, opts?: pulumi.CustomResourceOptions) {
        super("pat:website:StaticWebsite", name, args, opts);
        this.name = name;

        const defaultRoute = args.routes.at(-1)!;
        if (defaultRoute.pathPattern !== "/") {
            throw new Error("The default route must use path pattern '/'");
        }

        const zone = aws.route53.Zone.get("zone", args.hostedZoneId);
        this.domain = args.subDomain ? pulumi.interpolate`${args.subDomain}.${zone.name}` : zone.name;

        const stdViewerRequestFunc = args.basicAuth ?
            new ViewerRequestFunction(`${name}-std-viewer-request`, this)
                .withBasicAuth(args.basicAuth.username, args.basicAuth.password)
                .create()
            : undefined;

        const defaultResponseHeadersPolicy = new aws.cloudfront.ResponseHeadersPolicy(`${name}-default`, {
            securityHeadersConfig: defaultSecurityHeadersConfig,
            customHeadersConfig: {
                items: [{
                    header: "cache-control",
                    value: "no-cache", // response can be stored in browser cache, but must be validated with the server before each re-use
                    override: false,
                }],
            }
        }, {
            parent: this,
            aliases: [{ parent: pulumi.rootStackResource }], // fix for missing parent in 1.2.0
        });

        const immutableResponseHeadersPolicy = new aws.cloudfront.ResponseHeadersPolicy(`${name}-immutable`, {
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
            aliases: [{ parent: pulumi.rootStackResource }], // fix for missing parent in 1.2.0
        });

        const s3OriginAccessControl = new aws.cloudfront.OriginAccessControl(name, {
            originAccessControlOriginType: "s3",
            signingBehavior: "always",
            signingProtocol: "sigv4",
        }, { parent: this });

        const lambdaOriginAccessControl = new aws.cloudfront.OriginAccessControl(`${name}-lambda`, {
            originAccessControlOriginType: "lambda",
            signingBehavior: "always",
            signingProtocol: "sigv4",
        }, { parent: this });

        const logBucket = new CloudfrontLogBucket(`${name}-log`, {}, { parent: this });

        const singleAssetBucket = new SingleAssetBucket(`${name}-asset`, {
            assets: args.routes.filter(r => r.type == RouteType.SingleAsset).map(route => ({
                content: route.content,
                contentType: route.contentType,
                path: route.pathPattern,
            }))
        }, { parent: this });

        const policyCachingDisabled = aws.cloudfront.getCachePolicyOutput({ name: "Managed-CachingDisabled" }).apply(policy => policy.id!!);

        const getCacheBehavior = (route: Route): aws.types.input.cloudfront.DistributionDefaultCacheBehavior => {
            if (route.type == RouteType.Custom) {
                return {
                    targetOriginId: `route-${route.pathPattern}`,
                    allowedMethods: ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"],
                    cachedMethods: ["HEAD", "GET"],
                    cachePolicyId: route.cachePolicyId ?? policyCachingDisabled,
                    compress: true,
                    viewerProtocolPolicy: "redirect-to-https",
                    originRequestPolicyId: aws.cloudfront.getOriginRequestPolicyOutput({ name: 'Managed-AllViewer' }).apply(policy => policy.id!!),
                    responseHeadersPolicyId: defaultResponseHeadersPolicy.id,
                    functionAssociations: getFunctionAssociations(stdViewerRequestFunc?.arn),
                };
            } else if (route.type == RouteType.Lambda) {
                return {
                    targetOriginId: `route-${route.pathPattern}`,
                    allowedMethods: ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"],
                    cachedMethods: ["HEAD", "GET"],
                    cachePolicyId: policyCachingDisabled,
                    compress: true,
                    viewerProtocolPolicy: "redirect-to-https",
                    originRequestPolicyId: aws.cloudfront.getOriginRequestPolicyOutput({ name: 'Managed-AllViewerExceptHostHeader' }).apply(policy => policy.id!!),
                    responseHeadersPolicyId: defaultResponseHeadersPolicy.id,
                    functionAssociations: getFunctionAssociations(stdViewerRequestFunc?.arn),
                };
            } else if (route.type == RouteType.S3) {
                const createRequestFunc = () => {
                    const routeName = route.pathPattern.replace(/[\W_]+/g,"_");
                    const func = new ViewerRequestFunction(`${name}-route-${routeName}`, this);
                    if (args.basicAuth) func.withBasicAuth(args.basicAuth.username, args.basicAuth.password);
                    func.rewriteWebpagePath(route.trailingSlash == true ? 'SUB_DIR' : 'FILE');
                    return func.createOrUndefined();
                }

                return {
                    ...s3CacheBehavior(),
                    targetOriginId: `route-${route.pathPattern}`,
                    responseHeadersPolicyId: route.immutable ? immutableResponseHeadersPolicy.id : defaultResponseHeadersPolicy.id,
                    functionAssociations: getFunctionAssociations(route.viewerRequestFunctionArn ?? createRequestFunc()?.arn),
                };
            } else if (route.type == RouteType.SingleAsset) {
                return {
                    ...s3CacheBehavior(),
                    targetOriginId: `route-${route.pathPattern}`,
                    responseHeadersPolicyId: defaultResponseHeadersPolicy.id,
                    functionAssociations: getFunctionAssociations(stdViewerRequestFunc?.arn),
                };
            } else {
                throw new Error(`Unsupported route type ${route}`);
            }
        };

        this.distribution = new aws.cloudfront.Distribution(name, {
            origins: args.routes.map((route => {
                if (route.type == RouteType.Custom) {
                    return {
                        originId: `route-${route.pathPattern}`,
                        domainName: route.originDomainName,
                        customOriginConfig: {
                            httpPort: 80,
                            httpsPort: 443,
                            originProtocolPolicy: "https-only",
                            originSslProtocols: ["TLSv1.2"]
                        },
                    };
                } else if (route.type == RouteType.Lambda) {
                    return {
                        originId: `route-${route.pathPattern}`,
                        domainName: route.functionUrl.functionUrl.apply(url => new URL(url).host),
                        originAccessControlId: (route.useOriginAccessControl ?? true) ? lambdaOriginAccessControl.id : undefined,
                        customOriginConfig: {
                            httpPort: 80,
                            httpsPort: 443,
                            originProtocolPolicy: "https-only",
                            originSslProtocols: ["TLSv1.2"]
                        },
                    };
                } else if (route.type == RouteType.S3) {
                    return {
                        originId: `route-${route.pathPattern}`,
                        domainName: route.s3Location.getBucket().bucketRegionalDomainName,
                        originAccessControlId: s3OriginAccessControl.id,
                        originPath: route.s3Location.getPath().apply(path => path !== '' ? `/${path}` : undefined),
                    };
                } else if (route.type == RouteType.SingleAsset) {
                    return {
                        originId: `route-${route.pathPattern}`,
                        domainName: singleAssetBucket.getBucket().bucketRegionalDomainName,
                        originAccessControlId: s3OriginAccessControl.id,
                    };
                } else {
                    throw new Error(`Unsupported route ${route}`);
                }
            }) as ((route: Route) => aws.types.input.cloudfront.DistributionOrigin)),
            enabled: true,
            isIpv6Enabled: true,
            httpVersion: "http2and3",
            comment: `${name}`,
            aliases: [this.domain],
            orderedCacheBehaviors: args.routes.slice(0, -1).map(route => ({
                pathPattern: route.pathPattern,
                ...getCacheBehavior(route),
            })),
            defaultCacheBehavior: getCacheBehavior(defaultRoute),
            priceClass: "PriceClass_100",
            restrictions: {
                geoRestriction: {
                    restrictionType: "none"
                },
            },
            viewerCertificate: {
                acmCertificateArn: args.acmCertificateArn_usEast1,
                minimumProtocolVersion: "TLSv1.2_2021",
                sslSupportMethod: "sni-only"
            },
            customErrorResponses: [
                {
                    errorCode: 404,
                    responseCode: 404,
                    responsePagePath: "/404.html",
                },
            ],
            loggingConfig: {
                bucket: logBucket.bucketRegionalDomainName,
                includeCookies: false
            },
            waitForDeployment: false,
        }, {
            parent: this,
            deleteBeforeReplace: true,
            aliases: [{ parent: pulumi.rootStackResource }], // if there was a existing resource with the same name, use it
        });

        // request read access to S3
        args.routes.filter(r => r.type == RouteType.S3).forEach(route => {
            route.s3Location.requestCloudfrontReadAccess(this.distribution.arn);
        });

        // grant ourselves access to relevant lambda function URLs
        args.routes.filter(r => r.type == RouteType.Lambda).forEach(route => {
            new aws.lambda.Permission(`${name}-${route.pathPattern}`, {
                statementId: pulumi.interpolate`cloudfront-${this.distribution.id}`,
                action: "lambda:InvokeFunctionUrl",
                principal: "cloudfront.amazonaws.com",
                sourceArn: this.distribution.arn,
                function: route.functionUrl.functionName,
            }, { parent: this });
        });

        singleAssetBucket.setupAccessPolicy(this.distribution.arn);

        createCloudfrontDnsRecords(name, this.distribution, zone.id, args.subDomain, {
            parent: this,
            aliases: [{ parent: pulumi.rootStackResource }], // if there was a existing resource with the same name, use it
        });
    }
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
}

export type Route = CustomRoute | LambdaRoute | S3Route | SingleAssetRoute;

export enum RouteType {
    Custom,
    Lambda,
    SingleAsset,
    S3,
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
}

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
}

/**
 * Serves the given route from a S3 bucket location.
 * Automatically handles URL rewrites, so that when the user loads /product, it will internally load /product/index.html from S3.
 * 
 * You must make sure the bucket as a resource policy that allows read access from CloudFront.
 * If you're using S3ArtifactStore, this can be achieved by calling it's createBucketPolicy method.
 */
export type S3Route = {
    readonly type: RouteType.S3;
    readonly pathPattern: string;
    readonly s3Location: S3Location;

    /**
     * The resources can be treated as immutable, meaning, they can be cached forever.
     * Is false by default.
     */
    readonly immutable?: boolean;

    /**
     * Optionally, specify your own viewer request function.
     * If configured, basic auth protection is not available for this route.
     * 
     * EXPERIMENTAL! This property may change or be removed again!
     */
    readonly viewerRequestFunctionArn?: pulumi.Input<string>;

    /**
     * If 'trailingSlash' is false (the default), trailing slashes are not used.
     * When the user loads /about, it will internally load /product.html from S3.
     * When /about/ is requested it will result in a redirect to a URL without the trailing slash.
     * 
     * If 'trailingSlash' is true, we append /index.html to requests that end with a slash or don’t include a file extension in the URL.
     * 
     * @deprecated will be removed in the next major release, with 'trailingSlash' being false by defailt
     */
    readonly trailingSlash?: boolean;
}

export type SingleAssetRoute = {
    readonly type: RouteType.SingleAsset;
    /**
     * Must start with a slash. Must not contain wildcard characters.
     */
    readonly pathPattern: string;
    readonly content: string | pulumi.Output<string>;
    readonly contentType: string;
}

export interface BasicAuthArgs {
    readonly username: string;
    readonly password: string;
}

/**
 * Simple cache behavior for S3 that caches responses for up to one minute.
 */
function s3CacheBehavior() {
    return {
        allowedMethods: ["HEAD", "GET"],
        cachedMethods: ["HEAD", "GET"],
        viewerProtocolPolicy: "redirect-to-https",
        minTtl: 60,
        defaultTtl: 60,
        maxTtl: 60,
        forwardedValues: {
            cookies: {
                forward: "none",
            },
            headers: [],
            queryString: false,
        },
        compress: true,
    };
}

function getFunctionAssociations(viewerRequestFuncArn: pulumi.Input<string> | undefined) {
    return viewerRequestFuncArn !== undefined ? [{
        eventType: `viewer-request`,
        functionArn: viewerRequestFuncArn,
    }] : undefined;
}
