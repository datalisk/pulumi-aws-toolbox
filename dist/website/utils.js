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
exports.defaultSecurityHeadersConfig = void 0;
exports.createCloudfrontDnsRecords = createCloudfrontDnsRecords;
exports.createBucketPolicyStatement = createBucketPolicyStatement;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
function createCloudfrontDnsRecords(name, distribution, zoneId, subDomain, opts) {
    const cloudfrontZoneId = "Z2FDTNDATAQYW2";
    new aws.route53.Record(`${name}-a`, {
        zoneId,
        name: subDomain || "",
        type: "A",
        aliases: [{
                zoneId: cloudfrontZoneId,
                name: distribution.domainName,
                evaluateTargetHealth: false
            }]
    }, { ...opts, deleteBeforeReplace: true });
    new aws.route53.Record(`${name}-aaaa`, {
        zoneId,
        name: subDomain || "",
        type: "AAAA",
        aliases: [{
                zoneId: cloudfrontZoneId,
                name: distribution.domainName,
                evaluateTargetHealth: false
            }]
    }, { ...opts, deleteBeforeReplace: true });
}
exports.defaultSecurityHeadersConfig = {
    strictTransportSecurity: {
        accessControlMaxAgeSec: 31536000, // 1 year
        includeSubdomains: true,
        preload: true,
        override: true,
    },
    contentTypeOptions: {
        override: true,
    },
    referrerPolicy: {
        referrerPolicy: 'strict-origin-when-cross-origin',
        override: false,
    },
};
/**
 * Returns a policy statement to grant CloudFront read access to the given bucket path.
 * @param pathPattern e.g. '*' or 'content/*'
 */
