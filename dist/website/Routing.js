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
        const httpsCustomOriginConfig = {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "https-only",
            originSslProtocols: ["TLSv1.2"]
        };
        if (route.type == route_types_1.RouteType.Custom) {
            return {
                pathPattern: route.pathPattern,
                origin: {
                    originId: `route-${route.pathPattern}`,
                    domainName: route.originDomainName,
                    customOriginConfig: httpsCustomOriginConfig
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
                    customOriginConfig: httpsCustomOriginConfig,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUm91dGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJzaXRlL1JvdXRpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLDJEQUF3RDtBQUV4RCwrQ0FBbUc7QUFDbkcsbUNBQXVEO0FBR3ZEOzs7OztHQUtHO0FBQ0gsTUFBYSxPQUFPO0lBT2hCLFlBQVksS0FBMEI7UUFDbEMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFL0IsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUU7WUFDdEUsNkJBQTZCLEVBQUUsSUFBSTtZQUNuQyxlQUFlLEVBQUUsUUFBUTtZQUN6QixlQUFlLEVBQUUsT0FBTztTQUMzQixFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUVmLE1BQU0saUJBQWlCLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLHVCQUFTLENBQUMsV0FBVyxDQUF1QixDQUFDO1FBQzFHLElBQUksaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQy9CLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxxQ0FBaUIsQ0FBQyxHQUFHLElBQUksUUFBUSxFQUFFO2dCQUM3RCxNQUFNLEVBQUUsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDcEMsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO29CQUN0QixXQUFXLEVBQUUsS0FBSyxDQUFDLFdBQVc7b0JBQzlCLElBQUksRUFBRSxLQUFLLENBQUMsV0FB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dGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSBcIkBwdWx1bWkvYXdzXCI7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5pbXBvcnQgeyBTaW5nbGVBc3NldEJ1Y2tldCB9IGZyb20gXCIuL1NpbmdsZUFzc2V0QnVja2V0XCI7XG5pbXBvcnQgeyBWaWV3ZXJSZXF1ZXN0RnVuY3Rpb24sIFZpZXdlclJlc3BvbnNlRnVuY3Rpb24gfSBmcm9tIFwiLi9jbG91ZGZyb250LWZ1bmN0aW9uXCI7XG5pbXBvcnQgeyBDb21mb3J0Um91dGUsIENvbW1vblJvdXRlUHJvcHMsIFJvdXRlLCBSb3V0ZVR5cGUsIFNpbmdsZUFzc2V0Um91dGUgfSBmcm9tIFwiLi9yb3V0ZS10eXBlc1wiO1xuaW1wb3J0IHsgZGVmYXVsdFNlY3VyaXR5SGVhZGVyc0NvbmZpZyB9IGZyb20gXCIuL3V0aWxzXCI7XG5cblxuLyoqXG4gKiBEZWZpbmVzIHRoZSByb3V0ZXMgb2YgdGhlIHdlYnNpdGUsIGkuZS4gd2hpY2ggY29udGVudCBzaG91bGQgYmUgc2VydmVkIG9uIHdoaWNoIHBhdGggcGF0dGVybiBhbmQgaG93IGl0IHNob3VsZCBiZSBjYWNoZWQuXG4gKiBcbiAqIERvZXMgbm90IGNyZWF0ZSB0aGUgQ2xvdWRGcm9udCBkaXN0cmlidXRpb24gaXRzZWxmLlxuICogVGhlcmVmb3JlLCBpdCBhbHNvIGRvZXMgbm90IHNldCB1cCByZWFkL2ludm9rZSBwZXJtaXNzaW9ucyBmb3IgdGhlIG9yaWdpbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBSb3V0aW5nIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHByb3BzOiBXZWJzaXRlUm91dGluZ1Byb3BzO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgczNPcmlnaW5BY2Nlc3NDb250cm9sOiBhd3MuY2xvdWRmcm9udC5PcmlnaW5BY2Nlc3NDb250cm9sO1xuICAgIHByaXZhdGUgZGVmYXVsdFJlc3BvbnNlSGVhZGVyc1BvbGljeTogYXdzLmNsb3VkZnJvbnQuUmVzcG9uc2VIZWFkZXJzUG9saWN5IHwgdW5kZWZpbmVkO1xuICAgIHB1YmxpYyBzaW5nbGVBc3NldEJ1Y2tldDogU2luZ2xlQXNzZXRCdWNrZXQgfCB1bmRlZmluZWQ7XG4gICAgcHVibGljIGVmZmVjdGl2ZVJvdXRlczogRWZmZWN0aXZlUm91dGVbXTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzOiBXZWJzaXRlUm91dGluZ1Byb3BzKSB7XG4gICAgICAgIHRoaXMucHJvcHMgPSBwcm9wcztcbiAgICAgICAgY29uc3QgeyBuYW1lLCBwYXJlbnQgfSA9IHByb3BzO1xuXG4gICAgICAgIHRoaXMuczNPcmlnaW5BY2Nlc3NDb250cm9sID0gbmV3IGF3cy5jbG91ZGZyb250Lk9yaWdpbkFjY2Vzc0NvbnRyb2wobmFtZSwge1xuICAgICAgICAgICAgb3JpZ2luQWNjZXNzQ29udHJvbE9yaWdpblR5cGU6IFwiczNcIixcbiAgICAgICAgICAgIHNpZ25pbmdCZWhhdmlvcjogXCJhbHdheXNcIixcbiAgICAgICAgICAgIHNpZ25pbmdQcm90b2NvbDogXCJzaWd2NFwiLFxuICAgICAgICB9LCB7IHBhcmVudCB9KTtcblxuICAgICAgICBjb25zdCBzaW5nbGVBc3NldFJvdXRlcyA9IHByb3BzLnJvdXRlcy5maWx0ZXIociA9PiByLnR5cGUgPT0gUm91dGVUeXBlLlNpbmdsZUFzc2V0KSBhcyBTaW5nbGVBc3NldFJvdXRlW107XG4gICAgICAgIGlmIChzaW5nbGVBc3NldFJvdXRlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBzaW5nbGVBc3NldEJ1Y2tldCA9IG5ldyBTaW5nbGVBc3NldEJ1Y2tldChgJHtuYW1lfS1hc3NldGAsIHtcbiAgICAgICAgICAgICAgICBhc3NldHM6IHNpbmdsZUFzc2V0Um91dGVzLm1hcChyb3V0ZSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiByb3V0ZS5jb250ZW50LFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50VHlwZTogcm91dGUuY29udGVudFR5cGUsXG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IHJvdXRlLnBhdGhQYXR0ZXJuLFxuICAgICAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgfSwgeyBwYXJlbnQgfSk7XG4gICAgICAgICAgICB0aGlzLnNpbmdsZUFzc2V0QnVja2V0ID0gc2luZ2xlQXNzZXRCdWNrZXQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVmZmVjdGl2ZVJvdXRlcyA9IHRoaXMuY3JlYXRlUm91dGVzKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVSb3V0ZXMoKTogRWZmZWN0aXZlUm91dGVbXSB7XG4gICAgICAgIGNvbnN0IGVmZmVjdGl2ZVJvdXRlcyA9IHRoaXMucHJvcHMucm91dGVzLm1hcCgocm91dGUsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBpZiAocm91dGUudHlwZSA9PSBSb3V0ZVR5cGUuUHJpbWl0aXZlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvdXRlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVSb3V0ZShyb3V0ZSwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZWZmZWN0aXZlUm91dGVzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdCBsZWFzdCBvbmUgcm91dGUgbXVzdCBiZSBkZWZpbmVkXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGVmYXVsdFJvdXRlID0gZWZmZWN0aXZlUm91dGVzLmF0KC0xKSE7XG4gICAgICAgIGlmIChkZWZhdWx0Um91dGUucGF0aFBhdHRlcm4gIT09IFwiLypcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIGRlZmF1bHQgcm91dGUgbXVzdCB1c2UgcGF0aCBwYXR0ZXJuICcvKidcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVmZmVjdGl2ZVJvdXRlcztcbiAgICB9XG5cbiAgICBwcml2YXRlIGNyZWF0ZVJvdXRlKHJvdXRlOiBDb21mb3J0Um91dGUsIGluZGV4OiBudW1iZXIpOiBFZmZlY3RpdmVSb3V0ZSB7XG4gICAgICAgIGNvbnN0IGh0dHBzQ3VzdG9tT3JpZ2luQ29uZmlnID0ge1xuICAgICAgICAgICAgaHR0cFBvcnQ6IDgwLFxuICAgICAgICAgICAgaHR0cHNQb3J0OiA0NDMsXG4gICAgICAgICAgICBvcmlnaW5Qcm90b2NvbFBvbGljeTogXCJodHRwcy1vbmx5XCIsXG4gICAgICAgICAgICBvcmlnaW5Tc2xQcm90b2NvbHM6IFtcIlRMU3YxLjJcIl1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAocm91dGUudHlwZSA9PSBSb3V0ZVR5cGUuQ3VzdG9tKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHBhdGhQYXR0ZXJuOiByb3V0ZS5wYXRoUGF0dGVybixcbiAgICAgICAgICAgICAgICBvcmlnaW46IHtcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luSWQ6IGByb3V0ZS0ke3JvdXRlLnBhdGhQYXR0ZXJufWAsXG4gICAgICAgICAgICAgICAgICAgIGRvbWFpbk5hbWU6IHJvdXRlLm9yaWdpbkRvbWFpbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbU9yaWdpbkNvbmZpZzogaHR0cHNDdXN0b21PcmlnaW5Db25maWdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNhY2hlQmVoYXZpb3I6IHRoaXMuZ2V0Um91dGVDYWNoZUJlaGF2aW9yKHJvdXRlLCBpbmRleClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAocm91dGUudHlwZSA9PSBSb3V0ZVR5cGUuVlBDKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHBhdGhQYXR0ZXJuOiByb3V0ZS5wYXRoUGF0dGVybixcbiAgICAgICAgICAgICAgICBvcmlnaW46IHtcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luSWQ6IGByb3V0ZS0ke3JvdXRlLnBhdGhQYXR0ZXJufWAsXG4gICAgICAgICAgICAgICAgICAgIGRvbWFpbk5hbWU6IHJvdXRlLm9yaWdpbkRvbWFpbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHZwY09yaWdpbkNvbmZpZzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdnBjT3JpZ2luSWQ6IHJvdXRlLnZwY09yaWdpbklkLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY2FjaGVCZWhhdmlvcjogdGhpcy5nZXRSb3V0ZUNhY2hlQmVoYXZpb3Iocm91dGUsIGluZGV4KVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChyb3V0ZS50eXBlID09IFJvdXRlVHlwZS5MYW1iZGEpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgcGF0aFBhdHRlcm46IHJvdXRlLnBhdGhQYXR0ZXJuLFxuICAgICAgICAgICAgICAgIG9yaWdpbjoge1xuICAgICAgICAgICAgICAgICAgICBvcmlnaW5JZDogYHJvdXRlLSR7cm91dGUucGF0aFBhdHRlcm59YCxcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluTmFtZTogcm91dGUuZnVuY3Rpb25VcmwuZnVuY3Rpb25VcmwuYXBwbHkodXJsID0+IG5ldyBVUkwodXJsKS5ob3N0KSxcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tT3JpZ2luQ29uZmlnOiBodHRwc0N1c3RvbU9yaWdpbkNvbmZpZyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNhY2hlQmVoYXZpb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uKHRoaXMuZ2V0Um91dGVDYWNoZUJlaGF2aW9yKHJvdXRlLCBpbmRleCkpLFxuICAgICAgICAgICAgICAgICAgICBvcmlnaW5SZXF1ZXN0UG9saWN5SWQ6IHJvdXRlLm9yaWdpblJlcXVlc3RQb2xpY3lJZCA/PyBnZXRPcmlnaW5SZXF1ZXN0UG9saWN5SWQoJ01hbmFnZWQtQWxsVmlld2VyRXhjZXB0SG9zdEhlYWRlcicpLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAocm91dGUudHlwZSA9PSBSb3V0ZVR5cGUuUzMpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgcGF0aFBhdHRlcm46IHJvdXRlLnBhdGhQYXR0ZXJuLFxuICAgICAgICAgICAgICAgIG9yaWdpbjoge1xuICAgICAgICAgICAgICAgICAgICBvcmlnaW5JZDogYHJvdXRlLSR7cm91dGUucGF0aFBhdHRlcm59YCxcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluTmFtZTogcHVsdW1pLm91dHB1dChyb3V0ZS5zM0ZvbGRlci5idWNrZXQpLmJ1Y2tldFJlZ2lvbmFsRG9tYWluTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luQWNjZXNzQ29udHJvbElkOiB0aGlzLnMzT3JpZ2luQWNjZXNzQ29udHJvbC5pZCxcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luUGF0aDogcHVsdW1pLm91dHB1dChyb3V0ZS5zM0ZvbGRlci5wYXRoKS5hcHBseShwYXRoID0+IHBhdGggIT09ICcnID8gYC8ke3BhdGh9YCA6IHVuZGVmaW5lZCkgYXMgYW55LCAvLyBvcmlnaW5QYXRoIHR5cGUgaXMgZGVjbGFyZWQgaW5jb3JyZWN0bHlcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNhY2hlQmVoYXZpb3I6IHRoaXMuZ2V0Um91dGVDYWNoZUJlaGF2aW9yKHJvdXRlLCBpbmRleClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAocm91dGUudHlwZSA9PSBSb3V0ZVR5cGUuU2luZ2xlQXNzZXQpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgcGF0aFBhdHRlcm46IHJvdXRlLnBhdGhQYXR0ZXJuLFxuICAgICAgICAgICAgICAgIG9yaWdpbjoge1xuICAgICAgICAgICAgICAgICAgICBvcmlnaW5JZDogYHJvdXRlLSR7cm91dGUucGF0aFBhdHRlcm59YCxcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluTmFtZTogdGhpcy5zaW5nbGVBc3NldEJ1Y2tldCEuZ2V0QnVja2V0KCkuYnVja2V0UmVnaW9uYWxEb21haW5OYW1lLFxuICAgICAgICAgICAgICAgICAgICBvcmlnaW5BY2Nlc3NDb250cm9sSWQ6IHRoaXMuczNPcmlnaW5BY2Nlc3NDb250cm9sLmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY2FjaGVCZWhhdmlvcjogdGhpcy5nZXRSb3V0ZUNhY2hlQmVoYXZpb3Iocm91dGUsIGluZGV4KVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgcm91dGUgJHtyb3V0ZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0Um91dGVDYWNoZUJlaGF2aW9yKHJvdXRlOiBDb21tb25Sb3V0ZVByb3BzLCBpbmRleDogbnVtYmVyKTogYXdzLnR5cGVzLmlucHV0LmNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uRGVmYXVsdENhY2hlQmVoYXZpb3Ige1xuICAgICAgICBjb25zdCBkZWZhdWx0Vmlld2VyUmVxdWVzdEZ1bmMgPSB0aGlzLnByb3BzLmdldERlZmF1bHRWaWV3ZXJSZXF1ZXN0RnVuY3Rpb24ocm91dGUsIGluZGV4KTtcbiAgICAgICAgY29uc3Qgdmlld2VyUmVxdWVzdEZ1bmNBcm4gPSByb3V0ZS5nZXRWaWV3ZXJSZXF1ZXN0RnVuY3Rpb25Bcm4gPyByb3V0ZS5nZXRWaWV3ZXJSZXF1ZXN0RnVuY3Rpb25Bcm4oZGVmYXVsdFZpZXdlclJlcXVlc3RGdW5jKSA6IGRlZmF1bHRWaWV3ZXJSZXF1ZXN0RnVuYy5jcmVhdGVPclVuZGVmaW5lZCgpPy5hcm47XG5cbiAgICAgICAgY29uc3QgZGVmYXVsdFZpZXdlclJlc3BvbnNlRnVuYyA9IHRoaXMucHJvcHMuZ2V0RGVmYXVsdFZpZXdlclJlc3BvbnNlRnVuY3Rpb24ocm91dGUsIGluZGV4KTtcbiAgICAgICAgY29uc3Qgdmlld2VyUmVzcG9uc2VGdW5jQXJuID0gcm91dGUuZ2V0Vmlld2VyUmVzcG9uc2VGdW5jdGlvbkFybiA/IHJvdXRlLmdldFZpZXdlclJlc3BvbnNlRnVuY3Rpb25Bcm4oZGVmYXVsdFZpZXdlclJlc3BvbnNlRnVuYykgOiBkZWZhdWx0Vmlld2VyUmVzcG9uc2VGdW5jLmNyZWF0ZU9yVW5kZWZpbmVkKCk/LmFybjtcblxuICAgICAgICBjb25zdCBpc1MzT3JpZ2luID0gcm91dGUudHlwZSA9PSBSb3V0ZVR5cGUuUzMgfHwgcm91dGUudHlwZSA9PSBSb3V0ZVR5cGUuU2luZ2xlQXNzZXQ7XG4gICAgICAgIGNvbnN0IGFsbG93ZWRNZXRob2RzID0gaXNTM09yaWdpbiA/IFtcIkhFQURcIiwgXCJHRVRcIl0gOiBbXCJIRUFEXCIsIFwiREVMRVRFXCIsIFwiUE9TVFwiLCBcIkdFVFwiLCBcIk9QVElPTlNcIiwgXCJQVVRcIiwgXCJQQVRDSFwiXTtcblxuICAgICAgICBjb25zdCBkZWZhdWx0T3JpZ2luUmVxdWVzdFBvbGljeUlkID0gaXNTM09yaWdpbiA/IHVuZGVmaW5lZCA6IGdldE9yaWdpblJlcXVlc3RQb2xpY3lJZCgnTWFuYWdlZC1BbGxWaWV3ZXInKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGFyZ2V0T3JpZ2luSWQ6IGByb3V0ZS0ke3JvdXRlLnBhdGhQYXR0ZXJufWAsXG4gICAgICAgICAgICBhbGxvd2VkTWV0aG9kcyxcbiAgICAgICAgICAgIGNhY2hlZE1ldGhvZHM6IFtcIkhFQURcIiwgXCJHRVRcIl0sXG4gICAgICAgICAgICBjYWNoZVBvbGljeUlkOiByb3V0ZS5jYWNoZVBvbGljeUlkID8/IHRoaXMucHJvcHMuZ2V0RGVmYXVsdENhY2hlUG9saWN5QXJuKHJvdXRlKSxcbiAgICAgICAgICAgIGNvbXByZXNzOiB0cnVlLFxuICAgICAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IFwicmVkaXJlY3QtdG8taHR0cHNcIixcbiAgICAgICAgICAgIG9yaWdpblJlcXVlc3RQb2xpY3lJZDogcm91dGUub3JpZ2luUmVxdWVzdFBvbGljeUlkID8/IGRlZmF1bHRPcmlnaW5SZXF1ZXN0UG9saWN5SWQsXG4gICAgICAgICAgICByZXNwb25zZUhlYWRlcnNQb2xpY3lJZDogdGhpcy5nZXREZWZhdWx0UmVzcG9uc2VIZWFkZXJzUG9saWN5KCkuaWQsXG4gICAgICAgICAgICBmdW5jdGlvbkFzc29jaWF0aW9uczogZ2V0RnVuY3Rpb25Bc3NvY2lhdGlvbnModmlld2VyUmVxdWVzdEZ1bmNBcm4sIHZpZXdlclJlc3BvbnNlRnVuY0FybiksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXREZWZhdWx0UmVzcG9uc2VIZWFkZXJzUG9saWN5KCk6IGF3cy5jbG91ZGZyb250LlJlc3BvbnNlSGVhZGVyc1BvbGljeSB7XG4gICAgICAgIGlmICh0aGlzLmRlZmF1bHRSZXNwb25zZUhlYWRlcnNQb2xpY3kpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRlZmF1bHRSZXNwb25zZUhlYWRlcnNQb2xpY3k7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0UmVzcG9uc2VIZWFkZXJzUG9saWN5ID0gbmV3IGF3cy5jbG91ZGZyb250LlJlc3BvbnNlSGVhZGVyc1BvbGljeShgJHt0aGlzLnByb3BzLm5hbWV9LWRlZmF1bHRgLCB7XG4gICAgICAgICAgICAgICAgc2VjdXJpdHlIZWFkZXJzQ29uZmlnOiBkZWZhdWx0U2VjdXJpdHlIZWFkZXJzQ29uZmlnLFxuICAgICAgICAgICAgICAgIGN1c3RvbUhlYWRlcnNDb25maWc6IHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXI6IFwiY2FjaGUtY29udHJvbFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IFwibm8tY2FjaGVcIiwgLy8gcmVzcG9uc2UgY2FuIGJlIHN0b3JlZCBpbiBicm93c2VyIGNhY2hlLCBidXQgbXVzdCBiZSB2YWxpZGF0ZWQgd2l0aCB0aGUgc2VydmVyIGJlZm9yZSBlYWNoIHJlLXVzZVxuICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcGFyZW50OiB0aGlzLnByb3BzLnBhcmVudCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5kZWZhdWx0UmVzcG9uc2VIZWFkZXJzUG9saWN5ID0gZGVmYXVsdFJlc3BvbnNlSGVhZGVyc1BvbGljeTtcbiAgICAgICAgICAgIHJldHVybiBkZWZhdWx0UmVzcG9uc2VIZWFkZXJzUG9saWN5O1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFdlYnNpdGVSb3V0aW5nUHJvcHMge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBwYXJlbnQ6IHB1bHVtaS5SZXNvdXJjZTtcbiAgICByZWFkb25seSByb3V0ZXM6IFJvdXRlW107XG5cbiAgICByZWFkb25seSBnZXREZWZhdWx0Q2FjaGVQb2xpY3lBcm46IChyb3V0ZTogQ29tbW9uUm91dGVQcm9wcykgPT4gcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgcmVhZG9ubHkgZ2V0RGVmYXVsdFZpZXdlclJlcXVlc3RGdW5jdGlvbjogKHJvdXRlOiBDb21tb25Sb3V0ZVByb3BzLCBpbmRleDogbnVtYmVyKSA9PiBWaWV3ZXJSZXF1ZXN0RnVuY3Rpb247XG4gICAgcmVhZG9ubHkgZ2V0RGVmYXVsdFZpZXdlclJlc3BvbnNlRnVuY3Rpb246IChyb3V0ZTogQ29tbW9uUm91dGVQcm9wcywgaW5kZXg6IG51bWJlcikgPT4gVmlld2VyUmVzcG9uc2VGdW5jdGlvbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFZmZlY3RpdmVSb3V0ZSB7XG4gICAgcGF0aFBhdHRlcm46IHN0cmluZztcbiAgICBvcmlnaW46IGF3cy50eXBlcy5pbnB1dC5jbG91ZGZyb250LkRpc3RyaWJ1dGlvbk9yaWdpbjtcbiAgICBjYWNoZUJlaGF2aW9yOiBhd3MudHlwZXMuaW5wdXQuY2xvdWRmcm9udC5EaXN0cmlidXRpb25EZWZhdWx0Q2FjaGVCZWhhdmlvcjtcbn1cblxuZnVuY3Rpb24gZ2V0RnVuY3Rpb25Bc3NvY2lhdGlvbnModmlld2VyUmVxdWVzdEZ1bmNBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+IHwgdW5kZWZpbmVkLCB2aWV3ZXJSZXNwb25zZUZ1bmNBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+IHwgdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgYXNzb2NpYXRpb25zID0gW107XG5cbiAgICBpZiAodmlld2VyUmVxdWVzdEZ1bmNBcm4gIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFzc29jaWF0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgIGV2ZW50VHlwZTogYHZpZXdlci1yZXF1ZXN0YCxcbiAgICAgICAgICAgIGZ1bmN0aW9uQXJuOiB2aWV3ZXJSZXF1ZXN0RnVuY0FybixcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHZpZXdlclJlc3BvbnNlRnVuY0FybiAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXNzb2NpYXRpb25zLnB1c2goe1xuICAgICAgICAgICAgZXZlbnRUeXBlOiBgdmlld2VyLXJlc3BvbnNlYCxcbiAgICAgICAgICAgIGZ1bmN0aW9uQXJuOiB2aWV3ZXJSZXNwb25zZUZ1bmNBcm4sXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBhc3NvY2lhdGlvbnMubGVuZ3RoID4gMCA/IGFzc29jaWF0aW9ucyA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gZ2V0T3JpZ2luUmVxdWVzdFBvbGljeUlkKG5hbWU6IHN0cmluZyk6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGF3cy5jbG91ZGZyb250LmdldE9yaWdpblJlcXVlc3RQb2xpY3lPdXRwdXQoeyBuYW1lIH0pLmFwcGx5KHBvbGljeSA9PiBwb2xpY3kuaWQhISk7XG59XG4iXX0=