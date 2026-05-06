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
        // TODO block all public access
        this.publicAccess = new aws.s3.BucketPublicAccessBlock(name, {
            bucket: this.bucket.id,
            blockPublicAcls: true,
            ignorePublicAcls: true,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUzNBcnRpZmFjdFN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NpL1MzQXJ0aWZhY3RTdG9yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsMkNBQTZFO0FBSTdFOztHQUVHO0FBQ0gsTUFBYSxlQUFnQixTQUFRLDBCQUFpQjtJQU9sRCxZQUFZLElBQVksRUFBRSxJQUEwQixFQUFFLElBQStCO1FBQ2pGLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO1lBQ3hDLEdBQUcsSUFBSTtTQUNWLENBQUMsQ0FBQztRQUxDLDZCQUF3QixHQUFHLElBQUksQ0FBQztRQU9wQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO1FBRTNCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7WUFDbEMsWUFBWSxFQUFFLElBQUk7U0FDckIsRUFBRTtZQUNDLE1BQU0sRUFBRSxJQUFJO1lBQ1osT0FBTyxFQUFFLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxPQUFPO1NBQ3pCLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyx1Q0FBdUMsQ0FBQyxJQUFJLEVBQUU7WUFDckQsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTTtZQUMxQixLQUFLLEVBQUUsQ0FBQztvQkFDSixrQ0FBa0MsRUFBRTt3QkFDaEMsWUFBWSxFQUFFLFFBQVE7cUJBQ3pCO2lCQUNKLENBQUM7U0FDTCxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFFckIsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRTtZQUM5QixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNO1lBQzFCLHVCQUF1QixFQUFFO2dCQUNyQixNQUFNLEVBQUUsU0FBUzthQUNwQjtTQUNKLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVyQixJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsNEJBQTRCLENBQUMsSUFBSSxFQUFFO1lBQzFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU07WUFDMUIsS0FBSyxFQUFFLENBQUM7b0JBQ0osRUFBRSxFQUFFLG1CQUFtQjtvQkFDdkIsTUFBTSxFQUFFLFNBQVM7b0JBQ2pCLDJCQUEyQixFQUFFO3dCQUN6QixjQUFjLEVBQUUsRUFBRTtxQkFDckI7aUJBQ0osQ0FBQztTQUNMLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVyQiwrQkFBK0I7UUFDL0IsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFO1lBQ3pELE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDdEIsZUFBZSxFQUFFLElBQUk7WUFDckIsZ0JBQWdCLEVBQUUsSUFBSTtTQUN6QixFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDekIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsV0FBVyxDQUFDLFlBQWtDLEVBQUUsT0FBNkI7UUFDekUsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQSxHQUFHLFlBQVksSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUM1RCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVPLGVBQWUsQ0FBQyxJQUEwQjtRQUM5QyxPQUFPO1lBQ0gsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1lBQ25CLElBQUksRUFBRSxJQUFJO1lBQ1Ysd0JBQXdCLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRTtnQkFDcEMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7U0FDSixDQUFDO0lBQ04sQ0FBQztJQUVPLGtCQUFrQixDQUFDLFNBQWtDO1FBQ3pELElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUNqQyxNQUFNLElBQUksS0FBSyxDQUFDLDBFQUEwRSxDQUFDLENBQUM7UUFDaEcsQ0FBQztRQUNELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsa0JBQWtCO1FBQ2QsSUFBSSxDQUFDLHdCQUF3QixHQUFHLEtBQUssQ0FBQztRQUV0QyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDbkMsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO2dCQUMvQixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUN0QixNQUFNLEVBQUU7b0JBQ0osT0FBTyxFQUFFLFlBQVk7b0JBQ3JCLFNBQVMsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO2lCQUNuQzthQUNKLEVBQUU7Z0JBQ0MsTUFBTSxFQUFFLElBQUk7Z0JBQ1osU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQzthQUNqQyxDQUFDLENBQUM7UUFDUCxDQUFDO0lBQ0wsQ0FBQztJQUVELGFBQWE7UUFDVCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQzlCLENBQUM7Q0FDSjtBQXpHRCwwQ0F5R0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSBcIkBwdWx1bWkvYXdzXCI7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5pbXBvcnQgeyBDb21wb25lbnRSZXNvdXJjZSwgQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zIH0gZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5pbXBvcnQgeyBTM0ZvbGRlciB9IGZyb20gXCIuL1MzRm9sZGVyXCI7XG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgUzMgYnVja2V0IHdoZXJlIENJIGJ1aWxkIGFydGlmYWN0cyBjYW4gYmUgc3RvcmVkLlxuICovXG5leHBvcnQgY2xhc3MgUzNBcnRpZmFjdFN0b3JlIGV4dGVuZHMgQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHByaXZhdGUgYnVja2V0OiBhd3MuczMuQnVja2V0O1xuICAgIHByaXZhdGUgbmFtZTogc3RyaW5nO1xuICAgIHByaXZhdGUgcHVibGljQWNjZXNzOiBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2s7XG4gICAgcHJpdmF0ZSBwb2xpY3lTdGF0ZW1lbnRzOiBhd3MuaWFtLlBvbGljeVN0YXRlbWVudFtdO1xuICAgIHByaXZhdGUgYWxsb3dBZGRQb2xpY3lTdGF0ZW1lbnRzID0gdHJ1ZTtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJncz86IFMzQXJ0aWZhY3RTdG9yZUFyZ3MsIG9wdHM/OiBDb21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJwYXQ6Y2k6UzNBcnRpZmFjdFN0b3JlXCIsIG5hbWUsIGFyZ3MsIHtcbiAgICAgICAgICAgIC4uLm9wdHNcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5wb2xpY3lTdGF0ZW1lbnRzID0gW107XG5cbiAgICAgICAgdGhpcy5idWNrZXQgPSBuZXcgYXdzLnMzLkJ1Y2tldChuYW1lLCB7XG4gICAgICAgICAgICBmb3JjZURlc3Ryb3k6IHRydWUsXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHBhcmVudDogdGhpcyxcbiAgICAgICAgICAgIHByb3RlY3Q6IG9wdHM/LnByb3RlY3QsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG5ldyBhd3MuczMuQnVja2V0U2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uKG5hbWUsIHtcbiAgICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuYnVja2V0LFxuICAgICAgICAgICAgcnVsZXM6IFt7XG4gICAgICAgICAgICAgICAgYXBwbHlTZXJ2ZXJTaWRlRW5jcnlwdGlvbkJ5RGVmYXVsdDoge1xuICAgICAgICAgICAgICAgICAgICBzc2VBbGdvcml0aG06IFwiQUVTMjU2XCIsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV1cbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgbmV3IGF3cy5zMy5CdWNrZXRWZXJzaW9uaW5nKG5hbWUsIHtcbiAgICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuYnVja2V0LFxuICAgICAgICAgICAgdmVyc2lvbmluZ0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICAgICAgICBzdGF0dXM6IFwiRW5hYmxlZFwiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgbmV3IGF3cy5zMy5CdWNrZXRMaWZlY3ljbGVDb25maWd1cmF0aW9uKG5hbWUsIHtcbiAgICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuYnVja2V0LFxuICAgICAgICAgICAgcnVsZXM6IFt7XG4gICAgICAgICAgICAgICAgaWQ6IFwiZGVsZXRlT2xkVmVyc2lvbnNcIixcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdFbmFibGVkJyxcbiAgICAgICAgICAgICAgICBub25jdXJyZW50VmVyc2lvbkV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgbm9uY3VycmVudERheXM6IDkwLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1dXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIC8vIFRPRE8gYmxvY2sgYWxsIHB1YmxpYyBhY2Nlc3NcbiAgICAgICAgdGhpcy5wdWJsaWNBY2Nlc3MgPSBuZXcgYXdzLnMzLkJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrKG5hbWUsIHtcbiAgICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgICBibG9ja1B1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgICAgICBpZ25vcmVQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgUzNGb2xkZXIgdGhhdCBjb250YWlucyBhIGJ1aWxkIGFydGlmYWN0IGluIFMzLlxuICAgICAqL1xuICAgIGdldEFydGlmYWN0KGFydGlmYWN0TmFtZTogcHVsdW1pLklucHV0PHN0cmluZz4sIHZlcnNpb246IHB1bHVtaS5JbnB1dDxzdHJpbmc+KTogUzNGb2xkZXIge1xuICAgICAgICBjb25zdCBwYXRoID0gcHVsdW1pLmludGVycG9sYXRlYCR7YXJ0aWZhY3ROYW1lfS8ke3ZlcnNpb259YDtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Rm9sZGVyQnlQYXRoKHBhdGgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0Rm9sZGVyQnlQYXRoKHBhdGg6IHB1bHVtaS5JbnB1dDxzdHJpbmc+KTogUzNGb2xkZXIge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldCxcbiAgICAgICAgICAgIHBhdGg6IHBhdGgsXG4gICAgICAgICAgICBhZGRCdWNrZXRQb2xpY3lTdGF0ZW1lbnQ6IChzdGF0ZW1lbnQpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZFBvbGljeVN0YXRlbWVudChzdGF0ZW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFkZFBvbGljeVN0YXRlbWVudChzdGF0ZW1lbnQ6IGF3cy5pYW0uUG9saWN5U3RhdGVtZW50KSB7XG4gICAgICAgIGlmICghdGhpcy5hbGxvd0FkZFBvbGljeVN0YXRlbWVudHMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm90IGFsbG93ZWQgdG8gYWRkIHBvbGljaWVzIC0gY3JlYXRlQnVja2V0UG9saWN5IGhhcyBhbHJlYWR5IGJlZW4gY2FsbGVkYCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wb2xpY3lTdGF0ZW1lbnRzLnB1c2goc3RhdGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYnVja2V0IHJlc291cmNlIHBvbGljeSBmb3IgdGhlIGFkZGVkIHBvbGljeSBzdGF0ZW1lbnRzLlxuICAgICAqL1xuICAgIGNyZWF0ZUJ1Y2tldFBvbGljeSgpIHtcbiAgICAgICAgdGhpcy5hbGxvd0FkZFBvbGljeVN0YXRlbWVudHMgPSBmYWxzZTtcblxuICAgICAgICBpZiAodGhpcy5wb2xpY3lTdGF0ZW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG5ldyBhd3MuczMuQnVja2V0UG9saWN5KHRoaXMubmFtZSwge1xuICAgICAgICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgICAgICAgcG9saWN5OiB7XG4gICAgICAgICAgICAgICAgICAgIFZlcnNpb246IFwiMjAxMi0xMC0xN1wiLFxuICAgICAgICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IHRoaXMucG9saWN5U3RhdGVtZW50cyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHBhcmVudDogdGhpcyxcbiAgICAgICAgICAgICAgICBkZXBlbmRzT246IFt0aGlzLnB1YmxpY0FjY2Vzc11cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0QnVja2V0TmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYnVja2V0LmJ1Y2tldDtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUzNBcnRpZmFjdFN0b3JlQXJncyB7XG4gICAgcmVhZG9ubHkgYXJ0aWZhY3ROYW1lPzogc3RyaW5nO1xufVxuIl19