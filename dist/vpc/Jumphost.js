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
exports.Jumphost = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const StdSecurityGroup_1 = require("./StdSecurityGroup");
/**
 * Creates a jumphost EC2 instance.
 * The instance does not expose a public SSH port. Instead we use AWS EC2 Instance Connect (EIC) for a secure connection to the jumphost.
 */
class Jumphost extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super("pat:vpc:Jumphost", name, args, opts);
        const jumphostSubnetId = args.vpc.privateSubnetIds[0];
        const jumphostSg = new StdSecurityGroup_1.StdSecurityGroup(name, {
            vpc: args.vpc,
            ingressPorts: [],
            publicIngress: false,
        }, { parent: this });
        args.vpc.grantEicIngressFor(`${name}-eic`, jumphostSg.securityGroupId);
        const ami = pulumi.output(aws.ec2.getAmi({
            owners: ["amazon"],
            mostRecent: true,
            filters: [
                { name: "name", values: ["al2023-ami-2023.*"] },
                { name: "architecture", values: ["arm64"] },
            ],
        }));
        const instance = new aws.ec2.Instance(name, {
            ami: ami.id,
            instanceType: "t4g.nano",
            subnetId: jumphostSubnetId,
            vpcSecurityGroupIds: [jumphostSg.securityGroupId],
            tags: {
                Name: name,
            },
        }, { parent: this });
        this.instanceId = instance.id;
    }
}
exports.Jumphost = Jumphost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSnVtcGhvc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdnBjL0p1bXBob3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVEQUF5QztBQUN6Qyx5REFBc0Q7QUFHdEQ7OztHQUdHO0FBQ0gsTUFBYSxRQUFTLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUdsRCxZQUFZLElBQVksRUFBRSxJQUFrQixFQUFFLElBQXNDO1FBQ2hGLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTVDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV0RCxNQUFNLFVBQVUsR0FBRyxJQUFJLG1DQUFnQixDQUFDLElBQUksRUFBRTtZQUMxQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7WUFDYixZQUFZLEVBQUUsRUFBRTtZQUNoQixhQUFhLEVBQUUsS0FBSztTQUN2QixFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFFckIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLElBQUksTUFBTSxFQUFFLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUV2RSxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO1lBQ3JDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQztZQUNsQixVQUFVLEVBQUUsSUFBSTtZQUNoQixPQUFPLEVBQUU7Z0JBQ0wsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDLG1CQUFtQixDQUFDLEVBQUU7Z0JBQy9DLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRTthQUM5QztTQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUosTUFBTSxRQUFRLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUU7WUFDeEMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQ1gsWUFBWSxFQUFFLFVBQVU7WUFDeEIsUUFBUSxFQUFFLGdCQUFnQjtZQUMxQixtQkFBbUIsRUFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUM7WUFDakQsSUFBSSxFQUFFO2dCQUNGLElBQUksRUFBRSxJQUFJO2FBQ2I7U0FDSixFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDckIsSUFBSSxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUMsRUFBRSxDQUFDO0lBQ2xDLENBQUM7Q0FDSjtBQXBDRCw0QkFvQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSBcIkBwdWx1bWkvYXdzXCI7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5pbXBvcnQgeyBTdGRTZWN1cml0eUdyb3VwIH0gZnJvbSBcIi4vU3RkU2VjdXJpdHlHcm91cFwiO1xuaW1wb3J0IHsgVnBjIH0gZnJvbSBcIi4vVnBjXCI7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGp1bXBob3N0IEVDMiBpbnN0YW5jZS5cbiAqIFRoZSBpbnN0YW5jZSBkb2VzIG5vdCBleHBvc2UgYSBwdWJsaWMgU1NIIHBvcnQuIEluc3RlYWQgd2UgdXNlIEFXUyBFQzIgSW5zdGFuY2UgQ29ubmVjdCAoRUlDKSBmb3IgYSBzZWN1cmUgY29ubmVjdGlvbiB0byB0aGUganVtcGhvc3QuXG4gKi9cbmV4cG9ydCBjbGFzcyBKdW1waG9zdCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcmVhZG9ubHkgaW5zdGFuY2VJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBKdW1waG9zdEFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwicGF0OnZwYzpKdW1waG9zdFwiLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgICAgICBjb25zdCBqdW1waG9zdFN1Ym5ldElkID0gYXJncy52cGMucHJpdmF0ZVN1Ym5ldElkc1swXTtcblxuICAgICAgICBjb25zdCBqdW1waG9zdFNnID0gbmV3IFN0ZFNlY3VyaXR5R3JvdXAobmFtZSwge1xuICAgICAgICAgICAgdnBjOiBhcmdzLnZwYyxcbiAgICAgICAgICAgIGluZ3Jlc3NQb3J0czogW10sXG4gICAgICAgICAgICBwdWJsaWNJbmdyZXNzOiBmYWxzZSxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgYXJncy52cGMuZ3JhbnRFaWNJbmdyZXNzRm9yKGAke25hbWV9LWVpY2AsIGp1bXBob3N0U2cuc2VjdXJpdHlHcm91cElkKTtcblxuICAgICAgICBjb25zdCBhbWkgPSBwdWx1bWkub3V0cHV0KGF3cy5lYzIuZ2V0QW1pKHtcbiAgICAgICAgICAgIG93bmVyczogW1wiYW1hem9uXCJdLFxuICAgICAgICAgICAgbW9zdFJlY2VudDogdHJ1ZSxcbiAgICAgICAgICAgIGZpbHRlcnM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwibmFtZVwiLCB2YWx1ZXM6IFtcImFsMjAyMy1hbWktMjAyMy4qXCJdIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcImFyY2hpdGVjdHVyZVwiLCB2YWx1ZXM6IFtcImFybTY0XCJdIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KSk7XG5cbiAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgYXdzLmVjMi5JbnN0YW5jZShuYW1lLCB7XG4gICAgICAgICAgICBhbWk6IGFtaS5pZCxcbiAgICAgICAgICAgIGluc3RhbmNlVHlwZTogXCJ0NGcubmFub1wiLFxuICAgICAgICAgICAgc3VibmV0SWQ6IGp1bXBob3N0U3VibmV0SWQsXG4gICAgICAgICAgICB2cGNTZWN1cml0eUdyb3VwSWRzOiBbanVtcGhvc3RTZy5zZWN1cml0eUdyb3VwSWRdLFxuICAgICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgICAgIE5hbWU6IG5hbWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcbiAgICAgICAgdGhpcy5pbnN0YW5jZUlkID0gaW5zdGFuY2UuaWQ7XG4gICAgfVxufVxuXG5cbmV4cG9ydCBpbnRlcmZhY2UgSnVtcGhvc3RBcmdzIHtcbiAgICByZWFkb25seSB2cGM6IFZwYztcbn1cbiJdfQ==