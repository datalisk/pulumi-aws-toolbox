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
            blockPublicAcls: true,
            ignorePublicAcls: true,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2luZ2xlQXNzZXRCdWNrZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvd2Vic2l0ZS9TaW5nbGVBc3NldEJ1Y2tldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsMkNBQTZFO0FBRzdFOztHQUVHO0FBQ0gsTUFBYSxpQkFBa0IsU0FBUSwwQkFBaUI7SUFNcEQsWUFBWSxJQUFZLEVBQUUsSUFBMkIsRUFBRSxJQUErQjtRQUNsRixLQUFLLENBQUMsK0JBQStCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6RCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFFMUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUU1RCxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsdUNBQXVDLENBQUMsSUFBSSxFQUFFO1lBQ3hFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU07WUFDMUIsS0FBSyxFQUFFLENBQUM7b0JBQ0osa0NBQWtDLEVBQUU7d0JBQ2hDLFlBQVksRUFBRSxRQUFRO3FCQUN6QjtpQkFDSixDQUFDO1NBQ0wsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXJCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLHVCQUF1QixDQUFDLElBQUksRUFBRTtZQUN6RCxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3RCLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLGdCQUFnQixFQUFFLElBQUk7U0FDekIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXJCLEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzlCLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDdkQsTUFBTSxJQUFJLEtBQUssQ0FBQyxhQUFhLEtBQUssQ0FBQyxJQUFJLGtCQUFrQixDQUFDLENBQUM7WUFDL0QsQ0FBQztZQUVELElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsR0FBRyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUM3QyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNO2dCQUMxQixHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUk7Z0JBQ2YsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO2dCQUN0QixXQUFXLEVBQUUsS0FBSyxDQUFDLFdBQVc7YUFDakMsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2xELENBQUM7SUFDTCxDQUFDO0lBRUQsU0FBUztRQUNMLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxpQkFBaUIsQ0FBQyxlQUFxQztRQUNuRCxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDL0IsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUN0QixNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQztnQkFDcEMsVUFBVSxFQUFFLENBQUM7d0JBQ1QsR0FBRyxFQUFFLGlCQUFpQjt3QkFDdEIsVUFBVSxFQUFFLENBQUM7Z0NBQ1QsSUFBSSxFQUFFLFNBQVM7Z0NBQ2YsV0FBVyxFQUFFLENBQUMsMEJBQTBCLENBQUM7NkJBQzVDLENBQUM7d0JBQ0YsT0FBTyxFQUFFOzRCQUNMLGNBQWM7NEJBQ2QsZUFBZTt5QkFDbEI7d0JBQ0QsU0FBUyxFQUFFOzRCQUNQLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRzs0QkFDZixNQUFNLENBQUMsV0FBVyxDQUFBLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUk7eUJBQzNDO3dCQUNELFVBQVUsRUFBRTs0QkFDUjtnQ0FDSSxJQUFJLEVBQUUsY0FBYztnQ0FDcEIsUUFBUSxFQUFFLGVBQWU7Z0NBQ3pCLE1BQU0sRUFBRSxDQUFDLGVBQWUsQ0FBQzs2QkFDNUI7eUJBQ0o7cUJBQ0osQ0FBQzthQUNMLENBQUMsQ0FBQyxJQUFJO1NBQ1YsRUFBRTtZQUNDLE1BQU0sRUFBRSxJQUFJO1lBQ1osU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQztTQUNqQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUFqRkQsOENBaUZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXdzIGZyb20gXCJAcHVsdW1pL2F3c1wiO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuaW1wb3J0IHsgQ29tcG9uZW50UmVzb3VyY2UsIENvbXBvbmVudFJlc291cmNlT3B0aW9ucyB9IGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuXG5cbi8qKlxuICogQ3JlYXRlcyBhIFMzIGJ1Y2tldCB3aGVyZSBzaW5nbGUgZmlsZSBhc3NldHMgY2FuIGJlIHN0b3JlZCBmb3IgZGVsaXZlcnkgYnkgYSBDbG91ZEZyb250IGRpc3RyaWJ1dGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIFNpbmdsZUFzc2V0QnVja2V0IGV4dGVuZHMgQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHJlYWRvbmx5IGFzc2V0czogU2luZ2xlQXNzZXRbXTtcbiAgICBwcml2YXRlIGJ1Y2tldDogYXdzLnMzLkJ1Y2tldDtcbiAgICBwcml2YXRlIG5hbWU6IHN0cmluZztcbiAgICBwcml2YXRlIHB1YmxpY0FjY2VzczogYXdzLnMzLkJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBTaW5nbGVBc3NldEJ1Y2tldEFyZ3MsIG9wdHM/OiBDb21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJwYXQ6d2Vic2l0ZTpTaW5nbGVBc3NldEJ1Y2tldFwiLCBuYW1lLCBhcmdzLCBvcHRzKTtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5hc3NldHMgPSBhcmdzLmFzc2V0cztcblxuICAgICAgICB0aGlzLmJ1Y2tldCA9IG5ldyBhd3MuczMuQnVja2V0KG5hbWUsIHt9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICBjb25zdCBlbmNyeXB0aW9uID0gbmV3IGF3cy5zMy5CdWNrZXRTZXJ2ZXJTaWRlRW5jcnlwdGlvbkNvbmZpZ3VyYXRpb24obmFtZSwge1xuICAgICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5idWNrZXQsXG4gICAgICAgICAgICBydWxlczogW3tcbiAgICAgICAgICAgICAgICBhcHBseVNlcnZlclNpZGVFbmNyeXB0aW9uQnlEZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgIHNzZUFsZ29yaXRobTogXCJBRVMyNTZcIixcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XVxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLnB1YmxpY0FjY2VzcyA9IG5ldyBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2sobmFtZSwge1xuICAgICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgICAgIGJsb2NrUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIGZvciAoY29uc3QgYXNzZXQgb2YgYXJncy5hc3NldHMpIHtcbiAgICAgICAgICAgIGlmIChhc3NldC5wYXRoLmluY2x1ZGVzKFwiKlwiKSB8fCBhc3NldC5wYXRoLmluY2x1ZGVzKFwiP1wiKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgV2lsZGNhcmQgJyR7YXNzZXQucGF0aH0nIGlzIG5vdCBhbGxvd2VkYCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5ldyBhd3MuczMuQnVja2V0T2JqZWN0KGAke25hbWV9LSR7YXNzZXQucGF0aH1gLCB7XG4gICAgICAgICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5idWNrZXQsXG4gICAgICAgICAgICAgICAga2V5OiBhc3NldC5wYXRoLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGFzc2V0LmNvbnRlbnQsXG4gICAgICAgICAgICAgICAgY29udGVudFR5cGU6IGFzc2V0LmNvbnRlbnRUeXBlXG4gICAgICAgICAgICB9LCB7IHBhcmVudDogdGhpcywgZGVwZW5kc09uOiBbZW5jcnlwdGlvbl0gfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRCdWNrZXQoKTogYXdzLnMzLkJ1Y2tldCB7XG4gICAgICAgIHJldHVybiB0aGlzLmJ1Y2tldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgcG9saWN5IHRoYXQgYWxsb3dzIHRoZSBnaXZlbiBkaXN0cmlidXRpb24gdG8gcmVhZCBhc3NldHMgZnJvbSB0aGUgYnVja2V0LlxuICAgICAqL1xuICAgIHNldHVwQWNjZXNzUG9saWN5KGRpc3RyaWJ1dGlvbkFybjogcHVsdW1pLklucHV0PHN0cmluZz4pIHtcbiAgICAgICAgbmV3IGF3cy5zMy5CdWNrZXRQb2xpY3kodGhpcy5uYW1lLCB7XG4gICAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgICAgcG9saWN5OiBhd3MuaWFtLmdldFBvbGljeURvY3VtZW50T3V0cHV0KHtcbiAgICAgICAgICAgICAgICBzdGF0ZW1lbnRzOiBbe1xuICAgICAgICAgICAgICAgICAgICBzaWQ6IGBDbG91ZEZyb250LVJlYWRgLFxuICAgICAgICAgICAgICAgICAgICBwcmluY2lwYWxzOiBbe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJTZXJ2aWNlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyczogW1wiY2xvdWRmcm9udC5hbWF6b25hd3MuY29tXCJdLFxuICAgICAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJzMzpHZXRPYmplY3RcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiczM6TGlzdEJ1Y2tldFwiLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnVja2V0LmFybixcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1bHVtaS5pbnRlcnBvbGF0ZWAke3RoaXMuYnVja2V0LmFybn0vKmAsXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0OiBcIlN0cmluZ0VxdWFsc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlOiBcIkFXUzpTb3VyY2VBcm5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXM6IFtkaXN0cmlidXRpb25Bcm5dLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgfSkuanNvbixcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcGFyZW50OiB0aGlzLFxuICAgICAgICAgICAgZGVwZW5kc09uOiBbdGhpcy5wdWJsaWNBY2Nlc3NdXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaW5nbGVBc3NldEJ1Y2tldEFyZ3Mge1xuICAgIHJlYWRvbmx5IGFzc2V0czogU2luZ2xlQXNzZXRbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaW5nbGVBc3NldCB7XG4gICAgLyoqXG4gICAgICogTXVzdCBzdGFydCB3aXRoIGEgc2xhc2guXG4gICAgICovXG4gICAgcmVhZG9ubHkgcGF0aDogc3RyaW5nO1xuICAgIHJlYWRvbmx5IGNvbnRlbnQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHJlYWRvbmx5IGNvbnRlbnRUeXBlOiBzdHJpbmc7XG59XG4iXX0=