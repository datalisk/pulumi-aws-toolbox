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
exports.SingleAssetBucket = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const pulumi_1 = require("@pulumi/pulumi");
/**
 * Creates a S3 bucket where single file assets can be stored for delivery by a CloudFront distribution.
 */
class SingleAssetBucket extends pulumi_1.ComponentResource {
    constructor(name, args, opts) {
        super("pat:website:SingleAssetBucket", name, args, opts);
        this.name = name;
        this.assets = args.assets;
        this.bucket = new aws.s3.Bucket(name, {}, { parent: this });
        const encryption = new aws.s3.BucketServerSideEncryptionConfiguration(name, {
            bucket: this.bucket.bucket,
            rules: [{
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: "AES256",
                    }
                }]
        }, { parent: this });
        this.publicAccess = new aws.s3.BucketPublicAccessBlock(name, {
            bucket: this.bucket.id,
            blockPublicPolicy: true,
            blockPublicAcls: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });
        for (const asset of args.assets) {
            if (asset.path.includes("*") || asset.path.includes("?")) {
                throw new Error(`Wildcard '${asset.path}' is not allowed`);
            }
            new aws.s3.BucketObject(`${name}-${asset.path}`, {
                bucket: this.bucket.bucket,
                key: asset.path,
                content: asset.content,
                contentType: asset.contentType
            }, { parent: this, dependsOn: [encryption] });
        }
    }
    getBucket() {
        return this.bucket;
    }
    /**
     * Creates a policy that allows the given distribution to read assets from the bucket.
     */
    setupAccessPolicy(distributionArn) {
        new aws.s3.BucketPolicy(this.name, {
            bucket: this.bucket.id,
            policy: aws.iam.getPolicyDocumentOutput({
                statements: [{
                        sid: `CloudFront-Read`,
                        principals: [{
                                type: "Service",
                                identifiers: ["cloudfront.amazonaws.com"],
                            }],
                        actions: [
                            "s3:GetObject",
                            "s3:ListBucket",
                        ],
                        resources: [
                            this.bucket.arn,
                            pulumi.interpolate `${this.bucket.arn}/*`,
                        ],
                        conditions: [
                            {
                                test: "StringEquals",
                                variable: "AWS:SourceArn",
                                values: [distributionArn],
                            }
                        ],
                    }],
            }).json,
        }, {
            parent: this,
            dependsOn: [this.publicAccess]
        });
    }
}
exports.SingleAssetBucket = SingleAssetBucket;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2luZ2xlQXNzZXRCdWNrZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvd2Vic2l0ZS9TaW5nbGVBc3NldEJ1Y2tldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsMkNBQTZFO0FBRzdFOztHQUVHO0FBQ0gsTUFBYSxpQkFBa0IsU0FBUSwwQkFBaUI7SUFNcEQsWUFBWSxJQUFZLEVBQUUsSUFBMkIsRUFBRSxJQUErQjtRQUNsRixLQUFLLENBQUMsK0JBQStCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6RCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFFMUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUU1RCxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsdUNBQXVDLENBQUMsSUFBSSxFQUFFO1lBQ3hFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU07WUFDMUIsS0FBSyxFQUFFLENBQUM7b0JBQ0osa0NBQWtDLEVBQUU7d0JBQ2hDLFlBQVksRUFBRSxRQUFRO3FCQUN6QjtpQkFDSixDQUFDO1NBQ0wsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXJCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLHVCQUF1QixDQUFDLElBQUksRUFBRTtZQUN6RCxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3RCLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsZUFBZSxFQUFFLElBQUk7WUFDckIsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixxQkFBcUIsRUFBRSxJQUFJO1NBQzlCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVyQixLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUM5QixJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZELE1BQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxLQUFLLENBQUMsSUFBSSxrQkFBa0IsQ0FBQyxDQUFDO1lBQy9ELENBQUM7WUFFRCxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLEdBQUcsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRTtnQkFDN0MsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTTtnQkFDMUIsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJO2dCQUNmLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztnQkFDdEIsV0FBVyxFQUFFLEtBQUssQ0FBQyxXQUFXO2FBQ2pDLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNsRCxDQUFDO0lBQ0wsQ0FBQztJQUVELFNBQVM7UUFDTCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDdkIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsaUJBQWlCLENBQUMsZUFBcUM7UUFDbkQsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQy9CLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDdEIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUM7Z0JBQ3BDLFVBQVUsRUFBRSxDQUFDO3dCQUNULEdBQUcsRUFBRSxpQkFBaUI7d0JBQ3RCLFVBQVUsRUFBRSxDQUFDO2dDQUNULElBQUksRUFBRSxTQUFTO2dDQUNmLFdBQVcsRUFBRSxDQUFDLDBCQUEwQixDQUFDOzZCQUM1QyxDQUFDO3dCQUNGLE9BQU8sRUFBRTs0QkFDTCxjQUFjOzRCQUNkLGVBQWU7eUJBQ2xCO3dCQUNELFNBQVMsRUFBRTs0QkFDUCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUc7NEJBQ2YsTUFBTSxDQUFDLFdBQVcsQ0FBQSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJO3lCQUMzQzt3QkFDRCxVQUFVLEVBQUU7NEJBQ1I7Z0NBQ0ksSUFBSSxFQUFFLGNBQWM7Z0NBQ3BCLFFBQVEsRUFBRSxlQUFlO2dDQUN6QixNQUFNLEVBQUUsQ0FBQyxlQUFlLENBQUM7NkJBQzVCO3lCQUNKO3FCQUNKLENBQUM7YUFDTCxDQUFDLENBQUMsSUFBSTtTQUNWLEVBQUU7WUFDQyxNQUFNLEVBQUUsSUFBSTtZQUNaLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7U0FDakMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBbkZELDhDQW1GQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tIFwiQHB1bHVtaS9hd3NcIjtcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcbmltcG9ydCB7IENvbXBvbmVudFJlc291cmNlLCBDb21wb25lbnRSZXNvdXJjZU9wdGlvbnMgfSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcblxuXG4vKipcbiAqIENyZWF0ZXMgYSBTMyBidWNrZXQgd2hlcmUgc2luZ2xlIGZpbGUgYXNzZXRzIGNhbiBiZSBzdG9yZWQgZm9yIGRlbGl2ZXJ5IGJ5IGEgQ2xvdWRGcm9udCBkaXN0cmlidXRpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBTaW5nbGVBc3NldEJ1Y2tldCBleHRlbmRzIENvbXBvbmVudFJlc291cmNlIHtcbiAgICByZWFkb25seSBhc3NldHM6IFNpbmdsZUFzc2V0W107XG4gICAgcHJpdmF0ZSBidWNrZXQ6IGF3cy5zMy5CdWNrZXQ7XG4gICAgcHJpdmF0ZSBuYW1lOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBwdWJsaWNBY2Nlc3M6IGF3cy5zMy5CdWNrZXRQdWJsaWNBY2Nlc3NCbG9jaztcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogU2luZ2xlQXNzZXRCdWNrZXRBcmdzLCBvcHRzPzogQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwicGF0OndlYnNpdGU6U2luZ2xlQXNzZXRCdWNrZXRcIiwgbmFtZSwgYXJncywgb3B0cyk7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuYXNzZXRzID0gYXJncy5hc3NldHM7XG5cbiAgICAgICAgdGhpcy5idWNrZXQgPSBuZXcgYXdzLnMzLkJ1Y2tldChuYW1lLCB7fSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgY29uc3QgZW5jcnlwdGlvbiA9IG5ldyBhd3MuczMuQnVja2V0U2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uKG5hbWUsIHtcbiAgICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuYnVja2V0LFxuICAgICAgICAgICAgcnVsZXM6IFt7XG4gICAgICAgICAgICAgICAgYXBwbHlTZXJ2ZXJTaWRlRW5jcnlwdGlvbkJ5RGVmYXVsdDoge1xuICAgICAgICAgICAgICAgICAgICBzc2VBbGdvcml0aG06IFwiQUVTMjU2XCIsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV1cbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5wdWJsaWNBY2Nlc3MgPSBuZXcgYXdzLnMzLkJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrKG5hbWUsIHtcbiAgICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgICAgICAgIGJsb2NrUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWUsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIGZvciAoY29uc3QgYXNzZXQgb2YgYXJncy5hc3NldHMpIHtcbiAgICAgICAgICAgIGlmIChhc3NldC5wYXRoLmluY2x1ZGVzKFwiKlwiKSB8fCBhc3NldC5wYXRoLmluY2x1ZGVzKFwiP1wiKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgV2lsZGNhcmQgJyR7YXNzZXQucGF0aH0nIGlzIG5vdCBhbGxvd2VkYCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5ldyBhd3MuczMuQnVja2V0T2JqZWN0KGAke25hbWV9LSR7YXNzZXQucGF0aH1gLCB7XG4gICAgICAgICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5idWNrZXQsXG4gICAgICAgICAgICAgICAga2V5OiBhc3NldC5wYXRoLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGFzc2V0LmNvbnRlbnQsXG4gICAgICAgICAgICAgICAgY29udGVudFR5cGU6IGFzc2V0LmNvbnRlbnRUeXBlXG4gICAgICAgICAgICB9LCB7IHBhcmVudDogdGhpcywgZGVwZW5kc09uOiBbZW5jcnlwdGlvbl0gfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRCdWNrZXQoKTogYXdzLnMzLkJ1Y2tldCB7XG4gICAgICAgIHJldHVybiB0aGlzLmJ1Y2tldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgcG9saWN5IHRoYXQgYWxsb3dzIHRoZSBnaXZlbiBkaXN0cmlidXRpb24gdG8gcmVhZCBhc3NldHMgZnJvbSB0aGUgYnVja2V0LlxuICAgICAqL1xuICAgIHNldHVwQWNjZXNzUG9saWN5KGRpc3RyaWJ1dGlvbkFybjogcHVsdW1pLklucHV0PHN0cmluZz4pIHtcbiAgICAgICAgbmV3IGF3cy5zMy5CdWNrZXRQb2xpY3kodGhpcy5uYW1lLCB7XG4gICAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgICAgcG9saWN5OiBhd3MuaWFtLmdldFBvbGljeURvY3VtZW50T3V0cHV0KHtcbiAgICAgICAgICAgICAgICBzdGF0ZW1lbnRzOiBbe1xuICAgICAgICAgICAgICAgICAgICBzaWQ6IGBDbG91ZEZyb250LVJlYWRgLFxuICAgICAgICAgICAgICAgICAgICBwcmluY2lwYWxzOiBbe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJTZXJ2aWNlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyczogW1wiY2xvdWRmcm9udC5hbWF6b25hd3MuY29tXCJdLFxuICAgICAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJzMzpHZXRPYmplY3RcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiczM6TGlzdEJ1Y2tldFwiLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnVja2V0LmFybixcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1bHVtaS5pbnRlcnBvbGF0ZWAke3RoaXMuYnVja2V0LmFybn0vKmAsXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0OiBcIlN0cmluZ0VxdWFsc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlOiBcIkFXUzpTb3VyY2VBcm5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXM6IFtkaXN0cmlidXRpb25Bcm5dLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgfSkuanNvbixcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcGFyZW50OiB0aGlzLFxuICAgICAgICAgICAgZGVwZW5kc09uOiBbdGhpcy5wdWJsaWNBY2Nlc3NdXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaW5nbGVBc3NldEJ1Y2tldEFyZ3Mge1xuICAgIHJlYWRvbmx5IGFzc2V0czogU2luZ2xlQXNzZXRbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaW5nbGVBc3NldCB7XG4gICAgLyoqXG4gICAgICogTXVzdCBzdGFydCB3aXRoIGEgc2xhc2guXG4gICAgICovXG4gICAgcmVhZG9ubHkgcGF0aDogc3RyaW5nO1xuICAgIHJlYWRvbmx5IGNvbnRlbnQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHJlYWRvbmx5IGNvbnRlbnRUeXBlOiBzdHJpbmc7XG59XG4iXX0=