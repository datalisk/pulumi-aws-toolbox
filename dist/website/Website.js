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
exports.Website = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const cert_1 = require("./cert");
const cloudfront_function_1 = require("./cloudfront-function");
const CloudfrontLogBucket_1 = require("./CloudfrontLogBucket");
const route_types_1 = require("./route-types");
const Routing_1 = require("./Routing");
const utils_1 = require("./utils");
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
class Website extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super("pat:website:Website", name, {}, opts);
        const { hostedZone } = args;
        this.domain = args.subDomain ? pulumi.interpolate `${args.subDomain}.${hostedZone.name}` : hostedZone.name;
        const certificate = (0, cert_1.createCertificate)({
            name,
            domain: this.domain,
            hostedZone,
            subjectAlternativeNames: [],
            region: "us-east-1",
        });
        const logBucket = new CloudfrontLogBucket_1.CloudfrontLogBucket(`${name}-log`, {}, { parent: this });
        const routing = new Routing_1.Routing({
            name,
            parent: this,
            routes: args.routes,
            getDefaultCachePolicyArn: () => {
                return getDisabledCachePolicy();
            },
            getDefaultViewerRequestFunction: (route, index) => {
                const fn = new cloudfront_function_1.ViewerRequestFunction(`${name}-route-${index}`, this);
                if (args.basicAuth) {
                    fn.withBasicAuth(args.basicAuth.username, args.basicAuth.password);
                }
                if (route.type == route_types_1.RouteType.S3) {
                    fn.rewriteWebpagePath(args.trailingSlash == true ? 'SUB_DIR' : 'FILE');
                }
                return fn;
            },
            getDefaultViewerResponseFunction: (_, index) => {
                return new cloudfront_function_1.ViewerResponseFunction(`${name}-route-${index}`, this);
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
            defaultCacheBehavior: routing.effectiveRoutes.at(-1).cacheBehavior,
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
        args.routes.filter(r => r.type == route_types_1.RouteType.S3).forEach(route => {
            if (route.s3Folder.addBucketPolicyStatement) {
                const statement = (0, utils_1.createBucketPolicyStatement)(route.s3Folder.bucket.arn, this.distribution.arn, pulumi.interpolate `${route.s3Folder.path}/*`);
                route.s3Folder.addBucketPolicyStatement(statement);
            }
        });
        // grant ourselves access to relevant lambda function URLs
        args.routes.filter(r => r.type == route_types_1.RouteType.Lambda).forEach(route => {
            new aws.lambda.Permission(`${name}-${route.pathPattern}`, {
                statementId: pulumi.interpolate `cloudfront-${this.distribution.id}`,
                action: "lambda:InvokeFunctionUrl",
                principal: "cloudfront.amazonaws.com",
                sourceArn: this.distribution.arn,
                function: route.functionUrl.functionName,
            }, { parent: this });
        });
        if (routing.singleAssetBucket) {
            routing.singleAssetBucket.setupAccessPolicy(this.distribution.arn);
        }
        (0, utils_1.createCloudfrontDnsRecords)(name, this.distribution, hostedZone.id, args.subDomain, {
            parent: this,
            aliases: [{ parent: pulumi.rootStackResource }], // if there was a existing resource with the same name, use it
        });
        this.distributionArn = this.distribution.arn;
    }
}
exports.Website = Website;
function getDisabledCachePolicy() {
    return aws.cloudfront.getCachePolicyOutput({ name: "Managed-CachingDisabled" }).apply(policy => policy.id);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2Vic2l0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJzaXRlL1dlYnNpdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFFbkMsdURBQXlDO0FBQ3pDLGlDQUEyQztBQUMzQywrREFBc0Y7QUFDdEYsK0RBQTREO0FBQzVELCtDQUFtRTtBQUNuRSx1Q0FBb0M7QUFDcEMsbUNBQWtGO0FBR2xGOzs7Ozs7Ozs7R0FTRztBQUNILE1BQWEsT0FBUSxTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFNakQsWUFBWSxJQUFZLEVBQUUsSUFBaUIsRUFBRSxJQUFzQztRQUMvRSxLQUFLLENBQUMscUJBQXFCLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU3QyxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBRTVCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQSxHQUFHLElBQUksQ0FBQyxTQUFTLElBQUksVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO1FBRTFHLE1BQU0sV0FBVyxHQUFHLElBQUEsd0JBQWlCLEVBQUM7WUFDbEMsSUFBSTtZQUNKLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtZQUNuQixVQUFVO1lBQ1YsdUJBQXVCLEVBQUUsRUFBRTtZQUMzQixNQUFNLEVBQUUsV0FBVztTQUN0QixDQUFDLENBQUM7UUFFSCxNQUFNLFNBQVMsR0FBRyxJQUFJLHlDQUFtQixDQUFDLEdBQUcsSUFBSSxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFFL0UsTUFBTSxPQUFPLEdBQUcsSUFBSSxpQkFBTyxDQUFDO1lBQ3hCLElBQUk7WUFD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QyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDekIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzVCLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFFRCxJQUFBLGtDQUEwQixFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUMvRSxNQUFNLEVBQUUsSUFBSTtZQUNaLE9BQU8sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLEVBQUUsOERBQThEO1NBQ2xILENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUM7SUFDakQsQ0FBQztDQUNKO0FBckhELDBCQXFIQztBQTJDRCxTQUFTLHNCQUFzQjtJQUMzQixPQUFPLEdBQUcsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsRUFBRSxJQUFJLEVBQUUseUJBQXlCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFJLENBQUMsQ0FBQztBQUNqSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXdzIGZyb20gXCJAcHVsdW1pL2F3c1wiO1xuaW1wb3J0IHsgWm9uZSB9IGZyb20gXCJAcHVsdW1pL2F3cy9yb3V0ZTUzXCI7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5pbXBvcnQgeyBjcmVhdGVDZXJ0aWZpY2F0ZSB9IGZyb20gXCIuL2NlcnRcIjtcbmltcG9ydCB7IFZpZXdlclJlcXVlc3RGdW5jdGlvbiwgVmlld2VyUmVzcG9uc2VGdW5jdGlvbiB9IGZyb20gXCIuL2Nsb3VkZnJvbnQtZnVuY3Rpb25cIjtcbmltcG9ydCB7IENsb3VkZnJvbnRMb2dCdWNrZXQgfSBmcm9tIFwiLi9DbG91ZGZyb250TG9nQnVja2V0XCI7XG5pbXBvcnQgeyBDb21tb25Sb3V0ZVByb3BzLCBSb3V0ZSwgUm91dGVUeXBlIH0gZnJvbSBcIi4vcm91dGUtdHlwZXNcIjtcbmltcG9ydCB7IFJvdXRpbmcgfSBmcm9tIFwiLi9Sb3V0aW5nXCI7XG5pbXBvcnQgeyBjcmVhdGVCdWNrZXRQb2xpY3lTdGF0ZW1lbnQsIGNyZWF0ZUNsb3VkZnJvbnREbnNSZWNvcmRzIH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuXG4vKipcbiAqIE9waW5pb25hdGVkIGNvbXBvbmVudCBmb3IgaG9zdGluZyBhIHdlYnNpdGUuXG4gKiBcbiAqIFNwZWNpYWwgYmVoYXZpb3I6XG4gKiAtIEF1dG9tYXRpY2FsbHkgcmVxdWVzdHMgcmVhZCBhY2Nlc3MgdG8gUzMgYnVja2V0cy4gSWYgeW91J3JlIHVzaW5nIFMzQXJ0aWZhY3RTdG9yZSwgeW91IHN0aWxsIG5lZWQgdG8gY2FsbCBpdHMgY3JlYXRlQnVja2V0UG9saWN5IG1ldGhvZC5cbiAqIC0gUzMgcm91dGVzOiBBdXRvbWF0aWNhbGx5IGhhbmRsZXMgVVJMIHJld3JpdGVzLCBzbyB0aGF0IHdoZW4gdGhlIHVzZXIgbG9hZHMgL3Byb2R1Y3QsIGl0IHdpbGwgaW50ZXJuYWxseSBsb2FkIC9wcm9kdWN0L2luZGV4Lmh0bWwgZnJvbSBTMy5cbiAqIC0gQ3JlYXRlcyBhIGNlcnRpZmljYXRlIGZvciB0aGUgZG9tYWluIGluIHVzLWVhc3QtMS5cbiAqIFxuICogQWxzbyBzZWUgdGhlIFJFQURNRS5tZCBmb3IgYWRkaXRpb25hbCBkb2N1bWVudGF0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgV2Vic2l0ZSBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcmVhZG9ubHkgZG9tYWluOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcmVhZG9ubHkgZGlzdHJpYnV0aW9uQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgICBwcml2YXRlIGRpc3RyaWJ1dGlvbjogYXdzLmNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBXZWJzaXRlQXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJwYXQ6d2Vic2l0ZTpXZWJzaXRlXCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICBjb25zdCB7IGhvc3RlZFpvbmUgfSA9IGFyZ3M7XG5cbiAgICAgICAgdGhpcy5kb21haW4gPSBhcmdzLnN1YkRvbWFpbiA/IHB1bHVtaS5pbnRlcnBvbGF0ZWAke2FyZ3Muc3ViRG9tYWlufS4ke2hvc3RlZFpvbmUubmFtZX1gIDogaG9zdGVkWm9uZS5uYW1lO1xuXG4gICAgICAgIGNvbnN0IGNlcnRpZmljYXRlID0gY3JlYXRlQ2VydGlmaWNhdGUoe1xuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIGRvbWFpbjogdGhpcy5kb21haW4sXG4gICAgICAgICAgICBob3N0ZWRab25lLFxuICAgICAgICAgICAgc3ViamVjdEFsdGVybmF0aXZlTmFtZXM6IFtdLFxuICAgICAgICAgICAgcmVnaW9uOiBcInVzLWVhc3QtMVwiLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBsb2dCdWNrZXQgPSBuZXcgQ2xvdWRmcm9udExvZ0J1Y2tldChgJHtuYW1lfS1sb2dgLCB7fSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgY29uc3Qgcm91dGluZyA9IG5ldyBSb3V0aW5nKHtcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgICByb3V0ZXM6IGFyZ3Mucm91dGVzLFxuICAgICAgICAgICAgZ2V0RGVmYXVsdENhY2hlUG9saWN5QXJuOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldERpc2FibGVkQ2FjaGVQb2xpY3koKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXREZWZhdWx0Vmlld2VyUmVxdWVzdEZ1bmN0aW9uOiAocm91dGU6IENvbW1vblJvdXRlUHJvcHMsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmbiA9IG5ldyBWaWV3ZXJSZXF1ZXN0RnVuY3Rpb24oYCR7bmFtZX0tcm91dGUtJHtpbmRleH1gLCB0aGlzKTtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5iYXNpY0F1dGgpIHtcbiAgICAgICAgICAgICAgICAgICAgZm4ud2l0aEJhc2ljQXV0aChhcmdzLmJhc2ljQXV0aC51c2VybmFtZSwgYXJncy5iYXNpY0F1dGgucGFzc3dvcmQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyb3V0ZS50eXBlID09IFJvdXRlVHlwZS5TMykge1xuICAgICAgICAgICAgICAgICAgICBmbi5yZXdyaXRlV2VicGFnZVBhdGgoYXJncy50cmFpbGluZ1NsYXNoID09IHRydWUgPyAnU1VCX0RJUicgOiAnRklMRScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZm47XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0RGVmYXVsdFZpZXdlclJlc3BvbnNlRnVuY3Rpb246IChfOiBDb21tb25Sb3V0ZVByb3BzLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBWaWV3ZXJSZXNwb25zZUZ1bmN0aW9uKGAke25hbWV9LXJvdXRlLSR7aW5kZXh9YCwgdGhpcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmRpc3RyaWJ1dGlvbiA9IG5ldyBhd3MuY2xvdWRmcm9udC5EaXN0cmlidXRpb24obmFtZSwge1xuICAgICAgICAgICAgb3JpZ2luczogcm91dGluZy5lZmZlY3RpdmVSb3V0ZXMubWFwKHJvdXRlID0+IHJvdXRlLm9yaWdpbiksXG4gICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgaXNJcHY2RW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIGh0dHBWZXJzaW9uOiBcImh0dHAyYW5kM1wiLFxuICAgICAgICAgICAgY29tbWVudDogYCR7bmFtZX1gLFxuICAgICAgICAgICAgYWxpYXNlczogW3RoaXMuZG9tYWluXSxcbiAgICAgICAgICAgIG9yZGVyZWRDYWNoZUJlaGF2aW9yczogcm91dGluZy5lZmZlY3RpdmVSb3V0ZXMuc2xpY2UoMCwgLTEpLm1hcChyb3V0ZSA9PiAoe1xuICAgICAgICAgICAgICAgIHBhdGhQYXR0ZXJuOiByb3V0ZS5wYXRoUGF0dGVybixcbiAgICAgICAgICAgICAgICAuLi4ocm91dGUuY2FjaGVCZWhhdmlvciksXG4gICAgICAgICAgICB9KSksXG4gICAgICAgICAgICBkZWZhdWx0Q2FjaGVCZWhhdmlvcjogcm91dGluZy5lZmZlY3RpdmVSb3V0ZXMuYXQoLTEpIS5jYWNoZUJlaGF2aW9yLFxuICAgICAgICAgICAgcHJpY2VDbGFzczogXCJQcmljZUNsYXNzXzEwMFwiLFxuICAgICAgICAgICAgcmVzdHJpY3Rpb25zOiB7XG4gICAgICAgICAgICAgICAgZ2VvUmVzdHJpY3Rpb246IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdHJpY3Rpb25UeXBlOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25zOiBbXSwgLy8gd29ya2Fyb3VuZCBmb3IgQ2xvdWRGcm9udCBpc3N1ZSB3aGVuIHByZXZpb3VzbHkgbG9jYXRpb25zIHdlcmUgY29uZmlndXJlZFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmlld2VyQ2VydGlmaWNhdGU6IHtcbiAgICAgICAgICAgICAgICBhY21DZXJ0aWZpY2F0ZUFybjogY2VydGlmaWNhdGUuY2VydGlmaWNhdGVBcm4sXG4gICAgICAgICAgICAgICAgbWluaW11bVByb3RvY29sVmVyc2lvbjogXCJUTFN2MS4yXzIwMjFcIixcbiAgICAgICAgICAgICAgICBzc2xTdXBwb3J0TWV0aG9kOiBcInNuaS1vbmx5XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjdXN0b21FcnJvclJlc3BvbnNlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDb2RlOiA0MDQsXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlQ29kZTogNDA0LFxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiBcIi80MDQuaHRtbFwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgbG9nZ2luZ0NvbmZpZzoge1xuICAgICAgICAgICAgICAgIGJ1Y2tldDogbG9nQnVja2V0LmJ1Y2tldFJlZ2lvbmFsRG9tYWluTmFtZSxcbiAgICAgICAgICAgICAgICBpbmNsdWRlQ29va2llczogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB3ZWJBY2xJZDogYXJncy53ZWJBY2xJZCxcbiAgICAgICAgICAgIHdhaXRGb3JEZXBsb3ltZW50OiBmYWxzZSxcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcGFyZW50OiB0aGlzLFxuICAgICAgICAgICAgZGVsZXRlQmVmb3JlUmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gcmVxdWVzdCByZWFkIGFjY2VzcyB0byBTM1xuICAgICAgICBhcmdzLnJvdXRlcy5maWx0ZXIociA9PiByLnR5cGUgPT0gUm91dGVUeXBlLlMzKS5mb3JFYWNoKHJvdXRlID0+IHtcbiAgICAgICAgICAgIGlmIChyb3V0ZS5zM0ZvbGRlci5hZGRCdWNrZXRQb2xpY3lTdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGF0ZW1lbnQgPSBjcmVhdGVCdWNrZXRQb2xpY3lTdGF0ZW1lbnQocm91dGUuczNGb2xkZXIuYnVja2V0LmFybiwgdGhpcy5kaXN0cmlidXRpb24uYXJuLCBwdWx1bWkuaW50ZXJwb2xhdGVgJHtyb3V0ZS5zM0ZvbGRlci5wYXRofS8qYCk7XG4gICAgICAgICAgICAgICAgcm91dGUuczNGb2xkZXIuYWRkQnVja2V0UG9saWN5U3RhdGVtZW50KHN0YXRlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGdyYW50IG91cnNlbHZlcyBhY2Nlc3MgdG8gcmVsZXZhbnQgbGFtYmRhIGZ1bmN0aW9uIFVSTHNcbiAgICAgICAgYXJncy5yb3V0ZXMuZmlsdGVyKHIgPT4gci50eXBlID09IFJvdXRlVHlwZS5MYW1iZGEpLmZvckVhY2gocm91dGUgPT4ge1xuICAgICAgICAgICAgbmV3IGF3cy5sYW1iZGEuUGVybWlzc2lvbihgJHtuYW1lfS0ke3JvdXRlLnBhdGhQYXR0ZXJufWAsIHtcbiAgICAgICAgICAgICAgICBzdGF0ZW1lbnRJZDogcHVsdW1pLmludGVycG9sYXRlYGNsb3VkZnJvbnQtJHt0aGlzLmRpc3RyaWJ1dGlvbi5pZH1gLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogXCJsYW1iZGE6SW52b2tlRnVuY3Rpb25VcmxcIixcbiAgICAgICAgICAgICAgICBwcmluY2lwYWw6IFwiY2xvdWRmcm9udC5hbWF6b25hd3MuY29tXCIsXG4gICAgICAgICAgICAgICAgc291cmNlQXJuOiB0aGlzLmRpc3RyaWJ1dGlvbi5hcm4sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb246IHJvdXRlLmZ1bmN0aW9uVXJsLmZ1bmN0aW9uTmFtZSxcbiAgICAgICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocm91dGluZy5zaW5nbGVBc3NldEJ1Y2tldCkge1xuICAgICAgICAgICAgcm91dGluZy5zaW5nbGVBc3NldEJ1Y2tldC5zZXR1cEFjY2Vzc1BvbGljeSh0aGlzLmRpc3RyaWJ1dGlvbi5hcm4pO1xuICAgICAgICB9XG5cbiAgICAgICAgY3JlYXRlQ2xvdWRmcm9udERuc1JlY29yZHMobmFtZSwgdGhpcy5kaXN0cmlidXRpb24sIGhvc3RlZFpvbmUuaWQsIGFyZ3Muc3ViRG9tYWluLCB7XG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgICBhbGlhc2VzOiBbeyBwYXJlbnQ6IHB1bHVtaS5yb290U3RhY2tSZXNvdXJjZSB9XSwgLy8gaWYgdGhlcmUgd2FzIGEgZXhpc3RpbmcgcmVzb3VyY2Ugd2l0aCB0aGUgc2FtZSBuYW1lLCB1c2UgaXRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5kaXN0cmlidXRpb25Bcm4gPSB0aGlzLmRpc3RyaWJ1dGlvbi5hcm47XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFdlYnNpdGVBcmdzIHtcbiAgICAvKipcbiAgICAgKiBPcHRpb25hbGx5LCBwcm90ZWN0cyB0aGUgd2Vic2l0ZSB3aXRoIEhUVFAgYmFzaWMgYXV0aC5cbiAgICAgKi9cbiAgICByZWFkb25seSBiYXNpY0F1dGg/OiBCYXNpY0F1dGhBcmdzO1xuXG4gICAgcmVhZG9ubHkgaG9zdGVkWm9uZTogWm9uZTtcblxuICAgIC8qKlxuICAgICAqIFNwZWNpZmllcyB0aGUgcm91dGVzIHRvIGJlIHNlcnZlZC5cbiAgICAgKiBUaGUgZmlyc3Qgcm91dGUgdG8gbWF0Y2ggYSByZXF1ZXN0ZWQgcGF0aCB3aW5zLlxuICAgICAqIFRoZSBsYXN0IHJvdXRlIG11c3QgdXNlIHBhdGggcGF0dGVybiBcIi8qXCIsIGFuZCBpcyB0aGUgZGVmYXVsdCByb3V0ZS5cbiAgICAgKiBcbiAgICAgKiBJbnRlcm5hbGx5LCB0aGlzIGdldHMgdHJhbnNsYXRlZCBpbnRvIENsb3VkRnJvbnQgb3JpZ2lucyBhbmQgY2FjaGUgYmVoYXZpb3JzLlxuICAgICAqL1xuICAgIHJlYWRvbmx5IHJvdXRlczogUm91dGVbXTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBzdWJkb21haW4gd2l0aGluIHRoZSBob3N0ZWQgem9uZSBvciBudWxsIGlmIHRoZSB6b25lIGFwZXggc2hvdWxkIGJlIHVzZWQuXG4gICAgICovXG4gICAgcmVhZG9ubHkgc3ViRG9tYWluPzogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogSWYgJ3RyYWlsaW5nU2xhc2gnIGlzIGZhbHNlICh0aGUgZGVmYXVsdCksIHRyYWlsaW5nIHNsYXNoZXMgYXJlIG5vdCB1c2VkLlxuICAgICAqIFdoZW4gdGhlIHVzZXIgbG9hZHMgL2Fib3V0LCBpdCB3aWxsIGludGVybmFsbHkgbG9hZCAvYWJvdXQuaHRtbCBmcm9tIFMzLlxuICAgICAqIFdoZW4gL2Fib3V0LyBpcyByZXF1ZXN0ZWQgaXQgd2lsbCByZXN1bHQgaW4gYSByZWRpcmVjdCB0byBhIFVSTCB3aXRob3V0IHRoZSB0cmFpbGluZyBzbGFzaC5cbiAgICAgKiBcbiAgICAgKiBJZiAndHJhaWxpbmdTbGFzaCcgaXMgdHJ1ZSwgd2UgYXBwZW5kIC9pbmRleC5odG1sIHRvIHJlcXVlc3RzIHRoYXQgZW5kIHdpdGggYSBzbGFzaCBvciBkb27igJl0IGluY2x1ZGUgYSBmaWxlIGV4dGVuc2lvbiBpbiB0aGUgVVJMLlxuICAgICAqIFxuICAgICAqIEFwcGxpZXMgb25seSB0byBTMyByb3V0ZXMuXG4gICAgICovXG4gICAgcmVhZG9ubHkgdHJhaWxpbmdTbGFzaD86IGJvb2xlYW47XG5cbiAgICByZWFkb25seSB3ZWJBY2xJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJhc2ljQXV0aEFyZ3Mge1xuICAgIHJlYWRvbmx5IHVzZXJuYW1lOiBzdHJpbmc7XG4gICAgcmVhZG9ubHkgcGFzc3dvcmQ6IHN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2V0RGlzYWJsZWRDYWNoZVBvbGljeSgpOiBwdWx1bWkuT3V0cHV0PHN0cmluZz4ge1xuICAgIHJldHVybiBhd3MuY2xvdWRmcm9udC5nZXRDYWNoZVBvbGljeU91dHB1dCh7IG5hbWU6IFwiTWFuYWdlZC1DYWNoaW5nRGlzYWJsZWRcIiB9KS5hcHBseShwb2xpY3kgPT4gcG9saWN5LmlkISEpO1xufVxuIl19