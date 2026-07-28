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
exports.Routing = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const SingleAssetBucket_1 = require("./SingleAssetBucket");
const route_types_1 = require("./route-types");
const utils_1 = require("./utils");
/**
 * Defines the routes of the website, i.e. which content should be served on which path pattern and how it should be cached.
 *
 * Does not create the CloudFront distribution itself.
 * Therefore, it also does not set up read/invoke permissions for the origins.
 */
class Routing {
    constructor(props) {
        this.props = props;
        const { name, parent } = props;
        this.s3OriginAccessControl = new aws.cloudfront.OriginAccessControl(name, {
            originAccessControlOriginType: "s3",
            signingBehavior: "always",
            signingProtocol: "sigv4",
        }, { parent });
        const singleAssetRoutes = props.routes.filter(r => r.type == route_types_1.RouteType.SingleAsset);
        if (singleAssetRoutes.length > 0) {
            const singleAssetBucket = new SingleAssetBucket_1.SingleAssetBucket(`${name}-asset`, {
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
    createRoutes() {
        const effectiveRoutes = this.props.routes.map((route, index) => {
            if (route.type == route_types_1.RouteType.Primitive) {
                return route;
            }
            else {
                return this.createRoute(route, index);
            }
        });
        if (effectiveRoutes.length == 0) {
            throw new Error("At least one route must be defined");
        }
        const defaultRoute = effectiveRoutes.at(-1);
        if (defaultRoute.pathPattern !== "/*") {
            throw new Error("The default route must use path pattern '/*'");
        }
        return effectiveRoutes;
    }
    createRoute(route, index) {
        var _a;
        const defaultCustomOriginConfig = {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "https-only",
            originSslProtocols: ["TLSv1.2"],
            originReadTimeout: 120
        };
        if (route.type == route_types_1.RouteType.Custom) {
            return {
                pathPattern: route.pathPattern,
                origin: {
                    originId: `route-${route.pathPattern}`,
                    domainName: route.originDomainName,
                    customOriginConfig: defaultCustomOriginConfig,
                    connectionAttempts: 1
                },
                cacheBehavior: this.getRouteCacheBehavior(route, index)
            };
        }
        else if (route.type == route_types_1.RouteType.VPC) {
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
        }
        else if (route.type == route_types_1.RouteType.Lambda) {
            return {
                pathPattern: route.pathPattern,
                origin: {
                    originId: `route-${route.pathPattern}`,
                    domainName: route.functionUrl.functionUrl.apply(url => new URL(url).host),
                    customOriginConfig: defaultCustomOriginConfig,
                    connectionAttempts: 1
                },
                cacheBehavior: {
                    ...(this.getRouteCacheBehavior(route, index)),
                    originRequestPolicyId: (_a = route.originRequestPolicyId) !== null && _a !== void 0 ? _a : getOriginRequestPolicyId('Managed-AllViewerExceptHostHeader'),
                }
            };
        }
        else if (route.type == route_types_1.RouteType.S3) {
            return {
                pathPattern: route.pathPattern,
                origin: {
                    originId: `route-${route.pathPattern}`,
                    domainName: pulumi.output(route.s3Folder.bucket).bucketRegionalDomainName,
                    originAccessControlId: this.s3OriginAccessControl.id,
                    originPath: pulumi.output(route.s3Folder.path).apply(path => path !== '' ? `/${path}` : undefined), // originPath type is declared incorrectly
                },
                cacheBehavior: this.getRouteCacheBehavior(route, index)
            };
        }
        else if (route.type == route_types_1.RouteType.SingleAsset) {
            return {
                pathPattern: route.pathPattern,
                origin: {
                    originId: `route-${route.pathPattern}`,
                    domainName: this.singleAssetBucket.getBucket().bucketRegionalDomainName,
                    originAccessControlId: this.s3OriginAccessControl.id,
                },
                cacheBehavior: this.getRouteCacheBehavior(route, index)
            };
        }
        else {
            throw new Error(`Unsupported route ${route}`);
        }
    }
    getRouteCacheBehavior(route, index) {
        var _a, _b, _c, _d;
        const defaultViewerRequestFunc = this.props.getDefaultViewerRequestFunction(route, index);
        const viewerRequestFuncArn = route.getViewerRequestFunctionArn ? route.getViewerRequestFunctionArn(defaultViewerRequestFunc) : (_a = defaultViewerRequestFunc.createOrUndefined()) === null || _a === void 0 ? void 0 : _a.arn;
        const defaultViewerResponseFunc = this.props.getDefaultViewerResponseFunction(route, index);
        const viewerResponseFuncArn = route.getViewerResponseFunctionArn ? route.getViewerResponseFunctionArn(defaultViewerResponseFunc) : (_b = defaultViewerResponseFunc.createOrUndefined()) === null || _b === void 0 ? void 0 : _b.arn;
        const isS3Origin = route.type == route_types_1.RouteType.S3 || route.type == route_types_1.RouteType.SingleAsset;
        const allowedMethods = isS3Origin ? ["HEAD", "GET"] : ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"];
        const defaultOriginRequestPolicyId = isS3Origin ? undefined : getOriginRequestPolicyId('Managed-AllViewer');
        return {
            targetOriginId: `route-${route.pathPattern}`,
            allowedMethods,
            cachedMethods: ["HEAD", "GET"],
            cachePolicyId: (_c = route.cachePolicyId) !== null && _c !== void 0 ? _c : this.props.getDefaultCachePolicyArn(route),
            compress: true,
            viewerProtocolPolicy: "redirect-to-https",
            originRequestPolicyId: (_d = route.originRequestPolicyId) !== null && _d !== void 0 ? _d : defaultOriginRequestPolicyId,
            responseHeadersPolicyId: this.getDefaultResponseHeadersPolicy().id,
            functionAssociations: getFunctionAssociations(viewerRequestFuncArn, viewerResponseFuncArn),
        };
    }
    getDefaultResponseHeadersPolicy() {
        if (this.defaultResponseHeadersPolicy) {
            return this.defaultResponseHeadersPolicy;
        }
        else {
            const defaultResponseHeadersPolicy = new aws.cloudfront.ResponseHeadersPolicy(`${this.props.name}-default`, {
                securityHeadersConfig: utils_1.defaultSecurityHeadersConfig,
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
exports.Routing = Routing;
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
function getOriginRequestPolicyId(name) {
    return aws.cloudfront.getOriginRequestPolicyOutput({ name }).apply(policy => policy.id);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUm91dGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJzaXRlL1JvdXRpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLDJEQUF3RDtBQUV4RCwrQ0FBbUc7QUFDbkcsbUNBQXVEO0FBR3ZEOzs7OztHQUtHO0FBQ0gsTUFBYSxPQUFPO0lBT2hCLFlBQVksS0FBMEI7UUFDbEMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFL0IsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUU7WUFDdEUsNkJBQTZCLEVBQUUsSUFBSTtZQUNuQyxlQUFlLEVBQUUsUUFBUTtZQUN6QixlQUFlLEVBQUUsT0FBTztTQUMzQixFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUVmLE1BQU0saUJBQWlCLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLHVCQUFTLENBQUMsV0FBVyxDQUF1QixDQUFDO1FBQzFHLElBQUksaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQy9CLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxxQ0FBaUIsQ0FBQyxHQUFHLElBQUksUUFBUSxFQUFFO2dCQUM3RCxNQUFNLEVBQUUsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDcEMsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO29CQUN0QixXQUFXLEVBQUUsS0FBSyxDQUFDLFdBQVc7b0JBQzlCLElBQUksRUFBRSxLQUFLLENBQUMsV0FB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QUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBSSxDQUFDLENBQUM7QUFDOUYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tIFwiQHB1bHVtaS9hd3NcIjtcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcbmltcG9ydCB7IFNpbmdsZUFzc2V0QnVja2V0IH0gZnJvbSBcIi4vU2luZ2xlQXNzZXRCdWNrZXRcIjtcbmltcG9ydCB7IFZpZXdlclJlcXVlc3RGdW5jdGlvbiwgVmlld2VyUmVzcG9uc2VGdW5jdGlvbiB9IGZyb20gXCIuL2Nsb3VkZnJvbnQtZnVuY3Rpb25cIjtcbmltcG9ydCB7IENvbWZvcnRSb3V0ZSwgQ29tbW9uUm91dGVQcm9wcywgUm91dGUsIFJvdXRlVHlwZSwgU2luZ2xlQXNzZXRSb3V0ZSB9IGZyb20gXCIuL3JvdXRlLXR5cGVzXCI7XG5pbXBvcnQgeyBkZWZhdWx0U2VjdXJpdHlIZWFkZXJzQ29uZmlnIH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuXG4vKipcbiAqIERlZmluZXMgdGhlIHJvdXRlcyBvZiB0aGUgd2Vic2l0ZSwgaS5lLiB3aGljaCBjb250ZW50IHNob3VsZCBiZSBzZXJ2ZWQgb24gd2hpY2ggcGF0aCBwYXR0ZXJuIGFuZCBob3cgaXQgc2hvdWxkIGJlIGNhY2hlZC5cbiAqIFxuICogRG9lcyBub3QgY3JlYXRlIHRoZSBDbG91ZEZyb250IGRpc3RyaWJ1dGlvbiBpdHNlbGYuXG4gKiBUaGVyZWZvcmUsIGl0IGFsc28gZG9lcyBub3Qgc2V0IHVwIHJlYWQvaW52b2tlIHBlcm1pc3Npb25zIGZvciB0aGUgb3JpZ2lucy5cbiAqL1xuZXhwb3J0IGNsYXNzIFJvdXRpbmcge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgcHJvcHM6IFdlYnNpdGVSb3V0aW5nUHJvcHM7XG4gICAgcHJpdmF0ZSByZWFkb25seSBzM09yaWdpbkFjY2Vzc0NvbnRyb2w6IGF3cy5jbG91ZGZyb250Lk9yaWdpbkFjY2Vzc0NvbnRyb2w7XG4gICAgcHJpdmF0ZSBkZWZhdWx0UmVzcG9uc2VIZWFkZXJzUG9saWN5OiBhd3MuY2xvdWRmcm9udC5SZXNwb25zZUhlYWRlcnNQb2xpY3kgfCB1bmRlZmluZWQ7XG4gICAgcHVibGljIHNpbmdsZUFzc2V0QnVja2V0OiBTaW5nbGVBc3NldEJ1Y2tldCB8IHVuZGVmaW5lZDtcbiAgICBwdWJsaWMgZWZmZWN0aXZlUm91dGVzOiBFZmZlY3RpdmVSb3V0ZVtdO1xuXG4gICAgY29uc3RydWN0b3IocHJvcHM6IFdlYnNpdGVSb3V0aW5nUHJvcHMpIHtcbiAgICAgICAgdGhpcy5wcm9wcyA9IHByb3BzO1xuICAgICAgICBjb25zdCB7IG5hbWUsIHBhcmVudCB9ID0gcHJvcHM7XG5cbiAgICAgICAgdGhpcy5zM09yaWdpbkFjY2Vzc0NvbnRyb2wgPSBuZXcgYXdzLmNsb3VkZnJvbnQuT3JpZ2luQWNjZXNzQ29udHJvbChuYW1lLCB7XG4gICAgICAgICAgICBvcmlnaW5BY2Nlc3NDb250cm9sT3JpZ2luVHlwZTogXCJzM1wiLFxuICAgICAgICAgICAgc2lnbmluZ0JlaGF2aW9yOiBcImFsd2F5c1wiLFxuICAgICAgICAgICAgc2lnbmluZ1Byb3RvY29sOiBcInNpZ3Y0XCIsXG4gICAgICAgIH0sIHsgcGFyZW50IH0pO1xuXG4gICAgICAgIGNvbnN0IHNpbmdsZUFzc2V0Um91dGVzID0gcHJvcHMucm91dGVzLmZpbHRlcihyID0+IHIudHlwZSA9PSBSb3V0ZVR5cGUuU2luZ2xlQXNzZXQpIGFzIFNpbmdsZUFzc2V0Um91dGVbXTtcbiAgICAgICAgaWYgKHNpbmdsZUFzc2V0Um91dGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHNpbmdsZUFzc2V0QnVja2V0ID0gbmV3IFNpbmdsZUFzc2V0QnVja2V0KGAke25hbWV9LWFzc2V0YCwge1xuICAgICAgICAgICAgICAgIGFzc2V0czogc2luZ2xlQXNzZXRSb3V0ZXMubWFwKHJvdXRlID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHJvdXRlLmNvbnRlbnQsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiByb3V0ZS5jb250ZW50VHlwZSxcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogcm91dGUucGF0aFBhdHRlcm4sXG4gICAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICB9LCB7IHBhcmVudCB9KTtcbiAgICAgICAgICAgIHRoaXMuc2luZ2xlQXNzZXRCdWNrZXQgPSBzaW5nbGVBc3NldEJ1Y2tldDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZWZmZWN0aXZlUm91dGVzID0gdGhpcy5jcmVhdGVSb3V0ZXMoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNyZWF0ZVJvdXRlcygpOiBFZmZlY3RpdmVSb3V0ZVtdIHtcbiAgICAgICAgY29uc3QgZWZmZWN0aXZlUm91dGVzID0gdGhpcy5wcm9wcy5yb3V0ZXMubWFwKChyb3V0ZSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGlmIChyb3V0ZS50eXBlID09IFJvdXRlVHlwZS5QcmltaXRpdmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcm91dGU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVJvdXRlKHJvdXRlLCBpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChlZmZlY3RpdmVSb3V0ZXMubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkF0IGxlYXN0IG9uZSByb3V0ZSBtdXN0IGJlIGRlZmluZWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkZWZhdWx0Um91dGUgPSBlZmZlY3RpdmVSb3V0ZXMuYXQoLTEpITtcbiAgICAgICAgaWYgKGRlZmF1bHRSb3V0ZS5wYXRoUGF0dGVybiAhPT0gXCIvKlwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgZGVmYXVsdCByb3V0ZSBtdXN0IHVzZSBwYXRoIHBhdHRlcm4gJy8qJ1wiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWZmZWN0aXZlUm91dGVzO1xuICAgIH1cblxuICAgIHByaXZhdGUgY3JlYXRlUm91dGUocm91dGU6IENvbWZvcnRSb3V0ZSwgaW5kZXg6IG51bWJlcik6IEVmZmVjdGl2ZVJvdXRlIHtcbiAgICAgICAgY29uc3QgZGVmYXVsdEN1c3RvbU9yaWdpbkNvbmZpZyA9IHtcbiAgICAgICAgICAgIGh0dHBQb3J0OiA4MCxcbiAgICAgICAgICAgIGh0dHBzUG9ydDogNDQzLFxuICAgICAgICAgICAgb3JpZ2luUHJvdG9jb2xQb2xpY3k6IFwiaHR0cHMtb25seVwiLFxuICAgICAgICAgICAgb3JpZ2luU3NsUHJvdG9jb2xzOiBbXCJUTFN2MS4yXCJdLFxuICAgICAgICAgICAgb3JpZ2luUmVhZFRpbWVvdXQ6IDEyMFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChyb3V0ZS50eXBlID09IFJvdXRlVHlwZS5DdXN0b20pIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgcGF0aFBhdHRlcm46IHJvdXRlLnBhdGhQYXR0ZXJuLFxuICAgICAgICAgICAgICAgIG9yaWdpbjoge1xuICAgICAgICAgICAgICAgICAgICBvcmlnaW5JZDogYHJvdXRlLSR7cm91dGUucGF0aFBhdHRlcm59YCxcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluTmFtZTogcm91dGUub3JpZ2luRG9tYWluTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tT3JpZ2luQ29uZmlnOiBkZWZhdWx0Q3VzdG9tT3JpZ2luQ29uZmlnLFxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uQXR0ZW1wdHM6IDFcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNhY2hlQmVoYXZpb3I6IHRoaXMuZ2V0Um91dGVDYWNoZUJlaGF2aW9yKHJvdXRlLCBpbmRleClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAocm91dGUudHlwZSA9PSBSb3V0ZVR5cGUuVlBDKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHBhdGhQYXR0ZXJuOiByb3V0ZS5wYXRoUGF0dGVybixcbiAgICAgICAgICAgICAgICBvcmlnaW46IHtcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luSWQ6IGByb3V0ZS0ke3JvdXRlLnBhdGhQYXR0ZXJufWAsXG4gICAgICAgICAgICAgICAgICAgIGRvbWFpbk5hbWU6IHJvdXRlLm9yaWdpbkRvbWFpbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHZwY09yaWdpbkNvbmZpZzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdnBjT3JpZ2luSWQ6IHJvdXRlLnZwY09yaWdpbklkLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY2FjaGVCZWhhdmlvcjogdGhpcy5nZXRSb3V0ZUNhY2hlQmVoYXZpb3Iocm91dGUsIGluZGV4KVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChyb3V0ZS50eXBlID09IFJvdXRlVHlwZS5MYW1iZGEpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgcGF0aFBhdHRlcm46IHJvdXRlLnBhdGhQYXR0ZXJuLFxuICAgICAgICAgICAgICAgIG9yaWdpbjoge1xuICAgICAgICAgICAgICAgICAgICBvcmlnaW5JZDogYHJvdXRlLSR7cm91dGUucGF0aFBhdHRlcm59YCxcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluTmFtZTogcm91dGUuZnVuY3Rpb25VcmwuZnVuY3Rpb25VcmwuYXBwbHkodXJsID0+IG5ldyBVUkwodXJsKS5ob3N0KSxcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tT3JpZ2luQ29uZmlnOiBkZWZhdWx0Q3VzdG9tT3JpZ2luQ29uZmlnLFxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uQXR0ZW1wdHM6IDFcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNhY2hlQmVoYXZpb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uKHRoaXMuZ2V0Um91dGVDYWNoZUJlaGF2aW9yKHJvdXRlLCBpbmRleCkpLFxuICAgICAgICAgICAgICAgICAgICBvcmlnaW5SZXF1ZXN0UG9saWN5SWQ6IHJvdXRlLm9yaWdpblJlcXVlc3RQb2xpY3lJZCA/PyBnZXRPcmlnaW5SZXF1ZXN0UG9saWN5SWQoJ01hbmFnZWQtQWxsVmlld2VyRXhjZXB0SG9zdEhlYWRlcicpLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAocm91dGUudHlwZSA9PSBSb3V0ZVR5cGUuUzMpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgcGF0aFBhdHRlcm46IHJvdXRlLnBhdGhQYXR0ZXJuLFxuICAgICAgICAgICAgICAgIG9yaWdpbjoge1xuICAgICAgICAgICAgICAgICAgICBvcmlnaW5JZDogYHJvdXRlLSR7cm91dGUucGF0aFBhdHRlcm59YCxcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluTmFtZTogcHVsdW1pLm91dHB1dChyb3V0ZS5zM0ZvbGRlci5idWNrZXQpLmJ1Y2tldFJlZ2lvbmFsRG9tYWluTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luQWNjZXNzQ29udHJvbElkOiB0aGlzLnMzT3JpZ2luQWNjZXNzQ29udHJvbC5pZCxcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luUGF0aDogcHVsdW1pLm91dHB1dChyb3V0ZS5zM0ZvbGRlci5wYXRoKS5hcHBseShwYXRoID0+IHBhdGggIT09ICcnID8gYC8ke3BhdGh9YCA6IHVuZGVmaW5lZCkgYXMgYW55LCAvLyBvcmlnaW5QYXRoIHR5cGUgaXMgZGVjbGFyZWQgaW5jb3JyZWN0bHlcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNhY2hlQmVoYXZpb3I6IHRoaXMuZ2V0Um91dGVDYWNoZUJlaGF2aW9yKHJvdXRlLCBpbmRleClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAocm91dGUudHlwZSA9PSBSb3V0ZVR5cGUuU2luZ2xlQXNzZXQpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgcGF0aFBhdHRlcm46IHJvdXRlLnBhdGhQYXR0ZXJuLFxuICAgICAgICAgICAgICAgIG9yaWdpbjoge1xuICAgICAgICAgICAgICAgICAgICBvcmlnaW5JZDogYHJvdXRlLSR7cm91dGUucGF0aFBhdHRlcm59YCxcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluTmFtZTogdGhpcy5zaW5nbGVBc3NldEJ1Y2tldCEuZ2V0QnVja2V0KCkuYnVja2V0UmVnaW9uYWxEb21haW5OYW1lLFxuICAgICAgICAgICAgICAgICAgICBvcmlnaW5BY2Nlc3NDb250cm9sSWQ6IHRoaXMuczNPcmlnaW5BY2Nlc3NDb250cm9sLmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY2FjaGVCZWhhdmlvcjogdGhpcy5nZXRSb3V0ZUNhY2hlQmVoYXZpb3Iocm91dGUsIGluZGV4KVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgcm91dGUgJHtyb3V0ZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0Um91dGVDYWNoZUJlaGF2aW9yKHJvdXRlOiBDb21tb25Sb3V0ZVByb3BzLCBpbmRleDogbnVtYmVyKTogYXdzLnR5cGVzLmlucHV0LmNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uRGVmYXVsdENhY2hlQmVoYXZpb3Ige1xuICAgICAgICBjb25zdCBkZWZhdWx0Vmlld2VyUmVxdWVzdEZ1bmMgPSB0aGlzLnByb3BzLmdldERlZmF1bHRWaWV3ZXJSZXF1ZXN0RnVuY3Rpb24ocm91dGUsIGluZGV4KTtcbiAgICAgICAgY29uc3Qgdmlld2VyUmVxdWVzdEZ1bmNBcm4gPSByb3V0ZS5nZXRWaWV3ZXJSZXF1ZXN0RnVuY3Rpb25Bcm4gPyByb3V0ZS5nZXRWaWV3ZXJSZXF1ZXN0RnVuY3Rpb25Bcm4oZGVmYXVsdFZpZXdlclJlcXVlc3RGdW5jKSA6IGRlZmF1bHRWaWV3ZXJSZXF1ZXN0RnVuYy5jcmVhdGVPclVuZGVmaW5lZCgpPy5hcm47XG5cbiAgICAgICAgY29uc3QgZGVmYXVsdFZpZXdlclJlc3BvbnNlRnVuYyA9IHRoaXMucHJvcHMuZ2V0RGVmYXVsdFZpZXdlclJlc3BvbnNlRnVuY3Rpb24ocm91dGUsIGluZGV4KTtcbiAgICAgICAgY29uc3Qgdmlld2VyUmVzcG9uc2VGdW5jQXJuID0gcm91dGUuZ2V0Vmlld2VyUmVzcG9uc2VGdW5jdGlvbkFybiA/IHJvdXRlLmdldFZpZXdlclJlc3BvbnNlRnVuY3Rpb25Bcm4oZGVmYXVsdFZpZXdlclJlc3BvbnNlRnVuYykgOiBkZWZhdWx0Vmlld2VyUmVzcG9uc2VGdW5jLmNyZWF0ZU9yVW5kZWZpbmVkKCk/LmFybjtcblxuICAgICAgICBjb25zdCBpc1MzT3JpZ2luID0gcm91dGUudHlwZSA9PSBSb3V0ZVR5cGUuUzMgfHwgcm91dGUudHlwZSA9PSBSb3V0ZVR5cGUuU2luZ2xlQXNzZXQ7XG4gICAgICAgIGNvbnN0IGFsbG93ZWRNZXRob2RzID0gaXNTM09yaWdpbiA/IFtcIkhFQURcIiwgXCJHRVRcIl0gOiBbXCJIRUFEXCIsIFwiREVMRVRFXCIsIFwiUE9TVFwiLCBcIkdFVFwiLCBcIk9QVElPTlNcIiwgXCJQVVRcIiwgXCJQQVRDSFwiXTtcblxuICAgICAgICBjb25zdCBkZWZhdWx0T3JpZ2luUmVxdWVzdFBvbGljeUlkID0gaXNTM09yaWdpbiA/IHVuZGVmaW5lZCA6IGdldE9yaWdpblJlcXVlc3RQb2xpY3lJZCgnTWFuYWdlZC1BbGxWaWV3ZXInKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGFyZ2V0T3JpZ2luSWQ6IGByb3V0ZS0ke3JvdXRlLnBhdGhQYXR0ZXJufWAsXG4gICAgICAgICAgICBhbGxvd2VkTWV0aG9kcyxcbiAgICAgICAgICAgIGNhY2hlZE1ldGhvZHM6IFtcIkhFQURcIiwgXCJHRVRcIl0sXG4gICAgICAgICAgICBjYWNoZVBvbGljeUlkOiByb3V0ZS5jYWNoZVBvbGljeUlkID8/IHRoaXMucHJvcHMuZ2V0RGVmYXVsdENhY2hlUG9saWN5QXJuKHJvdXRlKSxcbiAgICAgICAgICAgIGNvbXByZXNzOiB0cnVlLFxuICAgICAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IFwicmVkaXJlY3QtdG8taHR0cHNcIixcbiAgICAgICAgICAgIG9yaWdpblJlcXVlc3RQb2xpY3lJZDogcm91dGUub3JpZ2luUmVxdWVzdFBvbGljeUlkID8/IGRlZmF1bHRPcmlnaW5SZXF1ZXN0UG9saWN5SWQsXG4gICAgICAgICAgICByZXNwb25zZUhlYWRlcnNQb2xpY3lJZDogdGhpcy5nZXREZWZhdWx0UmVzcG9uc2VIZWFkZXJzUG9saWN5KCkuaWQsXG4gICAgICAgICAgICBmdW5jdGlvbkFzc29jaWF0aW9uczogZ2V0RnVuY3Rpb25Bc3NvY2lhdGlvbnModmlld2VyUmVxdWVzdEZ1bmNBcm4sIHZpZXdlclJlc3BvbnNlRnVuY0FybiksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXREZWZhdWx0UmVzcG9uc2VIZWFkZXJzUG9saWN5KCk6IGF3cy5jbG91ZGZyb250LlJlc3BvbnNlSGVhZGVyc1BvbGljeSB7XG4gICAgICAgIGlmICh0aGlzLmRlZmF1bHRSZXNwb25zZUhlYWRlcnNQb2xpY3kpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRlZmF1bHRSZXNwb25zZUhlYWRlcnNQb2xpY3k7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0UmVzcG9uc2VIZWFkZXJzUG9saWN5ID0gbmV3IGF3cy5jbG91ZGZyb250LlJlc3BvbnNlSGVhZGVyc1BvbGljeShgJHt0aGlzLnByb3BzLm5hbWV9LWRlZmF1bHRgLCB7XG4gICAgICAgICAgICAgICAgc2VjdXJpdHlIZWFkZXJzQ29uZmlnOiBkZWZhdWx0U2VjdXJpdHlIZWFkZXJzQ29uZmlnLFxuICAgICAgICAgICAgICAgIGN1c3RvbUhlYWRlcnNDb25maWc6IHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXI6IFwiY2FjaGUtY29udHJvbFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IFwibm8tY2FjaGVcIiwgLy8gcmVzcG9uc2UgY2FuIGJlIHN0b3JlZCBpbiBicm93c2VyIGNhY2hlLCBidXQgbXVzdCBiZSB2YWxpZGF0ZWQgd2l0aCB0aGUgc2VydmVyIGJlZm9yZSBlYWNoIHJlLXVzZVxuICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcGFyZW50OiB0aGlzLnByb3BzLnBhcmVudCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5kZWZhdWx0UmVzcG9uc2VIZWFkZXJzUG9saWN5ID0gZGVmYXVsdFJlc3BvbnNlSGVhZGVyc1BvbGljeTtcbiAgICAgICAgICAgIHJldHVybiBkZWZhdWx0UmVzcG9uc2VIZWFkZXJzUG9saWN5O1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFdlYnNpdGVSb3V0aW5nUHJvcHMge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBwYXJlbnQ6IHB1bHVtaS5SZXNvdXJjZTtcbiAgICByZWFkb25seSByb3V0ZXM6IFJvdXRlW107XG5cbiAgICByZWFkb25seSBnZXREZWZhdWx0Q2FjaGVQb2xpY3lBcm46IChyb3V0ZTogQ29tbW9uUm91dGVQcm9wcykgPT4gcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgcmVhZG9ubHkgZ2V0RGVmYXVsdFZpZXdlclJlcXVlc3RGdW5jdGlvbjogKHJvdXRlOiBDb21tb25Sb3V0ZVByb3BzLCBpbmRleDogbnVtYmVyKSA9PiBWaWV3ZXJSZXF1ZXN0RnVuY3Rpb247XG4gICAgcmVhZG9ubHkgZ2V0RGVmYXVsdFZpZXdlclJlc3BvbnNlRnVuY3Rpb246IChyb3V0ZTogQ29tbW9uUm91dGVQcm9wcywgaW5kZXg6IG51bWJlcikgPT4gVmlld2VyUmVzcG9uc2VGdW5jdGlvbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFZmZlY3RpdmVSb3V0ZSB7XG4gICAgcGF0aFBhdHRlcm46IHN0cmluZztcbiAgICBvcmlnaW46IGF3cy50eXBlcy5pbnB1dC5jbG91ZGZyb250LkRpc3RyaWJ1dGlvbk9yaWdpbjtcbiAgICBjYWNoZUJlaGF2aW9yOiBhd3MudHlwZXMuaW5wdXQuY2xvdWRmcm9udC5EaXN0cmlidXRpb25EZWZhdWx0Q2FjaGVCZWhhdmlvcjtcbn1cblxuZnVuY3Rpb24gZ2V0RnVuY3Rpb25Bc3NvY2lhdGlvbnModmlld2VyUmVxdWVzdEZ1bmNBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+IHwgdW5kZWZpbmVkLCB2aWV3ZXJSZXNwb25zZUZ1bmNBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+IHwgdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgYXNzb2NpYXRpb25zID0gW107XG5cbiAgICBpZiAodmlld2VyUmVxdWVzdEZ1bmNBcm4gIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFzc29jaWF0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgIGV2ZW50VHlwZTogYHZpZXdlci1yZXF1ZXN0YCxcbiAgICAgICAgICAgIGZ1bmN0aW9uQXJuOiB2aWV3ZXJSZXF1ZXN0RnVuY0FybixcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHZpZXdlclJlc3BvbnNlRnVuY0FybiAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXNzb2NpYXRpb25zLnB1c2goe1xuICAgICAgICAgICAgZXZlbnRUeXBlOiBgdmlld2VyLXJlc3BvbnNlYCxcbiAgICAgICAgICAgIGZ1bmN0aW9uQXJuOiB2aWV3ZXJSZXNwb25zZUZ1bmNBcm4sXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBhc3NvY2lhdGlvbnMubGVuZ3RoID4gMCA/IGFzc29jaWF0aW9ucyA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gZ2V0T3JpZ2luUmVxdWVzdFBvbGljeUlkKG5hbWU6IHN0cmluZyk6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGF3cy5jbG91ZGZyb250LmdldE9yaWdpblJlcXVlc3RQb2xpY3lPdXRwdXQoeyBuYW1lIH0pLmFwcGx5KHBvbGljeSA9PiBwb2xpY3kuaWQhISk7XG59XG4iXX0=