function createBucketPolicyStatement(bucketArn, distributionArn, pathPattern) {
    return {
        Effect: "Allow",
        Principal: {
            Service: "cloudfront.amazonaws.com"
        },
        Action: ["s3:ListBucket", "s3:GetObject"],
        Resource: [
            bucketArn,
            pulumi.interpolate `${bucketArn}/${pathPattern}`
        ],
        Condition: {
            StringEquals: {
                "AWS:SourceArn": distributionArn
            }
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvd2Vic2l0ZS91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdBLGdFQXdCQztBQXNCRCxrRUFpQkM7QUFsRUQsaURBQW1DO0FBQ25DLHVEQUF5QztBQUV6QyxTQUFnQiwwQkFBMEIsQ0FBQyxJQUFZLEVBQUUsWUFBeUMsRUFBRSxNQUE0QixFQUFFLFNBQWdDLEVBQUUsSUFBc0M7SUFDdE0sTUFBTSxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztJQUUxQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxJQUFJLEVBQUU7UUFDaEMsTUFBTTtRQUNOLElBQUksRUFBRSxTQUFTLElBQUksRUFBRTtRQUNyQixJQUFJLEVBQUUsR0FBRztRQUNULE9BQU8sRUFBRSxDQUFDO2dCQUNOLE1BQU0sRUFBRSxnQkFBZ0I7Z0JBQ3hCLElBQUksRUFBRSxZQUFZLENBQUMsVUFBVTtnQkFDN0Isb0JBQW9CLEVBQUUsS0FBSzthQUM5QixDQUFDO0tBQ0wsRUFBRSxFQUFFLEdBQUcsSUFBSSxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFFM0MsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksT0FBTyxFQUFFO1FBQ25DLE1BQU07UUFDTixJQUFJLEVBQUUsU0FBUyxJQUFJLEVBQUU7UUFDckIsSUFBSSxFQUFFLE1BQU07UUFDWixPQUFPLEVBQUUsQ0FBQztnQkFDTixNQUFNLEVBQUUsZ0JBQWdCO2dCQUN4QixJQUFJLEVBQUUsWUFBWSxDQUFDLFVBQVU7Z0JBQzdCLG9CQUFvQixFQUFFLEtBQUs7YUFDOUIsQ0FBQztLQUNMLEVBQUUsRUFBRSxHQUFHLElBQUksRUFBRSxtQkFBbUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQy9DLENBQUM7QUFFWSxRQUFBLDRCQUE0QixHQUEwRTtJQUMvRyx1QkFBdUIsRUFBRTtRQUNyQixzQkFBc0IsRUFBRSxRQUFRLEVBQUUsU0FBUztRQUMzQyxpQkFBaUIsRUFBRSxJQUFJO1FBQ3ZCLE9BQU8sRUFBRSxJQUFJO1FBQ2IsUUFBUSxFQUFFLElBQUk7S0FDakI7SUFDRCxrQkFBa0IsRUFBRTtRQUNoQixRQUFRLEVBQUUsSUFBSTtLQUNqQjtJQUNELGNBQWMsRUFBRTtRQUNaLGNBQWMsRUFBRSxpQ0FBaUM7UUFDakQsUUFBUSxFQUFFLEtBQUs7S0FDbEI7Q0FDSixDQUFDO0FBRUY7OztHQUdHO0FBQ0gsU0FBZ0IsMkJBQTJCLENBQUMsU0FBK0IsRUFBRSxlQUFxQyxFQUFFLFdBQWlDO0lBQ2pKLE9BQU87UUFDSCxNQUFNLEVBQUUsT0FBTztRQUNmLFNBQVMsRUFBRTtZQUNQLE9BQU8sRUFBRSwwQkFBMEI7U0FDdEM7UUFDRCxNQUFNLEVBQUUsQ0FBQyxlQUFlLEVBQUUsY0FBYyxDQUFDO1FBQ3pDLFFBQVEsRUFBRTtZQUNOLFNBQVM7WUFDVCxNQUFNLENBQUMsV0FBVyxDQUFBLEdBQUcsU0FBUyxJQUFJLFdBQVcsRUFBRTtTQUNsRDtRQUNELFNBQVMsRUFBRTtZQUNQLFlBQVksRUFBRTtnQkFDVixlQUFlLEVBQUUsZUFBZTthQUNuQztTQUNKO0tBQ0osQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSBcIkBwdWx1bWkvYXdzXCI7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDbG91ZGZyb250RG5zUmVjb3JkcyhuYW1lOiBzdHJpbmcsIGRpc3RyaWJ1dGlvbjogYXdzLmNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uLCB6b25lSWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+LCBzdWJEb21haW4/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPiwgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICBjb25zdCBjbG91ZGZyb250Wm9uZUlkID0gXCJaMkZEVE5EQVRBUVlXMlwiO1xuXG4gICAgbmV3IGF3cy5yb3V0ZTUzLlJlY29yZChgJHtuYW1lfS1hYCwge1xuICAgICAgICB6b25lSWQsXG4gICAgICAgIG5hbWU6IHN1YkRvbWFpbiB8fCBcIlwiLFxuICAgICAgICB0eXBlOiBcIkFcIixcbiAgICAgICAgYWxpYXNlczogW3tcbiAgICAgICAgICAgIHpvbmVJZDogY2xvdWRmcm9udFpvbmVJZCxcbiAgICAgICAgICAgIG5hbWU6IGRpc3RyaWJ1dGlvbi5kb21haW5OYW1lLFxuICAgICAgICAgICAgZXZhbHVhdGVUYXJnZXRIZWFsdGg6IGZhbHNlXG4gICAgICAgIH1dXG4gICAgfSwgeyAuLi5vcHRzLCBkZWxldGVCZWZvcmVSZXBsYWNlOiB0cnVlIH0pO1xuXG4gICAgbmV3IGF3cy5yb3V0ZTUzLlJlY29yZChgJHtuYW1lfS1hYWFhYCwge1xuICAgICAgICB6b25lSWQsXG4gICAgICAgIG5hbWU6IHN1YkRvbWFpbiB8fCBcIlwiLFxuICAgICAgICB0eXBlOiBcIkFBQUFcIixcbiAgICAgICAgYWxpYXNlczogW3tcbiAgICAgICAgICAgIHpvbmVJZDogY2xvdWRmcm9udFpvbmVJZCxcbiAgICAgICAgICAgIG5hbWU6IGRpc3RyaWJ1dGlvbi5kb21haW5OYW1lLFxuICAgICAgICAgICAgZXZhbHVhdGVUYXJnZXRIZWFsdGg6IGZhbHNlXG4gICAgICAgIH1dXG4gICAgfSwgeyAuLi5vcHRzLCBkZWxldGVCZWZvcmVSZXBsYWNlOiB0cnVlIH0pO1xufVxuXG5leHBvcnQgY29uc3QgZGVmYXVsdFNlY3VyaXR5SGVhZGVyc0NvbmZpZzogYXdzLnR5cGVzLmlucHV0LmNsb3VkZnJvbnQuUmVzcG9uc2VIZWFkZXJzUG9saWN5U2VjdXJpdHlIZWFkZXJzQ29uZmlnID0ge1xuICAgIHN0cmljdFRyYW5zcG9ydFNlY3VyaXR5OiB7IC8vIGluZm9ybXMgYnJvd3NlcnMgdGhhdCB0aGUgc2l0ZSBzaG91bGQgb25seSBiZSBhY2Nlc3NlZCB1c2luZyBIVFRQU1xuICAgICAgICBhY2Nlc3NDb250cm9sTWF4QWdlU2VjOiAzMTUzNjAwMCwgLy8gMSB5ZWFyXG4gICAgICAgIGluY2x1ZGVTdWJkb21haW5zOiB0cnVlLFxuICAgICAgICBwcmVsb2FkOiB0cnVlLFxuICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICB9LFxuICAgIGNvbnRlbnRUeXBlT3B0aW9uczogeyAvLyBibG9ja3Mgc3R5bGVzIGFuZCBzY3JpcHRzIGZyb20gbG9hZGluZyBpZiBNSU1FIHR5cGUgaXMgaW5jb3JyZWN0XG4gICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgIH0sXG4gICAgcmVmZXJyZXJQb2xpY3k6IHsgLy8gc2VuZCBvbmx5IHRoZSBvcmlnaW4gZm9yIGNyb3NzIG9yaWdpbiByZXF1ZXN0cyBhbmQgaWYgSFRUUFNcbiAgICAgICAgcmVmZXJyZXJQb2xpY3k6ICdzdHJpY3Qtb3JpZ2luLXdoZW4tY3Jvc3Mtb3JpZ2luJyxcbiAgICAgICAgb3ZlcnJpZGU6IGZhbHNlLFxuICAgIH0sXG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBwb2xpY3kgc3RhdGVtZW50IHRvIGdyYW50IENsb3VkRnJvbnQgcmVhZCBhY2Nlc3MgdG8gdGhlIGdpdmVuIGJ1Y2tldCBwYXRoLlxuICogQHBhcmFtIHBhdGhQYXR0ZXJuIGUuZy4gJyonIG9yICdjb250ZW50LyonXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVCdWNrZXRQb2xpY3lTdGF0ZW1lbnQoYnVja2V0QXJuOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPiwgZGlzdHJpYnV0aW9uQXJuOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPiwgcGF0aFBhdHRlcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+KTogYXdzLmlhbS5Qb2xpY3lTdGF0ZW1lbnQge1xuICAgIHJldHVybiB7XG4gICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgIFNlcnZpY2U6IFwiY2xvdWRmcm9udC5hbWF6b25hd3MuY29tXCJcbiAgICAgICAgfSxcbiAgICAgICAgQWN0aW9uOiBbXCJzMzpMaXN0QnVja2V0XCIsIFwiczM6R2V0T2JqZWN0XCJdLFxuICAgICAgICBSZXNvdXJjZTogW1xuICAgICAgICAgICAgYnVja2V0QXJuLFxuICAgICAgICAgICAgcHVsdW1pLmludGVycG9sYXRlYCR7YnVja2V0QXJufS8ke3BhdGhQYXR0ZXJufWBcbiAgICAgICAgXSxcbiAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICBTdHJpbmdFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICBcIkFXUzpTb3VyY2VBcm5cIjogZGlzdHJpYnV0aW9uQXJuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuIl19