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
exports.CloudfrontLogBucket = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const pulumi_1 = require("@pulumi/pulumi");
const util_1 = require("../util");
/**
 * Creates a S3 bucket to store CloudFront standard logs.
 * On deletion the bucket's content will be deleted too, so configure it as 'protected' or 'retainOnDelete' if necessary.
 */
class CloudfrontLogBucket extends pulumi_1.ComponentResource {
    constructor(name, args, opts) {
        super("pat:website:CloudfrontLogBucket", name, args, opts);
        const bucket = new aws.s3.Bucket(name, {
            forceDestroy: true,
        }, {
            parent: this,
            protect: opts === null || opts === void 0 ? void 0 : opts.protect,
            retainOnDelete: opts === null || opts === void 0 ? void 0 : opts.retainOnDelete,
        });
        const encryption = new aws.s3.BucketServerSideEncryptionConfiguration(name, {
            bucket: bucket.bucket,
            rules: [{
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: "AES256",
                    }
                }]
        }, { parent: this });
        const publicAccess = new aws.s3.BucketPublicAccessBlock(name, {
            bucket: bucket.id,
        }, { parent: this });
        const ownershipControls = new aws.s3.BucketOwnershipControls(name, {
            bucket: bucket.id,
            rule: {
                objectOwnership: "BucketOwnerPreferred",
            },
        }, { parent: this });
        const currentUser = aws.s3.getCanonicalUserId({}).then(currentUser => currentUser.id);
        const awslogsdeliveryUserId = "c4c1ede66af53448b93c283ce9448c4ba468c9432aa01d700d3878632f77d2d0";
        const acl = new aws.s3.BucketAcl(name, {
            bucket: bucket.id,
            accessControlPolicy: {
                grants: [
                    {
                        grantee: {
                            type: "CanonicalUser",
                            id: currentUser,
                        },
                        permission: "FULL_CONTROL"
                    },
                    {
                        grantee: {
                            type: "CanonicalUser",
                            id: awslogsdeliveryUserId,
                        },
                        permission: "FULL_CONTROL"
                    },
                ],
                owner: {
                    id: currentUser,
                },
            }
        }, {
            parent: this,
            dependsOn: [encryption, publicAccess, ownershipControls]
        });
        // make bucketRegionalDomainName depend on the ACL and wait a bit - otherwise a CloudFront dist may fail to create with "bucket ... does not enable ACL access" error
        this.bucketRegionalDomainName = pulumi.all([bucket, acl]).apply(x => (0, util_1.delayedOutput)(x[0].bucketRegionalDomainName, 10000));
    }
}
exports.CloudfrontLogBucket = CloudfrontLogBucket;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xvdWRmcm9udExvZ0J1Y2tldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJzaXRlL0Nsb3VkZnJvbnRMb2dCdWNrZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLDJDQUE2RTtBQUM3RSxrQ0FBd0M7QUFFeEM7OztHQUdHO0FBQ0gsTUFBYSxtQkFBb0IsU0FBUSwwQkFBaUI7SUFHdEQsWUFBWSxJQUFZLEVBQUUsSUFBNkIsRUFBRSxJQUErQjtRQUNwRixLQUFLLENBQUMsaUNBQWlDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUUzRCxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRTtZQUNuQyxZQUFZLEVBQUUsSUFBSTtTQUNyQixFQUFFO1lBQ0MsTUFBTSxFQUFFLElBQUk7WUFDWixPQUFPLEVBQUUsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLE9BQU87WUFDdEIsY0FBYyxFQUFFLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxjQUFjO1NBQ3ZDLENBQUMsQ0FBQztRQUVILE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyx1Q0FBdUMsQ0FBQyxJQUFJLEVBQUU7WUFDeEUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO1lBQ3JCLEtBQUssRUFBRSxDQUFDO29CQUNKLGtDQUFrQyxFQUFFO3dCQUNoQyxZQUFZLEVBQUUsUUFBUTtxQkFDekI7aUJBQ0osQ0FBQztTQUNMLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVyQixNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFO1lBQzFELE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRTtTQUNwQixFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFFckIsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFO1lBQy9ELE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRTtZQUNqQixJQUFJLEVBQUU7Z0JBQ0YsZUFBZSxFQUFFLHNCQUFzQjthQUMxQztTQUNKLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVyQixNQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN0RixNQUFNLHFCQUFxQixHQUFHLGtFQUFrRSxDQUFDO1FBRWpHLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFO1lBQ25DLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRTtZQUNqQixtQkFBbUIsRUFBRTtnQkFDakIsTUFBTSxFQUFFO29CQUNKO3dCQUNJLE9BQU8sRUFBRTs0QkFDTCxJQUFJLEVBQUUsZUFBZTs0QkFDckIsRUFBRSxFQUFFLFdBQVc7eUJBQ2xCO3dCQUNELFVBQVUsRUFBRSxjQUFjO3FCQUM3QjtvQkFDRDt3QkFDSSxPQUFPLEVBQUU7NEJBQ0wsSUFBSSxFQUFFLGVBQWU7NEJBQ3JCLEVBQUUsRUFBRSxxQkFBcUI7eUJBQzVCO3dCQUNELFVBQVUsRUFBRSxjQUFjO3FCQUM3QjtpQkFDSjtnQkFDRCxLQUFLLEVBQUU7b0JBQ0gsRUFBRSxFQUFFLFdBQVc7aUJBQ2xCO2FBQ0o7U0FDSixFQUFFO1lBQ0MsTUFBTSxFQUFFLElBQUk7WUFDWixTQUFTLEVBQUUsQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLGlCQUFpQixDQUFDO1NBQzNELENBQUMsQ0FBQztRQUVILHFLQUFxSztRQUNySyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUEsb0JBQWEsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsd0JBQXdCLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUM5SCxDQUFDO0NBQ0o7QUFwRUQsa0RBb0VDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXdzIGZyb20gXCJAcHVsdW1pL2F3c1wiO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuaW1wb3J0IHsgQ29tcG9uZW50UmVzb3VyY2UsIENvbXBvbmVudFJlc291cmNlT3B0aW9ucyB9IGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuaW1wb3J0IHsgZGVsYXllZE91dHB1dCB9IGZyb20gXCIuLi91dGlsXCI7XG5cbi8qKlxuICogQ3JlYXRlcyBhIFMzIGJ1Y2tldCB0byBzdG9yZSBDbG91ZEZyb250IHN0YW5kYXJkIGxvZ3MuXG4gKiBPbiBkZWxldGlvbiB0aGUgYnVja2V0J3MgY29udGVudCB3aWxsIGJlIGRlbGV0ZWQgdG9vLCBzbyBjb25maWd1cmUgaXQgYXMgJ3Byb3RlY3RlZCcgb3IgJ3JldGFpbk9uRGVsZXRlJyBpZiBuZWNlc3NhcnkuXG4gKi9cbmV4cG9ydCBjbGFzcyBDbG91ZGZyb250TG9nQnVja2V0IGV4dGVuZHMgQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHJlYWRvbmx5IGJ1Y2tldFJlZ2lvbmFsRG9tYWluTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBDbG91ZGZyb250TG9nQnVja2V0QXJncywgb3B0cz86IENvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcInBhdDp3ZWJzaXRlOkNsb3VkZnJvbnRMb2dCdWNrZXRcIiwgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICAgICAgY29uc3QgYnVja2V0ID0gbmV3IGF3cy5zMy5CdWNrZXQobmFtZSwge1xuICAgICAgICAgICAgZm9yY2VEZXN0cm95OiB0cnVlLFxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgICBwcm90ZWN0OiBvcHRzPy5wcm90ZWN0LFxuICAgICAgICAgICAgcmV0YWluT25EZWxldGU6IG9wdHM/LnJldGFpbk9uRGVsZXRlLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBlbmNyeXB0aW9uID0gbmV3IGF3cy5zMy5CdWNrZXRTZXJ2ZXJTaWRlRW5jcnlwdGlvbkNvbmZpZ3VyYXRpb24obmFtZSwge1xuICAgICAgICAgICAgYnVja2V0OiBidWNrZXQuYnVja2V0LFxuICAgICAgICAgICAgcnVsZXM6IFt7XG4gICAgICAgICAgICAgICAgYXBwbHlTZXJ2ZXJTaWRlRW5jcnlwdGlvbkJ5RGVmYXVsdDoge1xuICAgICAgICAgICAgICAgICAgICBzc2VBbGdvcml0aG06IFwiQUVTMjU2XCIsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV1cbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgY29uc3QgcHVibGljQWNjZXNzID0gbmV3IGF3cy5zMy5CdWNrZXRQdWJsaWNBY2Nlc3NCbG9jayhuYW1lLCB7XG4gICAgICAgICAgICBidWNrZXQ6IGJ1Y2tldC5pZCxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgY29uc3Qgb3duZXJzaGlwQ29udHJvbHMgPSBuZXcgYXdzLnMzLkJ1Y2tldE93bmVyc2hpcENvbnRyb2xzKG5hbWUsIHtcbiAgICAgICAgICAgIGJ1Y2tldDogYnVja2V0LmlkLFxuICAgICAgICAgICAgcnVsZToge1xuICAgICAgICAgICAgICAgIG9iamVjdE93bmVyc2hpcDogXCJCdWNrZXRPd25lclByZWZlcnJlZFwiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgY29uc3QgY3VycmVudFVzZXIgPSBhd3MuczMuZ2V0Q2Fub25pY2FsVXNlcklkKHt9KS50aGVuKGN1cnJlbnRVc2VyID0+IGN1cnJlbnRVc2VyLmlkKTtcbiAgICAgICAgY29uc3QgYXdzbG9nc2RlbGl2ZXJ5VXNlcklkID0gXCJjNGMxZWRlNjZhZjUzNDQ4YjkzYzI4M2NlOTQ0OGM0YmE0NjhjOTQzMmFhMDFkNzAwZDM4Nzg2MzJmNzdkMmQwXCI7XG5cbiAgICAgICAgY29uc3QgYWNsID0gbmV3IGF3cy5zMy5CdWNrZXRBY2wobmFtZSwge1xuICAgICAgICAgICAgYnVja2V0OiBidWNrZXQuaWQsXG4gICAgICAgICAgICBhY2Nlc3NDb250cm9sUG9saWN5OiB7XG4gICAgICAgICAgICAgICAgZ3JhbnRzOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyYW50ZWU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkNhbm9uaWNhbFVzZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogY3VycmVudFVzZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcGVybWlzc2lvbjogXCJGVUxMX0NPTlRST0xcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBncmFudGVlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJDYW5vbmljYWxVc2VyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGF3c2xvZ3NkZWxpdmVyeVVzZXJJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwZXJtaXNzaW9uOiBcIkZVTExfQ09OVFJPTFwiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBvd25lcjoge1xuICAgICAgICAgICAgICAgICAgICBpZDogY3VycmVudFVzZXIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcGFyZW50OiB0aGlzLFxuICAgICAgICAgICAgZGVwZW5kc09uOiBbZW5jcnlwdGlvbiwgcHVibGljQWNjZXNzLCBvd25lcnNoaXBDb250cm9sc11cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gbWFrZSBidWNrZXRSZWdpb25hbERvbWFpbk5hbWUgZGVwZW5kIG9uIHRoZSBBQ0wgYW5kIHdhaXQgYSBiaXQgLSBvdGhlcndpc2UgYSBDbG91ZEZyb250IGRpc3QgbWF5IGZhaWwgdG8gY3JlYXRlIHdpdGggXCJidWNrZXQgLi4uIGRvZXMgbm90IGVuYWJsZSBBQ0wgYWNjZXNzXCIgZXJyb3JcbiAgICAgICAgdGhpcy5idWNrZXRSZWdpb25hbERvbWFpbk5hbWUgPSBwdWx1bWkuYWxsKFtidWNrZXQsIGFjbF0pLmFwcGx5KHggPT4gZGVsYXllZE91dHB1dCh4WzBdLmJ1Y2tldFJlZ2lvbmFsRG9tYWluTmFtZSwgMTAwMDApKTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2xvdWRmcm9udExvZ0J1Y2tldEFyZ3Mge1xufVxuIl19