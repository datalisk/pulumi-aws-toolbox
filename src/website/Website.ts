import * as aws from "@pulumi/aws";
import { Zone } from "@pulumi/aws/route53";
import * as pulumi from "@pulumi/pulumi";
import { createCertificate } from "./cert";
import { ViewerRequestFunction, ViewerResponseFunction } from "./cloudfront-function";
import { CloudfrontLogBucket } from "./CloudfrontLogBucket";
import { CommonRouteProps, Route, RouteType } from "./route-types";
import { Routing } from "./Routing";
import { createBucketPolicyStatement, createCloudfrontDnsRecords } from "./utils";


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
export class Website extends pulumi.ComponentResource {
    readonly domain: pulumi.Output<string>;
    readonly distributionArn: pulumi.Output<string>;

    private distribution: aws.cloudfront.Distribution;

    constructor(name: string, args: WebsiteArgs, opts?: pulumi.ComponentResourceOptions) {
        super("pat:website:Website", name, {}, opts);

        const { hostedZone } = args;

        this.domain = args.subDomain ? pulumi.interpolate`${args.subDomain}.${hostedZone.name}` : hostedZone.name;

        const certificate = createCertificate({
            name,
            domain: this.domain,
            hostedZone,
            subjectAlternativeNames: [],
            region: "us-east-1",
        });

        const logBucket = new CloudfrontLogBucket(`${name}-log`, {}, { parent: this });

        const routing = new Routing({
            name,
            parent: this,
            routes: args.routes,
            getDefaultCachePolicyArn: () => {
                return getDisabledCachePolicy();
            },
            getDefaultViewerRequestFunction: (route: CommonRouteProps, index: number) => {
                const fn = new ViewerRequestFunction(`${name}-route-${index}`, this);
                if (args.basicAuth) {
                    fn.withBasicAuth(args.basicAuth.username, args.basicAuth.password)
                }
                if (route.type == RouteType.S3) {
                    fn.rewriteWebpagePath(args.trailingSlash == true ? 'SUB_DIR' : 'FILE');
                }
                return fn;
            },
            getDefaultViewerResponseFunction: (_: CommonRouteProps, index: number) => {
                return new ViewerResponseFunction(`${name}-route-${index}`, this);
            },
        });

        this.distribution = new aws.cloudfront.Distribution(name, {
            origins: routing.effectiveRoutes.map(route => route.origin),
            enabled: true,
            isIpv6Enabled: true,
            httpVersion: "http2and3",
            comment: `${name}`,
            aliases: [this.domain],
            orderedCacheBehaviors: routing.effectiveRoutes.slice(0, -1).map(route => ({
                pathPattern: route.pathPattern,
                ...(route.cacheBehavior),
            })),
            defaultCacheBehavior: routing.effectiveRoutes.at(-1)!.cacheBehavior,
            priceClass: "PriceClass_100",
            restrictions: {
                geoRestriction: {
                    restrictionType: "none",
                    locations: [], // workaround for CloudFront issue when previously locations were configured
                },
            },
            viewerCertificate: {
                acmCertificateArn: certificate.certificateArn,
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
            webAclId: args.webAclId,
            waitForDeployment: false,
        }, {
            parent: this,
            deleteBeforeReplace: true,
        });

        // request read access to S3
        args.routes.filter(r => r.type == RouteType.S3).forEach(route => {
            if (route.s3Folder.addBucketPolicyStatement) {
                const statement = createBucketPolicyStatement(route.s3Folder.bucket.arn, this.distribution.arn, pulumi.interpolate`${route.s3Folder.path}/*`);
                route.s3Folder.addBucketPolicyStatement(statement);
            }
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

        if (routing.singleAssetBucket) {
            routing.singleAssetBucket.setupAccessPolicy(this.distribution.arn);
        }

        createCloudfrontDnsRecords(name, this.distribution, hostedZone.id, args.subDomain, {
            parent: this,
            aliases: [{ parent: pulumi.rootStackResource }], // if there was a existing resource with the same name, use it
        });

        this.distributionArn = this.distribution.arn;
    }
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

function getDisabledCachePolicy(): pulumi.Output<string> {
    return aws.cloudfront.getCachePolicyOutput({ name: "Managed-CachingDisabled" }).apply(policy => policy.id!!);
}
