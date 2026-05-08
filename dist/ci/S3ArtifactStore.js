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
exports.S3ArtifactStore = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const pulumi_1 = require("@pulumi/pulumi");
/**
 * Creates a S3 bucket where CI build artifacts can be stored.
 */
class S3ArtifactStore extends pulumi_1.ComponentResource {
    constructor(name, args, opts) {
        super("pat:ci:S3ArtifactStore", name, args, {
            ...opts
        });
        this.allowAddPolicyStatements = true;
        this.name = name;
        this.policyStatements = [];
        this.bucket = new aws.s3.Bucket(name, {
            forceDestroy: true,
        }, {
            parent: this,
            protect: opts === null || opts === void 0 ? void 0 : opts.protect,
        });
        new aws.s3.BucketServerSideEncryptionConfiguration(name, {
            bucket: this.bucket.bucket,
            rules: [{
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: "AES256",
                    }
                }]
        }, { parent: this });
        new aws.s3.BucketVersioning(name, {
            bucket: this.bucket.bucket,
            versioningConfiguration: {
                status: "Enabled",
            },
        }, { parent: this });
        new aws.s3.BucketLifecycleConfiguration(name, {
            bucket: this.bucket.bucket,
            rules: [{
                    id: "deleteOldVersions",
                    status: 'Enabled',
                    noncurrentVersionExpiration: {
                        noncurrentDays: 90,
                    }
                }]
        }, { parent: this });
        // block all public access
        this.publicAccess = new aws.s3.BucketPublicAccessBlock(name, {
            bucket: this.bucket.id,
            blockPublicPolicy: true,
            blockPublicAcls: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });
    }
    /**
     * Returns a S3Folder that contains a build artifact in S3.
     */
    getArtifact(artifactName, version) {
        const path = pulumi.interpolate `${artifactName}/${version}`;
        return this.getFolderByPath(path);
    }
    getFolderByPath(path) {
        return {
            bucket: this.bucket,
            path: path,
            addBucketPolicyStatement: (statement) => {
                this.addPolicyStatement(statement);
            },
        };
    }
    addPolicyStatement(statement) {
        if (!this.allowAddPolicyStatements) {
            throw new Error(`Not allowed to add policies - createBucketPolicy has already been called`);
        }
        this.policyStatements.push(statement);
    }
    /**
     * Creates a bucket resource policy for the added policy statements.
     */
    createBucketPolicy() {
        this.allowAddPolicyStatements = false;
        if (this.policyStatements.length > 0) {
            new aws.s3.BucketPolicy(this.name, {
                bucket: this.bucket.id,
                policy: {
                    Version: "2012-10-17",
                    Statement: this.policyStatements,
                },
            }, {
                parent: this,
                dependsOn: [this.publicAccess]
            });
        }
    }
    getBucketName() {
        return this.bucket.bucket;
    }
}
exports.S3ArtifactStore = S3ArtifactStore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUzNBcnRpZmFjdFN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NpL1MzQXJ0aWZhY3RTdG9yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsMkNBQTZFO0FBSTdFOztHQUVHO0FBQ0gsTUFBYSxlQUFnQixTQUFRLDBCQUFpQjtJQU9sRCxZQUFZLElBQVksRUFBRSxJQUEwQixFQUFFLElBQStCO1FBQ2pGLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO1lBQ3hDLEdBQUcsSUFBSTtTQUNWLENBQUMsQ0FBQztRQUxDLDZCQUF3QixHQUFHLElBQUksQ0FBQztRQU9wQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO1FBRTNCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7WUFDbEMsWUFBWSxFQUFFLElBQUk7U0FDckIsRUFBRTtZQUNDLE1BQU0sRUFBRSxJQUFJO1lBQ1osT0FBTyxFQUFFLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxPQUFPO1NBQ3pCLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyx1Q0FBdUMsQ0FBQyxJQUFJLEVBQUU7WUFDckQsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTTtZQUMxQixLQUFLLEVBQUUsQ0FBQztvQkFDSixrQ0FBa0MsRUFBRTt3QkFDaEMsWUFBWSxFQUFFLFFBQVE7cUJBQ3pCO2lCQUNKLENBQUM7U0FDTCxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFFckIsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRTtZQUM5QixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNO1lBQzFCLHVCQUF1QixFQUFFO2dCQUNyQixNQUFNLEVBQUUsU0FBUzthQUNwQjtTQUNKLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVyQixJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsNEJBQTRCLENBQUMsSUFBSSxFQUFFO1lBQzFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU07WUFDMUIsS0FBSyxFQUFFLENBQUM7b0JBQ0osRUFBRSxFQUFFLG1CQUFtQjtvQkFDdkIsTUFBTSxFQUFFLFNBQVM7b0JBQ2pCLDJCQUEyQixFQUFFO3dCQUN6QixjQUFjLEVBQUUsRUFBRTtxQkFDckI7aUJBQ0osQ0FBQztTQUNMLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVyQiwwQkFBMEI7UUFDMUIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFO1lBQ3pELE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDdEIsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixlQUFlLEVBQUUsSUFBSTtZQUNyQixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLHFCQUFxQixFQUFFLElBQUk7U0FDOUIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7T0FFRztJQUNILFdBQVcsQ0FBQyxZQUFrQyxFQUFFLE9BQTZCO1FBQ3pFLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUEsR0FBRyxZQUFZLElBQUksT0FBTyxFQUFFLENBQUM7UUFDNUQsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFTyxlQUFlLENBQUMsSUFBMEI7UUFDOUMsT0FBTztZQUNILE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtZQUNuQixJQUFJLEVBQUUsSUFBSTtZQUNWLHdCQUF3QixFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUU7Z0JBQ3BDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2QyxDQUFDO1NBQ0osQ0FBQztJQUNOLENBQUM7SUFFTyxrQkFBa0IsQ0FBQyxTQUFrQztRQUN6RCxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFDakMsTUFBTSxJQUFJLEtBQUssQ0FBQywwRUFBMEUsQ0FBQyxDQUFDO1FBQ2hHLENBQUM7UUFDRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRDs7T0FFRztJQUNILGtCQUFrQjtRQUNkLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxLQUFLLENBQUM7UUFFdEMsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ25DLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDL0IsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDdEIsTUFBTSxFQUFFO29CQUNKLE9BQU8sRUFBRSxZQUFZO29CQUNyQixTQUFTLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtpQkFDbkM7YUFDSixFQUFFO2dCQUNDLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7YUFDakMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztJQUNMLENBQUM7SUFFRCxhQUFhO1FBQ1QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUM5QixDQUFDO0NBQ0o7QUEzR0QsMENBMkdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXdzIGZyb20gXCJAcHVsdW1pL2F3c1wiO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuaW1wb3J0IHsgQ29tcG9uZW50UmVzb3VyY2UsIENvbXBvbmVudFJlc291cmNlT3B0aW9ucyB9IGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuaW1wb3J0IHsgUzNGb2xkZXIgfSBmcm9tIFwiLi9TM0ZvbGRlclwiO1xuXG5cbi8qKlxuICogQ3JlYXRlcyBhIFMzIGJ1Y2tldCB3aGVyZSBDSSBidWlsZCBhcnRpZmFjdHMgY2FuIGJlIHN0b3JlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIFMzQXJ0aWZhY3RTdG9yZSBleHRlbmRzIENvbXBvbmVudFJlc291cmNlIHtcbiAgICBwcml2YXRlIGJ1Y2tldDogYXdzLnMzLkJ1Y2tldDtcbiAgICBwcml2YXRlIG5hbWU6IHN0cmluZztcbiAgICBwcml2YXRlIHB1YmxpY0FjY2VzczogYXdzLnMzLkJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrO1xuICAgIHByaXZhdGUgcG9saWN5U3RhdGVtZW50czogYXdzLmlhbS5Qb2xpY3lTdGF0ZW1lbnRbXTtcbiAgICBwcml2YXRlIGFsbG93QWRkUG9saWN5U3RhdGVtZW50cyA9IHRydWU7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M/OiBTM0FydGlmYWN0U3RvcmVBcmdzLCBvcHRzPzogQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwicGF0OmNpOlMzQXJ0aWZhY3RTdG9yZVwiLCBuYW1lLCBhcmdzLCB7XG4gICAgICAgICAgICAuLi5vcHRzXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMucG9saWN5U3RhdGVtZW50cyA9IFtdO1xuXG4gICAgICAgIHRoaXMuYnVja2V0ID0gbmV3IGF3cy5zMy5CdWNrZXQobmFtZSwge1xuICAgICAgICAgICAgZm9yY2VEZXN0cm95OiB0cnVlLFxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgICBwcm90ZWN0OiBvcHRzPy5wcm90ZWN0LFxuICAgICAgICB9KTtcblxuICAgICAgICBuZXcgYXdzLnMzLkJ1Y2tldFNlcnZlclNpZGVFbmNyeXB0aW9uQ29uZmlndXJhdGlvbihuYW1lLCB7XG4gICAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmJ1Y2tldCxcbiAgICAgICAgICAgIHJ1bGVzOiBbe1xuICAgICAgICAgICAgICAgIGFwcGx5U2VydmVyU2lkZUVuY3J5cHRpb25CeURlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgc3NlQWxnb3JpdGhtOiBcIkFFUzI1NlwiLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1dXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIG5ldyBhd3MuczMuQnVja2V0VmVyc2lvbmluZyhuYW1lLCB7XG4gICAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmJ1Y2tldCxcbiAgICAgICAgICAgIHZlcnNpb25pbmdDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiBcIkVuYWJsZWRcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIG5ldyBhd3MuczMuQnVja2V0TGlmZWN5Y2xlQ29uZmlndXJhdGlvbihuYW1lLCB7XG4gICAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmJ1Y2tldCxcbiAgICAgICAgICAgIHJ1bGVzOiBbe1xuICAgICAgICAgICAgICAgIGlkOiBcImRlbGV0ZU9sZFZlcnNpb25zXCIsXG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICAgICAgICAgICAgbm9uY3VycmVudFZlcnNpb25FeHBpcmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIG5vbmN1cnJlbnREYXlzOiA5MCxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XVxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICAvLyBibG9jayBhbGwgcHVibGljIGFjY2Vzc1xuICAgICAgICB0aGlzLnB1YmxpY0FjY2VzcyA9IG5ldyBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2sobmFtZSwge1xuICAgICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgICAgIGJsb2NrUHVibGljUG9saWN5OiB0cnVlLFxuICAgICAgICAgICAgYmxvY2tQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICAgICAgaWdub3JlUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZSxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIFMzRm9sZGVyIHRoYXQgY29udGFpbnMgYSBidWlsZCBhcnRpZmFjdCBpbiBTMy5cbiAgICAgKi9cbiAgICBnZXRBcnRpZmFjdChhcnRpZmFjdE5hbWU6IHB1bHVtaS5JbnB1dDxzdHJpbmc+LCB2ZXJzaW9uOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPik6IFMzRm9sZGVyIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IHB1bHVtaS5pbnRlcnBvbGF0ZWAke2FydGlmYWN0TmFtZX0vJHt2ZXJzaW9ufWA7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEZvbGRlckJ5UGF0aChwYXRoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEZvbGRlckJ5UGF0aChwYXRoOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPik6IFMzRm9sZGVyIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQsXG4gICAgICAgICAgICBwYXRoOiBwYXRoLFxuICAgICAgICAgICAgYWRkQnVja2V0UG9saWN5U3RhdGVtZW50OiAoc3RhdGVtZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRQb2xpY3lTdGF0ZW1lbnQoc3RhdGVtZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGRQb2xpY3lTdGF0ZW1lbnQoc3RhdGVtZW50OiBhd3MuaWFtLlBvbGljeVN0YXRlbWVudCkge1xuICAgICAgICBpZiAoIXRoaXMuYWxsb3dBZGRQb2xpY3lTdGF0ZW1lbnRzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vdCBhbGxvd2VkIHRvIGFkZCBwb2xpY2llcyAtIGNyZWF0ZUJ1Y2tldFBvbGljeSBoYXMgYWxyZWFkeSBiZWVuIGNhbGxlZGApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucG9saWN5U3RhdGVtZW50cy5wdXNoKHN0YXRlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGJ1Y2tldCByZXNvdXJjZSBwb2xpY3kgZm9yIHRoZSBhZGRlZCBwb2xpY3kgc3RhdGVtZW50cy5cbiAgICAgKi9cbiAgICBjcmVhdGVCdWNrZXRQb2xpY3koKSB7XG4gICAgICAgIHRoaXMuYWxsb3dBZGRQb2xpY3lTdGF0ZW1lbnRzID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKHRoaXMucG9saWN5U3RhdGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBuZXcgYXdzLnMzLkJ1Y2tldFBvbGljeSh0aGlzLm5hbWUsIHtcbiAgICAgICAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgICAgICAgIHBvbGljeToge1xuICAgICAgICAgICAgICAgICAgICBWZXJzaW9uOiBcIjIwMTItMTAtMTdcIixcbiAgICAgICAgICAgICAgICAgICAgU3RhdGVtZW50OiB0aGlzLnBvbGljeVN0YXRlbWVudHMsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgICAgICAgZGVwZW5kc09uOiBbdGhpcy5wdWJsaWNBY2Nlc3NdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldEJ1Y2tldE5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJ1Y2tldC5idWNrZXQ7XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFMzQXJ0aWZhY3RTdG9yZUFyZ3Mge1xuICAgIHJlYWRvbmx5IGFydGlmYWN0TmFtZT86IHN0cmluZztcbn1cbiJdfQ==