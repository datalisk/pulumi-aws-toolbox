"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteType = exports.StaticWebsite = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const CloudfrontLogBucket_1 = require("./CloudfrontLogBucket");
const SingleAssetBucket_1 = require("./SingleAssetBucket");
const cloudfront_function_1 = require("./cloudfront-function");
const utils_1 = require("./utils");
/**
 * Opinionated component for hosting a website.
 * See the README.md for the full documentation.
 */
class StaticWebsite extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super("pat:website:StaticWebsite", name, args, opts);
        this.name = name;
        const defaultRoute = args.routes.at(-1);
        if (defaultRoute.pathPattern !== "/") {
            // TODO use '/*' as default path pattern, to clarify that it is a wildcard match
            throw new Error("The default route must use path pattern '/'");
        }
        const zone = aws.route53.Zone.get(`${name}-zone`, args.hostedZoneId, {}, { parent: this });
        this.domain = args.subDomain ? pulumi.interpolate `${args.subDomain}.${zone.name}` : zone.name;
        const stdViewerRequestFunc = args.basicAuth ?
            new cloudfront_function_1.ViewerRequestFunction(`${name}-std-viewer-request`, this)
                .withBasicAuth(args.basicAuth.username, args.basicAuth.password)
                .create()
            : undefined;
        const defaultResponseHeadersPolicy = new aws.cloudfront.ResponseHeadersPolicy(`${name}-default`, {
            securityHeadersConfig: utils_1.defaultSecurityHeadersConfig,
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
        const logBucket = new CloudfrontLogBucket_1.CloudfrontLogBucket(`${name}-log`, {}, { parent: this });
        const singleAssetBucket = new SingleAssetBucket_1.SingleAssetBucket(`${name}-asset`, {
            assets: args.routes.filter(r => r.type == RouteType.SingleAsset).map(route => ({
                content: route.content,
                contentType: route.contentType,
                path: route.pathPattern,
            }))
        }, { parent: this });
        const policyCachingDisabled = aws.cloudfront.getCachePolicyOutput({ name: "Managed-CachingDisabled" }).apply(policy => policy.id);
        const s3CachePolicy1Minute = new aws.cloudfront.CachePolicy(`${name}-s3-1m`, {
            parametersInCacheKeyAndForwardedToOrigin: {
                headersConfig: {
                    headerBehavior: "none",
                },
                cookiesConfig: {
                    cookieBehavior: "none",
                },
                queryStringsConfig: {
                    queryStringBehavior: "none",
                },
            },
            minTtl: 60,
            defaultTtl: 60,
            maxTtl: 60,
        }, { parent: this });
        const getCacheBehavior = (route) => {
            var _a, _b, _c, _d, _e, _f;
            if (route.type == RouteType.Custom || route.type == RouteType.VPC) {
                return {
                    targetOriginId: `route-${route.pathPattern}`,
                    allowedMethods: ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"],
                    cachedMethods: ["HEAD", "GET"],
                    cachePolicyId: (_a = route.cachePolicyId) !== null && _a !== void 0 ? _a : policyCachingDisabled,
                    compress: true,
                    viewerProtocolPolicy: "redirect-to-https",
                    originRequestPolicyId: (_b = route.originRequestPolicyId) !== null && _b !== void 0 ? _b : aws.cloudfront.getOriginRequestPolicyOutput({ name: 'Managed-AllViewer' }).apply(policy => policy.id),
                    responseHeadersPolicyId: defaultResponseHeadersPolicy.id,
                    functionAssociations: getFunctionAssociations(stdViewerRequestFunc === null || stdViewerRequestFunc === void 0 ? void 0 : stdViewerRequestFunc.arn, undefined),
                };
            }
            else if (route.type == RouteType.Lambda) {
                return {
                    targetOriginId: `route-${route.pathPattern}`,
                    allowedMethods: ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"],
                    cachedMethods: ["HEAD", "GET"],
                    cachePolicyId: policyCachingDisabled,
                    compress: true,
                    viewerProtocolPolicy: "redirect-to-https",
                    originRequestPolicyId: aws.cloudfront.getOriginRequestPolicyOutput({ name: 'Managed-AllViewerExceptHostHeader' }).apply(policy => policy.id),
                    responseHeadersPolicyId: defaultResponseHeadersPolicy.id,
                    functionAssociations: getFunctionAssociations(stdViewerRequestFunc === null || stdViewerRequestFunc === void 0 ? void 0 : stdViewerRequestFunc.arn, undefined),
                };
            }
            else if (route.type == RouteType.S3) {
                const createRequestFunc = () => {
                    const routeName = route.pathPattern.replace(/[\W_]+/g, "_");
                    const func = new cloudfront_function_1.ViewerRequestFunction(`${name}-route-${routeName}`, this);
                    if (args.basicAuth)
                        func.withBasicAuth(args.basicAuth.username, args.basicAuth.password);
                    func.rewriteWebpagePath(route.trailingSlash == true ? 'SUB_DIR' : 'FILE');
                    return func.createOrUndefined();
                };
                const viewerResponseFuncArn = (_c = route.viewerRequestFunctionArn) !== null && _c !== void 0 ? _c : (_d = createRequestFunc()) === null || _d === void 0 ? void 0 : _d.arn;
                return {
                    targetOriginId: `route-${route.pathPattern}`,
                    allowedMethods: ["HEAD", "GET"],
                    cachedMethods: ["HEAD", "GET"],
                    compress: true,
                    viewerProtocolPolicy: "redirect-to-https",
                    cachePolicyId: (_e = route.originCachePolicyId) !== null && _e !== void 0 ? _e : s3CachePolicy1Minute.id,
                    responseHeadersPolicyId: (_f = route.responseHeadersPolicyId) !== null && _f !== void 0 ? _f : defaultResponseHeadersPolicy.id,
                    functionAssociations: getFunctionAssociations(viewerResponseFuncArn, route.viewerResponseFunctionArn),
                };
            }
            else if (route.type == RouteType.SingleAsset) {
                return {
                    targetOriginId: `route-${route.pathPattern}`,
                    allowedMethods: ["HEAD", "GET"],
                    cachedMethods: ["HEAD", "GET"],
                    compress: true,
                    viewerProtocolPolicy: "redirect-to-https",
                    cachePolicyId: s3CachePolicy1Minute.id,
                    responseHeadersPolicyId: defaultResponseHeadersPolicy.id,
                    functionAssociations: getFunctionAssociations(stdViewerRequestFunc === null || stdViewerRequestFunc === void 0 ? void 0 : stdViewerRequestFunc.arn, undefined),
                };
            }
            else {
                throw new Error(`Unsupported route type ${route}`);
            }
        };
        const origins = args.routes.map(((route) => {
            var _a;
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
            }
            else if (route.type == RouteType.VPC) {
                return {
                    originId: `route-${route.pathPattern}`,
                    domainName: route.originDomainName,
                    vpcOriginConfig: {
                        vpcOriginId: route.vpcOriginId,
                    },
                };
            }
            else if (route.type == RouteType.Lambda) {
                return {
                    originId: `route-${route.pathPattern}`,
                    domainName: route.functionUrl.functionUrl.apply(url => new URL(url).host),
                    originAccessControlId: ((_a = route.useOriginAccessControl) !== null && _a !== void 0 ? _a : true) ? lambdaOriginAccessControl.id : undefined,
                    customOriginConfig: {
                        httpPort: 80,
                        httpsPort: 443,
                        originProtocolPolicy: "https-only",
                        originSslProtocols: ["TLSv1.2"]
                    },
                };
            }
            else if (route.type == RouteType.S3) {
                const s3Folder = getS3Folder(route);
                return {
                    originId: `route-${route.pathPattern}`,
                    domainName: pulumi.output(s3Folder.bucket).bucketRegionalDomainName,
                    originAccessControlId: s3OriginAccessControl.id,
                    originPath: pulumi.output(s3Folder.path).apply(path => path !== '' ? `/${path}` : undefined), // originPath type is declared incorrectly
                };
            }
            else if (route.type == RouteType.SingleAsset) {
                return {
                    originId: `route-${route.pathPattern}`,
                    domainName: singleAssetBucket.getBucket().bucketRegionalDomainName,
                    originAccessControlId: s3OriginAccessControl.id,
                };
            }
            else {
                throw new Error(`Unsupported route ${route}`);
            }
        }));
        this.distribution = new aws.cloudfront.Distribution(name, {
            origins,
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
                    restrictionType: "none",
                    locations: [], // workaround for CloudFront issue when previously locations were configured
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
            webAclId: args.webAclId,
            waitForDeployment: false,
        }, {
            parent: this,
            deleteBeforeReplace: true,
            aliases: [{ parent: pulumi.rootStackResource }], // if there was a existing resource with the same name, use it
        });
        // request read access to S3
        args.routes.filter(r => r.type == RouteType.S3).forEach(route => {
            if (route.s3Folder.addBucketPolicyStatement) {
                const statement = (0, utils_1.createBucketPolicyStatement)(route.s3Folder.bucket.arn, this.distribution.arn, pulumi.interpolate `${route.s3Folder.path}/*`);
                route.s3Folder.addBucketPolicyStatement(statement);
            }
        });
        // grant ourselves access to relevant lambda function URLs
        args.routes.filter(r => r.type == RouteType.Lambda).forEach(route => {
            new aws.lambda.Permission(`${name}-${route.pathPattern}`, {
                statementId: pulumi.interpolate `cloudfront-${this.distribution.id}`,
                action: "lambda:InvokeFunctionUrl",
                principal: "cloudfront.amazonaws.com",
                sourceArn: this.distribution.arn,
                function: route.functionUrl.functionName,
            }, { parent: this });
        });
        singleAssetBucket.setupAccessPolicy(this.distribution.arn);
        (0, utils_1.createCloudfrontDnsRecords)(name, this.distribution, zone.id, args.subDomain, {
            parent: this,
            aliases: [{ parent: pulumi.rootStackResource }], // if there was a existing resource with the same name, use it
        });
        this.distributionArn = this.distribution.arn;
    }
}
exports.StaticWebsite = StaticWebsite;
var RouteType;
(function (RouteType) {
    RouteType[RouteType["Custom"] = 0] = "Custom";
    RouteType[RouteType["Lambda"] = 1] = "Lambda";
    RouteType[RouteType["SingleAsset"] = 2] = "SingleAsset";
    RouteType[RouteType["S3"] = 3] = "S3";
    RouteType[RouteType["VPC"] = 4] = "VPC";
})(RouteType || (exports.RouteType = RouteType = {}));
function getFunctionAssociations(viewerRequestFuncArn, viewerResponseFuncArn) {
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
function getS3Folder(s3Route) {
    if (s3Route.s3Folder !== undefined) {
        return s3Route.s3Folder;
    }
    else {
        throw new Error(`Either 's3Location' or 's3Folder' must be specified.`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3RhdGljV2Vic2l0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJzaXRlL1N0YXRpY1dlYnNpdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBRXpDLCtEQUE0RDtBQUM1RCwyREFBd0Q7QUFDeEQsK0RBQThEO0FBQzlELG1DQUFnSDtBQUVoSDs7O0dBR0c7QUFDSCxNQUFhLGFBQWMsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBT3ZELFlBQVksSUFBWSxFQUFFLElBQWlCLEVBQUUsSUFBbUM7UUFDNUUsS0FBSyxDQUFDLDJCQUEyQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDckQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFFakIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUN6QyxJQUFJLFlBQVksQ0FBQyxXQUFXLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDbkMsZ0ZBQWdGO1lBQ2hGLE1BQU0sSUFBSSxLQUFLLENBQUMsNkNBQTZDLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBRUQsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxPQUFPLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMzRixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUEsR0FBRyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FB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LENBQUE7SUFDTiw2Q0FBTSxDQUFBO0lBQ04sdURBQVcsQ0FBQTtJQUNYLHFDQUFFLENBQUE7SUFDRix1Q0FBRyxDQUFBO0FBQ1AsQ0FBQyxFQU5XLFNBQVMseUJBQVQsU0FBUyxRQU1wQjtBQStIRCxTQUFTLHVCQUF1QixDQUFDLG9CQUFzRCxFQUFFLHFCQUF1RDtJQUM1SSxNQUFNLFlBQVksR0FBRyxFQUFFLENBQUM7SUFFeEIsSUFBSSxvQkFBb0IsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUNwQyxZQUFZLENBQUMsSUFBSSxDQUFDO1lBQ2QsU0FBUyxFQUFFLGdCQUFnQjtZQUMzQixXQUFXLEVBQUUsb0JBQW9CO1NBQ3BDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxJQUFJLHFCQUFxQixJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQ3JDLFlBQVksQ0FBQyxJQUFJLENBQUM7WUFDZCxTQUFTLEVBQUUsaUJBQWlCO1lBQzVCLFdBQVcsRUFBRSxxQkFBcUI7U0FDckMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELE9BQU8sWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0FBQzlELENBQUM7QUFFRCxTQUFTLFdBQVcsQ0FBQyxPQUFnQjtJQUNqQyxJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDakMsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDO0lBQzVCLENBQUM7U0FBTSxDQUFDO1FBQ0osTUFBTSxJQUFJLEtBQUssQ0FBQyxzREFBc0QsQ0FBQyxDQUFDO0lBQzVFLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXdzIGZyb20gXCJAcHVsdW1pL2F3c1wiO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuaW1wb3J0IHsgUzNGb2xkZXIgfSBmcm9tIFwiLi4vY2kvUzNGb2xkZXJcIjtcbmltcG9ydCB7IENsb3VkZnJvbnRMb2dCdWNrZXQgfSBmcm9tIFwiLi9DbG91ZGZyb250TG9nQnVja2V0XCI7XG5pbXBvcnQgeyBTaW5nbGVBc3NldEJ1Y2tldCB9IGZyb20gXCIuL1NpbmdsZUFzc2V0QnVja2V0XCI7XG5pbXBvcnQgeyBWaWV3ZXJSZXF1ZXN0RnVuY3Rpb24gfSBmcm9tIFwiLi9jbG91ZGZyb250LWZ1bmN0aW9uXCI7XG5pbXBvcnQgeyBjcmVhdGVCdWNrZXRQb2xpY3lTdGF0ZW1lbnQsIGNyZWF0ZUNsb3VkZnJvbnREbnNSZWNvcmRzLCBkZWZhdWx0U2VjdXJpdHlIZWFkZXJzQ29uZmlnIH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuLyoqXG4gKiBPcGluaW9uYXRlZCBjb21wb25lbnQgZm9yIGhvc3RpbmcgYSB3ZWJzaXRlLlxuICogU2VlIHRoZSBSRUFETUUubWQgZm9yIHRoZSBmdWxsIGRvY3VtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBTdGF0aWNXZWJzaXRlIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gICAgcmVhZG9ubHkgZG9tYWluOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcmVhZG9ubHkgZGlzdHJpYnV0aW9uQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgICBwcml2YXRlIGRpc3RyaWJ1dGlvbjogYXdzLmNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBXZWJzaXRlQXJncywgb3B0cz86IHB1bHVtaS5DdXN0b21SZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJwYXQ6d2Vic2l0ZTpTdGF0aWNXZWJzaXRlXCIsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRSb3V0ZSA9IGFyZ3Mucm91dGVzLmF0KC0xKSE7XG4gICAgICAgIGlmIChkZWZhdWx0Um91dGUucGF0aFBhdHRlcm4gIT09IFwiL1wiKSB7XG4gICAgICAgICAgICAvLyBUT0RPIHVzZSAnLyonIGFzIGRlZmF1bHQgcGF0aCBwYXR0ZXJuLCB0byBjbGFyaWZ5IHRoYXQgaXQgaXMgYSB3aWxkY2FyZCBtYXRjaFxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIGRlZmF1bHQgcm91dGUgbXVzdCB1c2UgcGF0aCBwYXR0ZXJuICcvJ1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHpvbmUgPSBhd3Mucm91dGU1My5ab25lLmdldChgJHtuYW1lfS16b25lYCwgYXJncy5ob3N0ZWRab25lSWQsIHt9LCB7IHBhcmVudDogdGhpcyB9KTtcbiAgICAgICAgdGhpcy5kb21haW4gPSBhcmdzLnN1YkRvbWFpbiA/IHB1bHVtaS5pbnRlcnBvbGF0ZWAke2FyZ3Muc3ViRG9tYWlufS4ke3pvbmUubmFtZX1gIDogem9uZS5uYW1lO1xuXG4gICAgICAgIGNvbnN0IHN0ZFZpZXdlclJlcXVlc3RGdW5jID0gYXJncy5iYXNpY0F1dGggP1xuICAgICAgICAgICAgbmV3IFZpZXdlclJlcXVlc3RGdW5jdGlvbihgJHtuYW1lfS1zdGQtdmlld2VyLXJlcXVlc3RgLCB0aGlzKVxuICAgICAgICAgICAgICAgIC53aXRoQmFzaWNBdXRoKGFyZ3MuYmFzaWNBdXRoLnVzZXJuYW1lLCBhcmdzLmJhc2ljQXV0aC5wYXNzd29yZClcbiAgICAgICAgICAgICAgICAuY3JlYXRlKClcbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRSZXNwb25zZUhlYWRlcnNQb2xpY3kgPSBuZXcgYXdzLmNsb3VkZnJvbnQuUmVzcG9uc2VIZWFkZXJzUG9saWN5KGAke25hbWV9LWRlZmF1bHRgLCB7XG4gICAgICAgICAgICBzZWN1cml0eUhlYWRlcnNDb25maWc6IGRlZmF1bHRTZWN1cml0eUhlYWRlcnNDb25maWcsXG4gICAgICAgICAgICBjdXN0b21IZWFkZXJzQ29uZmlnOiB7XG4gICAgICAgICAgICAgICAgaXRlbXM6IFt7XG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcjogXCJjYWNoZS1jb250cm9sXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBcIm5vLWNhY2hlXCIsIC8vIHJlc3BvbnNlIGNhbiBiZSBzdG9yZWQgaW4gYnJvd3NlciBjYWNoZSwgYnV0IG11c3QgYmUgdmFsaWRhdGVkIHdpdGggdGhlIHNlcnZlciBiZWZvcmUgZWFjaCByZS11c2VcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgICBhbGlhc2VzOiBbeyBwYXJlbnQ6IHB1bHVtaS5yb290U3RhY2tSZXNvdXJjZSB9XSwgLy8gZml4IGZvciBtaXNzaW5nIHBhcmVudCBpbiAxLjIuMFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBzM09yaWdpbkFjY2Vzc0NvbnRyb2wgPSBuZXcgYXdzLmNsb3VkZnJvbnQuT3JpZ2luQWNjZXNzQ29udHJvbChuYW1lLCB7XG4gICAgICAgICAgICBvcmlnaW5BY2Nlc3NDb250cm9sT3JpZ2luVHlwZTogXCJzM1wiLFxuICAgICAgICAgICAgc2lnbmluZ0JlaGF2aW9yOiBcImFsd2F5c1wiLFxuICAgICAgICAgICAgc2lnbmluZ1Byb3RvY29sOiBcInNpZ3Y0XCIsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIGNvbnN0IGxhbWJkYU9yaWdpbkFjY2Vzc0NvbnRyb2wgPSBuZXcgYXdzLmNsb3VkZnJvbnQuT3JpZ2luQWNjZXNzQ29udHJvbChgJHtuYW1lfS1sYW1iZGFgLCB7XG4gICAgICAgICAgICBvcmlnaW5BY2Nlc3NDb250cm9sT3JpZ2luVHlwZTogXCJsYW1iZGFcIixcbiAgICAgICAgICAgIHNpZ25pbmdCZWhhdmlvcjogXCJhbHdheXNcIixcbiAgICAgICAgICAgIHNpZ25pbmdQcm90b2NvbDogXCJzaWd2NFwiLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICBjb25zdCBsb2dCdWNrZXQgPSBuZXcgQ2xvdWRmcm9udExvZ0J1Y2tldChgJHtuYW1lfS1sb2dgLCB7fSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgY29uc3Qgc2luZ2xlQXNzZXRCdWNrZXQgPSBuZXcgU2luZ2xlQXNzZXRCdWNrZXQoYCR7bmFtZX0tYXNzZXRgLCB7XG4gICAgICAgICAgICBhc3NldHM6IGFyZ3Mucm91dGVzLmZpbHRlcihyID0+IHIudHlwZSA9PSBSb3V0ZVR5cGUuU2luZ2xlQXNzZXQpLm1hcChyb3V0ZSA9PiAoe1xuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHJvdXRlLmNvbnRlbnQsXG4gICAgICAgICAgICAgICAgY29udGVudFR5cGU6IHJvdXRlLmNvbnRlbnRUeXBlLFxuICAgICAgICAgICAgICAgIHBhdGg6IHJvdXRlLnBhdGhQYXR0ZXJuLFxuICAgICAgICAgICAgfSkpXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIGNvbnN0IHBvbGljeUNhY2hpbmdEaXNhYmxlZCA9IGF3cy5jbG91ZGZyb250LmdldENhY2hlUG9saWN5T3V0cHV0KHsgbmFtZTogXCJNYW5hZ2VkLUNhY2hpbmdEaXNhYmxlZFwiIH0pLmFwcGx5KHBvbGljeSA9PiBwb2xpY3kuaWQhISk7XG5cbiAgICAgICAgY29uc3QgczNDYWNoZVBvbGljeTFNaW51dGUgPSBuZXcgYXdzLmNsb3VkZnJvbnQuQ2FjaGVQb2xpY3koYCR7bmFtZX0tczMtMW1gLCB7XG4gICAgICAgICAgICBwYXJhbWV0ZXJzSW5DYWNoZUtleUFuZEZvcndhcmRlZFRvT3JpZ2luOiB7XG4gICAgICAgICAgICAgICAgaGVhZGVyc0NvbmZpZzoge1xuICAgICAgICAgICAgICAgICAgICBoZWFkZXJCZWhhdmlvcjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb29raWVzQ29uZmlnOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvb2tpZUJlaGF2aW9yOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHF1ZXJ5U3RyaW5nc0NvbmZpZzoge1xuICAgICAgICAgICAgICAgICAgICBxdWVyeVN0cmluZ0JlaGF2aW9yOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pblR0bDogNjAsXG4gICAgICAgICAgICBkZWZhdWx0VHRsOiA2MCxcbiAgICAgICAgICAgIG1heFR0bDogNjAsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIGNvbnN0IGdldENhY2hlQmVoYXZpb3IgPSAocm91dGU6IFJvdXRlKTogYXdzLnR5cGVzLmlucHV0LmNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uRGVmYXVsdENhY2hlQmVoYXZpb3IgPT4ge1xuICAgICAgICAgICAgaWYgKHJvdXRlLnR5cGUgPT0gUm91dGVUeXBlLkN1c3RvbSB8fCByb3V0ZS50eXBlID09IFJvdXRlVHlwZS5WUEMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRPcmlnaW5JZDogYHJvdXRlLSR7cm91dGUucGF0aFBhdHRlcm59YCxcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IFtcIkhFQURcIiwgXCJERUxFVEVcIiwgXCJQT1NUXCIsIFwiR0VUXCIsIFwiT1BUSU9OU1wiLCBcIlBVVFwiLCBcIlBBVENIXCJdLFxuICAgICAgICAgICAgICAgICAgICBjYWNoZWRNZXRob2RzOiBbXCJIRUFEXCIsIFwiR0VUXCJdLFxuICAgICAgICAgICAgICAgICAgICBjYWNoZVBvbGljeUlkOiByb3V0ZS5jYWNoZVBvbGljeUlkID8/IHBvbGljeUNhY2hpbmdEaXNhYmxlZCxcbiAgICAgICAgICAgICAgICAgICAgY29tcHJlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OiBcInJlZGlyZWN0LXRvLWh0dHBzXCIsXG4gICAgICAgICAgICAgICAgICAgIG9yaWdpblJlcXVlc3RQb2xpY3lJZDogcm91dGUub3JpZ2luUmVxdWVzdFBvbGljeUlkID8/IGF3cy5jbG91ZGZyb250LmdldE9yaWdpblJlcXVlc3RQb2xpY3lPdXRwdXQoeyBuYW1lOiAnTWFuYWdlZC1BbGxWaWV3ZXInIH0pLmFwcGx5KHBvbGljeSA9PiBwb2xpY3kuaWQhISksXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlSGVhZGVyc1BvbGljeUlkOiBkZWZhdWx0UmVzcG9uc2VIZWFkZXJzUG9saWN5LmlkLFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbkFzc29jaWF0aW9uczogZ2V0RnVuY3Rpb25Bc3NvY2lhdGlvbnMoc3RkVmlld2VyUmVxdWVzdEZ1bmM/LmFybiwgdW5kZWZpbmVkKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyb3V0ZS50eXBlID09IFJvdXRlVHlwZS5MYW1iZGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRPcmlnaW5JZDogYHJvdXRlLSR7cm91dGUucGF0aFBhdHRlcm59YCxcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IFtcIkhFQURcIiwgXCJERUxFVEVcIiwgXCJQT1NUXCIsIFwiR0VUXCIsIFwiT1BUSU9OU1wiLCBcIlBVVFwiLCBcIlBBVENIXCJdLFxuICAgICAgICAgICAgICAgICAgICBjYWNoZWRNZXRob2RzOiBbXCJIRUFEXCIsIFwiR0VUXCJdLFxuICAgICAgICAgICAgICAgICAgICBjYWNoZVBvbGljeUlkOiBwb2xpY3lDYWNoaW5nRGlzYWJsZWQsXG4gICAgICAgICAgICAgICAgICAgIGNvbXByZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogXCJyZWRpcmVjdC10by1odHRwc1wiLFxuICAgICAgICAgICAgICAgICAgICBvcmlnaW5SZXF1ZXN0UG9saWN5SWQ6IGF3cy5jbG91ZGZyb250LmdldE9yaWdpblJlcXVlc3RQb2xpY3lPdXRwdXQoeyBuYW1lOiAnTWFuYWdlZC1BbGxWaWV3ZXJFeGNlcHRIb3N0SGVhZGVyJyB9KS5hcHBseShwb2xpY3kgPT4gcG9saWN5LmlkISEpLFxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZUhlYWRlcnNQb2xpY3lJZDogZGVmYXVsdFJlc3BvbnNlSGVhZGVyc1BvbGljeS5pZCxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25Bc3NvY2lhdGlvbnM6IGdldEZ1bmN0aW9uQXNzb2NpYXRpb25zKHN0ZFZpZXdlclJlcXVlc3RGdW5jPy5hcm4sIHVuZGVmaW5lZCksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocm91dGUudHlwZSA9PSBSb3V0ZVR5cGUuUzMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGVSZXF1ZXN0RnVuYyA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm91dGVOYW1lID0gcm91dGUucGF0aFBhdHRlcm4ucmVwbGFjZSgvW1xcV19dKy9nLCBcIl9cIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBuZXcgVmlld2VyUmVxdWVzdEZ1bmN0aW9uKGAke25hbWV9LXJvdXRlLSR7cm91dGVOYW1lfWAsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXJncy5iYXNpY0F1dGgpIGZ1bmMud2l0aEJhc2ljQXV0aChhcmdzLmJhc2ljQXV0aC51c2VybmFtZSwgYXJncy5iYXNpY0F1dGgucGFzc3dvcmQpO1xuICAgICAgICAgICAgICAgICAgICBmdW5jLnJld3JpdGVXZWJwYWdlUGF0aChyb3V0ZS50cmFpbGluZ1NsYXNoID09IHRydWUgPyAnU1VCX0RJUicgOiAnRklMRScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuYy5jcmVhdGVPclVuZGVmaW5lZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB2aWV3ZXJSZXNwb25zZUZ1bmNBcm4gPSByb3V0ZS52aWV3ZXJSZXF1ZXN0RnVuY3Rpb25Bcm4gPz8gY3JlYXRlUmVxdWVzdEZ1bmMoKT8uYXJuO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0T3JpZ2luSWQ6IGByb3V0ZS0ke3JvdXRlLnBhdGhQYXR0ZXJufWAsXG4gICAgICAgICAgICAgICAgICAgIGFsbG93ZWRNZXRob2RzOiBbXCJIRUFEXCIsIFwiR0VUXCJdLFxuICAgICAgICAgICAgICAgICAgICBjYWNoZWRNZXRob2RzOiBbXCJIRUFEXCIsIFwiR0VUXCJdLFxuICAgICAgICAgICAgICAgICAgICBjb21wcmVzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IFwicmVkaXJlY3QtdG8taHR0cHNcIixcbiAgICAgICAgICAgICAgICAgICAgY2FjaGVQb2xpY3lJZDogcm91dGUub3JpZ2luQ2FjaGVQb2xpY3lJZCA/PyBzM0NhY2hlUG9saWN5MU1pbnV0ZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VIZWFkZXJzUG9saWN5SWQ6IHJvdXRlLnJlc3BvbnNlSGVhZGVyc1BvbGljeUlkID8/IGRlZmF1bHRSZXNwb25zZUhlYWRlcnNQb2xpY3kuaWQsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uQXNzb2NpYXRpb25zOiBnZXRGdW5jdGlvbkFzc29jaWF0aW9ucyh2aWV3ZXJSZXNwb25zZUZ1bmNBcm4sIHJvdXRlLnZpZXdlclJlc3BvbnNlRnVuY3Rpb25Bcm4pLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJvdXRlLnR5cGUgPT0gUm91dGVUeXBlLlNpbmdsZUFzc2V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0T3JpZ2luSWQ6IGByb3V0ZS0ke3JvdXRlLnBhdGhQYXR0ZXJufWAsXG4gICAgICAgICAgICAgICAgICAgIGFsbG93ZWRNZXRob2RzOiBbXCJIRUFEXCIsIFwiR0VUXCJdLFxuICAgICAgICAgICAgICAgICAgICBjYWNoZWRNZXRob2RzOiBbXCJIRUFEXCIsIFwiR0VUXCJdLFxuICAgICAgICAgICAgICAgICAgICBjb21wcmVzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IFwicmVkaXJlY3QtdG8taHR0cHNcIixcbiAgICAgICAgICAgICAgICAgICAgY2FjaGVQb2xpY3lJZDogczNDYWNoZVBvbGljeTFNaW51dGUuaWQsXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlSGVhZGVyc1BvbGljeUlkOiBkZWZhdWx0UmVzcG9uc2VIZWFkZXJzUG9saWN5LmlkLFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbkFzc29jaWF0aW9uczogZ2V0RnVuY3Rpb25Bc3NvY2lhdGlvbnMoc3RkVmlld2VyUmVxdWVzdEZ1bmM/LmFybiwgdW5kZWZpbmVkKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIHJvdXRlIHR5cGUgJHtyb3V0ZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBvcmlnaW5zID0gYXJncy5yb3V0ZXMubWFwKCgocm91dGU6IFJvdXRlKTogYXdzLnR5cGVzLmlucHV0LmNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uT3JpZ2luID0+IHtcbiAgICAgICAgICAgIGlmIChyb3V0ZS50eXBlID09IFJvdXRlVHlwZS5DdXN0b20pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBvcmlnaW5JZDogYHJvdXRlLSR7cm91dGUucGF0aFBhdHRlcm59YCxcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluTmFtZTogcm91dGUub3JpZ2luRG9tYWluTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tT3JpZ2luQ29uZmlnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBodHRwUG9ydDogODAsXG4gICAgICAgICAgICAgICAgICAgICAgICBodHRwc1BvcnQ6IDQ0MyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpblByb3RvY29sUG9saWN5OiBcImh0dHBzLW9ubHlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpblNzbFByb3RvY29sczogW1wiVExTdjEuMlwiXVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJvdXRlLnR5cGUgPT0gUm91dGVUeXBlLlZQQykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIG9yaWdpbklkOiBgcm91dGUtJHtyb3V0ZS5wYXRoUGF0dGVybn1gLFxuICAgICAgICAgICAgICAgICAgICBkb21haW5OYW1lOiByb3V0ZS5vcmlnaW5Eb21haW5OYW1lLFxuICAgICAgICAgICAgICAgICAgICB2cGNPcmlnaW5Db25maWc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZwY09yaWdpbklkOiByb3V0ZS52cGNPcmlnaW5JZCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyb3V0ZS50eXBlID09IFJvdXRlVHlwZS5MYW1iZGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBvcmlnaW5JZDogYHJvdXRlLSR7cm91dGUucGF0aFBhdHRlcm59YCxcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluTmFtZTogcm91dGUuZnVuY3Rpb25VcmwuZnVuY3Rpb25VcmwuYXBwbHkodXJsID0+IG5ldyBVUkwodXJsKS5ob3N0KSxcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luQWNjZXNzQ29udHJvbElkOiAocm91dGUudXNlT3JpZ2luQWNjZXNzQ29udHJvbCA/PyB0cnVlKSA/IGxhbWJkYU9yaWdpbkFjY2Vzc0NvbnRyb2wuaWQgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbU9yaWdpbkNvbmZpZzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaHR0cFBvcnQ6IDgwLFxuICAgICAgICAgICAgICAgICAgICAgICAgaHR0cHNQb3J0OiA0NDMsXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5Qcm90b2NvbFBvbGljeTogXCJodHRwcy1vbmx5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5Tc2xQcm90b2NvbHM6IFtcIlRMU3YxLjJcIl1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyb3V0ZS50eXBlID09IFJvdXRlVHlwZS5TMykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHMzRm9sZGVyID0gZ2V0UzNGb2xkZXIocm91dGUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIG9yaWdpbklkOiBgcm91dGUtJHtyb3V0ZS5wYXRoUGF0dGVybn1gLFxuICAgICAgICAgICAgICAgICAgICBkb21haW5OYW1lOiBwdWx1bWkub3V0cHV0KHMzRm9sZGVyLmJ1Y2tldCkuYnVja2V0UmVnaW9uYWxEb21haW5OYW1lLFxuICAgICAgICAgICAgICAgICAgICBvcmlnaW5BY2Nlc3NDb250cm9sSWQ6IHMzT3JpZ2luQWNjZXNzQ29udHJvbC5pZCxcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luUGF0aDogcHVsdW1pLm91dHB1dChzM0ZvbGRlci5wYXRoKS5hcHBseShwYXRoID0+IHBhdGggIT09ICcnID8gYC8ke3BhdGh9YCA6IHVuZGVmaW5lZCkgYXMgYW55LCAvLyBvcmlnaW5QYXRoIHR5cGUgaXMgZGVjbGFyZWQgaW5jb3JyZWN0bHlcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyb3V0ZS50eXBlID09IFJvdXRlVHlwZS5TaW5nbGVBc3NldCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIG9yaWdpbklkOiBgcm91dGUtJHtyb3V0ZS5wYXRoUGF0dGVybn1gLFxuICAgICAgICAgICAgICAgICAgICBkb21haW5OYW1lOiBzaW5nbGVBc3NldEJ1Y2tldC5nZXRCdWNrZXQoKS5idWNrZXRSZWdpb25hbERvbWFpbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgIG9yaWdpbkFjY2Vzc0NvbnRyb2xJZDogczNPcmlnaW5BY2Nlc3NDb250cm9sLmlkLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgcm91dGUgJHtyb3V0ZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uID0gbmV3IGF3cy5jbG91ZGZyb250LkRpc3RyaWJ1dGlvbihuYW1lLCB7XG4gICAgICAgICAgICBvcmlnaW5zLFxuICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIGlzSXB2NkVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICBodHRwVmVyc2lvbjogXCJodHRwMmFuZDNcIixcbiAgICAgICAgICAgIGNvbW1lbnQ6IGAke25hbWV9YCxcbiAgICAgICAgICAgIGFsaWFzZXM6IFt0aGlzLmRvbWFpbl0sXG4gICAgICAgICAgICBvcmRlcmVkQ2FjaGVCZWhhdmlvcnM6IGFyZ3Mucm91dGVzLnNsaWNlKDAsIC0xKS5tYXAocm91dGUgPT4gKHtcbiAgICAgICAgICAgICAgICBwYXRoUGF0dGVybjogcm91dGUucGF0aFBhdHRlcm4sXG4gICAgICAgICAgICAgICAgLi4uZ2V0Q2FjaGVCZWhhdmlvcihyb3V0ZSksXG4gICAgICAgICAgICB9KSksXG4gICAgICAgICAgICBkZWZhdWx0Q2FjaGVCZWhhdmlvcjogZ2V0Q2FjaGVCZWhhdmlvcihkZWZhdWx0Um91dGUpLFxuICAgICAgICAgICAgcHJpY2VDbGFzczogXCJQcmljZUNsYXNzXzEwMFwiLFxuICAgICAgICAgICAgcmVzdHJpY3Rpb25zOiB7XG4gICAgICAgICAgICAgICAgZ2VvUmVzdHJpY3Rpb246IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdHJpY3Rpb25UeXBlOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25zOiBbXSwgLy8gd29ya2Fyb3VuZCBmb3IgQ2xvdWRGcm9udCBpc3N1ZSB3aGVuIHByZXZpb3VzbHkgbG9jYXRpb25zIHdlcmUgY29uZmlndXJlZFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmlld2VyQ2VydGlmaWNhdGU6IHtcbiAgICAgICAgICAgICAgICBhY21DZXJ0aWZpY2F0ZUFybjogYXJncy5hY21DZXJ0aWZpY2F0ZUFybl91c0Vhc3QxLFxuICAgICAgICAgICAgICAgIG1pbmltdW1Qcm90b2NvbFZlcnNpb246IFwiVExTdjEuMl8yMDIxXCIsXG4gICAgICAgICAgICAgICAgc3NsU3VwcG9ydE1ldGhvZDogXCJzbmktb25seVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3VzdG9tRXJyb3JSZXNwb25zZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ29kZTogNDA0LFxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZUNvZGU6IDQwNCxcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogXCIvNDA0Lmh0bWxcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGxvZ2dpbmdDb25maWc6IHtcbiAgICAgICAgICAgICAgICBidWNrZXQ6IGxvZ0J1Y2tldC5idWNrZXRSZWdpb25hbERvbWFpbk5hbWUsXG4gICAgICAgICAgICAgICAgaW5jbHVkZUNvb2tpZXM6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgd2ViQWNsSWQ6IGFyZ3Mud2ViQWNsSWQsXG4gICAgICAgICAgICB3YWl0Rm9yRGVwbG95bWVudDogZmFsc2UsXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHBhcmVudDogdGhpcyxcbiAgICAgICAgICAgIGRlbGV0ZUJlZm9yZVJlcGxhY2U6IHRydWUsXG4gICAgICAgICAgICBhbGlhc2VzOiBbeyBwYXJlbnQ6IHB1bHVtaS5yb290U3RhY2tSZXNvdXJjZSB9XSwgLy8gaWYgdGhlcmUgd2FzIGEgZXhpc3RpbmcgcmVzb3VyY2Ugd2l0aCB0aGUgc2FtZSBuYW1lLCB1c2UgaXRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gcmVxdWVzdCByZWFkIGFjY2VzcyB0byBTM1xuICAgICAgICBhcmdzLnJvdXRlcy5maWx0ZXIociA9PiByLnR5cGUgPT0gUm91dGVUeXBlLlMzKS5mb3JFYWNoKHJvdXRlID0+IHtcbiAgICAgICAgICAgIGlmIChyb3V0ZS5zM0ZvbGRlci5hZGRCdWNrZXRQb2xpY3lTdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGF0ZW1lbnQgPSBjcmVhdGVCdWNrZXRQb2xpY3lTdGF0ZW1lbnQocm91dGUuczNGb2xkZXIuYnVja2V0LmFybiwgdGhpcy5kaXN0cmlidXRpb24uYXJuLCBwdWx1bWkuaW50ZXJwb2xhdGVgJHtyb3V0ZS5zM0ZvbGRlci5wYXRofS8qYCk7XG4gICAgICAgICAgICAgICAgcm91dGUuczNGb2xkZXIuYWRkQnVja2V0UG9saWN5U3RhdGVtZW50KHN0YXRlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGdyYW50IG91cnNlbHZlcyBhY2Nlc3MgdG8gcmVsZXZhbnQgbGFtYmRhIGZ1bmN0aW9uIFVSTHNcbiAgICAgICAgYXJncy5yb3V0ZXMuZmlsdGVyKHIgPT4gci50eXBlID09IFJvdXRlVHlwZS5MYW1iZGEpLmZvckVhY2gocm91dGUgPT4ge1xuICAgICAgICAgICAgbmV3IGF3cy5sYW1iZGEuUGVybWlzc2lvbihgJHtuYW1lfS0ke3JvdXRlLnBhdGhQYXR0ZXJufWAsIHtcbiAgICAgICAgICAgICAgICBzdGF0ZW1lbnRJZDogcHVsdW1pLmludGVycG9sYXRlYGNsb3VkZnJvbnQtJHt0aGlzLmRpc3RyaWJ1dGlvbi5pZH1gLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogXCJsYW1iZGE6SW52b2tlRnVuY3Rpb25VcmxcIixcbiAgICAgICAgICAgICAgICBwcmluY2lwYWw6IFwiY2xvdWRmcm9udC5hbWF6b25hd3MuY29tXCIsXG4gICAgICAgICAgICAgICAgc291cmNlQXJuOiB0aGlzLmRpc3RyaWJ1dGlvbi5hcm4sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb246IHJvdXRlLmZ1bmN0aW9uVXJsLmZ1bmN0aW9uTmFtZSxcbiAgICAgICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBzaW5nbGVBc3NldEJ1Y2tldC5zZXR1cEFjY2Vzc1BvbGljeSh0aGlzLmRpc3RyaWJ1dGlvbi5hcm4pO1xuXG4gICAgICAgIGNyZWF0ZUNsb3VkZnJvbnREbnNSZWNvcmRzKG5hbWUsIHRoaXMuZGlzdHJpYnV0aW9uLCB6b25lLmlkLCBhcmdzLnN1YkRvbWFpbiwge1xuICAgICAgICAgICAgcGFyZW50OiB0aGlzLFxuICAgICAgICAgICAgYWxpYXNlczogW3sgcGFyZW50OiBwdWx1bWkucm9vdFN0YWNrUmVzb3VyY2UgfV0sIC8vIGlmIHRoZXJlIHdhcyBhIGV4aXN0aW5nIHJlc291cmNlIHdpdGggdGhlIHNhbWUgbmFtZSwgdXNlIGl0XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZGlzdHJpYnV0aW9uQXJuID0gdGhpcy5kaXN0cmlidXRpb24uYXJuO1xuICAgIH1cbn1cblxuXG5leHBvcnQgaW50ZXJmYWNlIFdlYnNpdGVBcmdzIHtcbiAgICAvKipcbiAgICAgKiBBUk4gb2YgdGhlIEhUVFBTIGNlcnRpZmljYXRlLiBUaGUgQUNNIGNlcnRpZmljYXRlIG11c3QgYmUgY3JlYXRlZCBpbiB0aGUgdXMtZWFzdC0xIHJlZ2lvbiFcbiAgICAgKi9cbiAgICByZWFkb25seSBhY21DZXJ0aWZpY2F0ZUFybl91c0Vhc3QxOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBPcHRpb25hbGx5LCBwcm90ZWN0cyB0aGUgd2Vic2l0ZSB3aXRoIEhUVFAgYmFzaWMgYXV0aC5cbiAgICAgKi9cbiAgICByZWFkb25seSBiYXNpY0F1dGg/OiBCYXNpY0F1dGhBcmdzO1xuXG4gICAgcmVhZG9ubHkgaG9zdGVkWm9uZUlkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcblxuICAgIC8qKlxuICAgICAqIFNwZWNpZmllcyB0aGUgcm91dGVzIHRvIGJlIHNlcnZlZC5cbiAgICAgKiBUaGUgZmlyc3Qgcm91dGUgdG8gbWF0Y2ggYSByZXF1ZXN0ZWQgcGF0aCB3aW5zLlxuICAgICAqIFRoZSBsYXN0IHJvdXRlIG11c3QgdXNlIHBhdGggcGF0dGVybiBcIi9cIiwgYW5kIGlzIHRoZSBkZWZhdWx0IHJvdXRlLlxuICAgICAqIFxuICAgICAqIEludGVybmFsbHksIHRoaXMgZ2V0cyB0cmFuc2xhdGVkIGludG8gQ2xvdWRGcm9udCBjYWNoZSBiZWhhdmlvcnMuXG4gICAgICovXG4gICAgcmVhZG9ubHkgcm91dGVzOiBSb3V0ZVtdO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHN1YmRvbWFpbiB3aXRoaW4gdGhlIGhvc3RlZCB6b25lIG9yIG51bGwgaWYgdGhlIHpvbmUgYXBleCBzaG91bGQgYmUgdXNlZC5cbiAgICAgKi9cbiAgICByZWFkb25seSBzdWJEb21haW4/OiBzdHJpbmc7XG5cbiAgICByZWFkb25seSB3ZWJBY2xJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgdHlwZSBSb3V0ZSA9IEN1c3RvbVJvdXRlIHwgTGFtYmRhUm91dGUgfCBTM1JvdXRlIHwgU2luZ2xlQXNzZXRSb3V0ZSB8IFZwY1JvdXRlO1xuXG5leHBvcnQgZW51bSBSb3V0ZVR5cGUge1xuICAgIEN1c3RvbSxcbiAgICBMYW1iZGEsXG4gICAgU2luZ2xlQXNzZXQsXG4gICAgUzMsXG4gICAgVlBDLFxufVxuXG4vKipcbiAqIFNlcnZlcyB0aGUgZ2l2ZW4gcm91dGUgZnJvbSBhIGN1c3RvbSBzZXJ2ZXIuXG4gKi9cbmV4cG9ydCB0eXBlIEN1c3RvbVJvdXRlID0ge1xuICAgIHJlYWRvbmx5IHR5cGU6IFJvdXRlVHlwZS5DdXN0b207XG4gICAgcmVhZG9ubHkgcGF0aFBhdHRlcm46IHN0cmluZztcblxuICAgIHJlYWRvbmx5IG9yaWdpbkRvbWFpbk5hbWU6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuXG4gICAgLyoqXG4gICAgICogQ2FjaGluZyBwb2xpY3kuIEJ5IGRlZmF1bHQsIGNhY2hpbmcgaXMgZGlzYWJsZWQuXG4gICAgICovXG4gICAgcmVhZG9ubHkgY2FjaGVQb2xpY3lJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuXG4gICAgcmVhZG9ubHkgb3JpZ2luUmVxdWVzdFBvbGljeUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG59XG5cbmV4cG9ydCB0eXBlIFZwY1JvdXRlID0ge1xuICAgIHJlYWRvbmx5IHR5cGU6IFJvdXRlVHlwZS5WUEM7XG4gICAgcmVhZG9ubHkgcGF0aFBhdHRlcm46IHN0cmluZztcblxuICAgIHJlYWRvbmx5IHZwY09yaWdpbklkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcblxuICAgIHJlYWRvbmx5IG9yaWdpbkRvbWFpbk5hbWU6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuXG4gICAgLyoqXG4gICAgICogQ2FjaGluZyBwb2xpY3kuIEJ5IGRlZmF1bHQsIGNhY2hpbmcgaXMgZGlzYWJsZWQuXG4gICAgICovXG4gICAgcmVhZG9ubHkgY2FjaGVQb2xpY3lJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuXG4gICAgcmVhZG9ubHkgb3JpZ2luUmVxdWVzdFBvbGljeUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG59XG5cbi8qKlxuICogU2VydmVzIHRoZSBnaXZlbiByb3V0ZSBmcm9tIGEgTGFtYmRhIGZ1bmN0aW9uLlxuICogXG4gKiBUaGUgZnVuY3Rpb24gbWF5IHVzZSBBV1NfSUFNIGZvciBhdXRoZW50aWNhdGlvbi5cbiAqIFJlcXVlc3RzIHRvIHRoZSBmdW5jdGlvbiBVUkwgd2lsbCBnZXQgc2lnbmVkIGFuZCBhIGludm9rZSBwZXJtaXNzaW9uIGlzIGF1dG9tYXRpY2FsbHkgYWRkZWQuXG4gKi9cbmV4cG9ydCB0eXBlIExhbWJkYVJvdXRlID0ge1xuICAgIHJlYWRvbmx5IHR5cGU6IFJvdXRlVHlwZS5MYW1iZGE7XG4gICAgcmVhZG9ubHkgcGF0aFBhdHRlcm46IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSBmdW5jdGlvbiBVUkwgcmVzb3VyY2UgdG8gaW50ZWdyYXRlLlxuICAgICAqL1xuICAgIHJlYWRvbmx5IGZ1bmN0aW9uVXJsOiBhd3MubGFtYmRhLkZ1bmN0aW9uVXJsO1xuXG4gICAgLyoqXG4gICAgICogSWYgdGhlIE9BQyBzaG91bGQgYmUgdXNlZCB0byBzaWduIHJlcXVlc3RzIHRvIHRoZSBMYW1iZGEgb3JpZ2luLlxuICAgICAqIERlZmF1bHQgaXMgdHJ1ZS5cbiAgICAgKiBcbiAgICAgKiBDYW4gYmUgc2V0IHRvIGRpc2FibGVkIG9uIGZpcnN0IGNyZWF0aW9uLCB0byB3b3JrYXJvdW5kIGFuIGlzc3VlIHdpdGggQ2xvdWRGcm9udCwgc2VlXG4gICAgICogXCJCZWZvcmUgeW91IGNyZWF0ZSBhbiBPQUMgb3Igc2V0IGl0IHVwIGluIGEgQ2xvdWRGcm9udCBkaXN0cmlidXRpb24sIG1ha2Ugc3VyZSB0aGUgT0FDIGhhcyBwZXJtaXNzaW9uIHRvIGFjY2VzcyB0aGUgTGFtYmRhIGZ1bmN0aW9uIFVSTC5cIlxuICAgICAqIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9BbWF6b25DbG91ZEZyb250L2xhdGVzdC9EZXZlbG9wZXJHdWlkZS9wcml2YXRlLWNvbnRlbnQtcmVzdHJpY3RpbmctYWNjZXNzLXRvLWxhbWJkYS5odG1sI2NyZWF0ZS1vYWMtb3ZlcnZpZXctbGFtYmRhXG4gICAgICovXG4gICAgcmVhZG9ubHkgdXNlT3JpZ2luQWNjZXNzQ29udHJvbD86IGJvb2xlYW47XG59XG5cbi8qKlxuICogU2VydmVzIHRoZSBnaXZlbiByb3V0ZSBmcm9tIGEgUzMgYnVja2V0IGxvY2F0aW9uLlxuICogQXV0b21hdGljYWxseSBoYW5kbGVzIFVSTCByZXdyaXRlcywgc28gdGhhdCB3aGVuIHRoZSB1c2VyIGxvYWRzIC9wcm9kdWN0LCBpdCB3aWxsIGludGVybmFsbHkgbG9hZCAvcHJvZHVjdC9pbmRleC5odG1sIGZyb20gUzMuXG4gKiBcbiAqIFlvdSBtdXN0IG1ha2Ugc3VyZSB0aGUgYnVja2V0IGhhcyBhIHJlc291cmNlIHBvbGljeSB0aGF0IGFsbG93cyByZWFkIGFjY2VzcyBmcm9tIENsb3VkRnJvbnQuXG4gKiBJZiB5b3UncmUgdXNpbmcgUzNBcnRpZmFjdFN0b3JlLCB0aGlzIGNhbiBiZSBhY2hpZXZlZCBieSBjYWxsaW5nIGl0J3MgY3JlYXRlQnVja2V0UG9saWN5IG1ldGhvZC5cbiAqL1xuZXhwb3J0IHR5cGUgUzNSb3V0ZSA9IHtcbiAgICByZWFkb25seSB0eXBlOiBSb3V0ZVR5cGUuUzM7XG4gICAgcmVhZG9ubHkgcGF0aFBhdHRlcm46IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFdoZXJlIHRoZSBzdGF0aWMgYXNzZXRzIGFyZSBzdG9yZWQgaW4gUzMuXG4gICAgICovXG4gICAgcmVhZG9ubHkgczNGb2xkZXI6IFMzRm9sZGVyO1xuXG4gICAgLyoqXG4gICAgICogT3B0aW9uYWxseSwgc3BlY2lmeSB5b3VyIG93biB2aWV3ZXIgcmVxdWVzdCBmdW5jdGlvbiAoaW5zdGVhZCBvZiB1c2luZyBvdXIgZGVmYXVsdCkuXG4gICAgICogSWYgY29uZmlndXJlZCwgYmFzaWMgYXV0aCBwcm90ZWN0aW9uIGlzIG5vdCBhdmFpbGFibGUgZm9yIHRoaXMgcm91dGUuXG4gICAgICovXG4gICAgcmVhZG9ubHkgdmlld2VyUmVxdWVzdEZ1bmN0aW9uQXJuPzogcHVsdW1pLklucHV0PHN0cmluZz47XG5cbiAgICAvKipcbiAgICAgKiBPcHRpb25hbGx5LCBzcGVjaWZ5IGEgdmlld2VyIHJlc3BvbnNlIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIHJlYWRvbmx5IHZpZXdlclJlc3BvbnNlRnVuY3Rpb25Bcm4/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcblxuICAgIC8qKlxuICAgICAqIElmICd0cmFpbGluZ1NsYXNoJyBpcyBmYWxzZSAodGhlIGRlZmF1bHQpLCB0cmFpbGluZyBzbGFzaGVzIGFyZSBub3QgdXNlZC5cbiAgICAgKiBXaGVuIHRoZSB1c2VyIGxvYWRzIC9hYm91dCwgaXQgd2lsbCBpbnRlcm5hbGx5IGxvYWQgL2Fib3V0Lmh0bWwgZnJvbSBTMy5cbiAgICAgKiBXaGVuIC9hYm91dC8gaXMgcmVxdWVzdGVkIGl0IHdpbGwgcmVzdWx0IGluIGEgcmVkaXJlY3QgdG8gYSBVUkwgd2l0aG91dCB0aGUgdHJhaWxpbmcgc2xhc2guXG4gICAgICogXG4gICAgICogSWYgJ3RyYWlsaW5nU2xhc2gnIGlzIHRydWUsIHdlIGFwcGVuZCAvaW5kZXguaHRtbCB0byByZXF1ZXN0cyB0aGF0IGVuZCB3aXRoIGEgc2xhc2ggb3IgZG9u4oCZdCBpbmNsdWRlIGEgZmlsZSBleHRlbnNpb24gaW4gdGhlIFVSTC5cbiAgICAgKi9cbiAgICByZWFkb25seSB0cmFpbGluZ1NsYXNoPzogYm9vbGVhbjtcblxuICAgIC8qKlxuICAgICAqIENhY2hpbmcgcG9saWN5LiBCeSBkZWZhdWx0LCByZXNvdXJjZXMgYXJlIGNhY2hlZCBmb3Igb25lIG1pbnV0ZS5cbiAgICAgKi9cbiAgICByZWFkb25seSBvcmlnaW5DYWNoZVBvbGljeUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcmVzcG9uc2UgaGVhZGVyIHBvbGljeSB0byBiZSB1c2VkLlxuICAgICAqIFxuICAgICAqIEJ5IGRlZmF1bHQ6XG4gICAgICogVXNlcyBhIHBvbGljeSB0aGF0IHNldHMgY2FjaGluZyBoZWFkZXJzIHRoYXQgYWxsb3cgdGhlIGJyb3dzZXIgdG8gY2FjaGUgcmVzb3VyY2VzIGJ1dCBmb3JjZXMgaXQgdG8gcmUtdmFsaWRhdGUgdGhlbSBiZWZvcmUgZWFjaCB1c2UuXG4gICAgICogSWYgJ2ltbXV0YWJsZScgaXMgdHJ1ZSwgcmV0dXJucyBoZWFkZXJzIHRoYXQgYWxsb3cgdGhlIGJyb3dzZXIgdG8gY2FjaGUgcmVzb3VyY2VzIGZvcmV2ZXIuXG4gICAgICovXG4gICAgcmVhZG9ubHkgcmVzcG9uc2VIZWFkZXJzUG9saWN5SWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IHR5cGUgU2luZ2xlQXNzZXRSb3V0ZSA9IHtcbiAgICByZWFkb25seSB0eXBlOiBSb3V0ZVR5cGUuU2luZ2xlQXNzZXQ7XG4gICAgLyoqXG4gICAgICogTXVzdCBzdGFydCB3aXRoIGEgc2xhc2guIE11c3Qgbm90IGNvbnRhaW4gd2lsZGNhcmQgY2hhcmFjdGVycy5cbiAgICAgKi9cbiAgICByZWFkb25seSBwYXRoUGF0dGVybjogc3RyaW5nO1xuICAgIHJlYWRvbmx5IGNvbnRlbnQ6IHN0cmluZyB8IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICByZWFkb25seSBjb250ZW50VHlwZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJhc2ljQXV0aEFyZ3Mge1xuICAgIHJlYWRvbmx5IHVzZXJuYW1lOiBzdHJpbmc7XG4gICAgcmVhZG9ubHkgcGFzc3dvcmQ6IHN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2V0RnVuY3Rpb25Bc3NvY2lhdGlvbnModmlld2VyUmVxdWVzdEZ1bmNBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+IHwgdW5kZWZpbmVkLCB2aWV3ZXJSZXNwb25zZUZ1bmNBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+IHwgdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgYXNzb2NpYXRpb25zID0gW107XG5cbiAgICBpZiAodmlld2VyUmVxdWVzdEZ1bmNBcm4gIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFzc29jaWF0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgIGV2ZW50VHlwZTogYHZpZXdlci1yZXF1ZXN0YCxcbiAgICAgICAgICAgIGZ1bmN0aW9uQXJuOiB2aWV3ZXJSZXF1ZXN0RnVuY0FybixcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHZpZXdlclJlc3BvbnNlRnVuY0FybiAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXNzb2NpYXRpb25zLnB1c2goe1xuICAgICAgICAgICAgZXZlbnRUeXBlOiBgdmlld2VyLXJlc3BvbnNlYCxcbiAgICAgICAgICAgIGZ1bmN0aW9uQXJuOiB2aWV3ZXJSZXNwb25zZUZ1bmNBcm4sXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBhc3NvY2lhdGlvbnMubGVuZ3RoID4gMCA/IGFzc29jaWF0aW9ucyA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gZ2V0UzNGb2xkZXIoczNSb3V0ZTogUzNSb3V0ZSk6IFMzRm9sZGVyIHtcbiAgICBpZiAoczNSb3V0ZS5zM0ZvbGRlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBzM1JvdXRlLnMzRm9sZGVyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRWl0aGVyICdzM0xvY2F0aW9uJyBvciAnczNGb2xkZXInIG11c3QgYmUgc3BlY2lmaWVkLmApO1xuICAgIH1cbn1cbiJdfQ==