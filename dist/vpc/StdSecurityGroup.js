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
exports.StdSecurityGroup = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi_1 = require("@pulumi/pulumi");
/**
 * A simple security group for many standard cases.
 */
class StdSecurityGroup extends pulumi_1.ComponentResource {
    constructor(name, args, opts) {
        super("pat:vpc:StdSecurityGroup", name, args, opts);
        this.name = name;
        const sg = new aws.ec2.SecurityGroup(name, {
            vpcId: args.vpc.vpcId,
            description: name,
        }, { parent: this });
        this.securityGroupId = sg.id;
        for (const port of args.ingressPorts) {
            new aws.vpc.SecurityGroupIngressRule(`${name}-ipv4-${port}`, {
                securityGroupId: sg.id,
                ipProtocol: "tcp",
                fromPort: port,
                toPort: port,
                cidrIpv4: args.publicIngress ? "0.0.0.0/0" : args.vpc.cidrIpv4,
            }, { parent: this });
            new aws.vpc.SecurityGroupIngressRule(`${name}-ipv6-${port}`, {
                securityGroupId: sg.id,
                ipProtocol: "tcp",
                fromPort: port,
                toPort: port,
                cidrIpv6: args.publicIngress ? "::/0" : args.vpc.cidrIpv6,
            }, { parent: this });
        }
        new aws.vpc.SecurityGroupEgressRule(`${name}-ipv4`, {
            securityGroupId: sg.id,
            ipProtocol: "tcp",
            fromPort: 0,
            toPort: 65535,
            cidrIpv4: "0.0.0.0/0",
        }, { parent: this });
        new aws.vpc.SecurityGroupEgressRule(`${name}-ipv6`, {
            securityGroupId: sg.id,
            ipProtocol: "tcp",
            fromPort: 0,
            toPort: 65535,
            cidrIpv6: "::/0",
        }, { parent: this });
    }
}
exports.StdSecurityGroup = StdSecurityGroup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3RkU2VjdXJpdHlHcm91cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy92cGMvU3RkU2VjdXJpdHlHcm91cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQywyQ0FBcUY7QUFHckY7O0dBRUc7QUFDSCxNQUFhLGdCQUFpQixTQUFRLDBCQUFpQjtJQUluRCxZQUFZLElBQVksRUFBRSxJQUEwQixFQUFFLElBQStCO1FBQ2pGLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3BELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBRWpCLE1BQU0sRUFBRSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFO1lBQ3ZDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUs7WUFDckIsV0FBVyxFQUFFLElBQUk7U0FDcEIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxlQUFlLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUU3QixLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNuQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsR0FBRyxJQUFJLFNBQVMsSUFBSSxFQUFFLEVBQUU7Z0JBQ3pELGVBQWUsRUFBRSxFQUFFLENBQUMsRUFBRTtnQkFDdEIsVUFBVSxFQUFFLEtBQUs7Z0JBQ2pCLFFBQVEsRUFBRSxJQUFJO2dCQUNkLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFFBQVEsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUTthQUNqRSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFckIsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLEdBQUcsSUFBSSxTQUFTLElBQUksRUFBRSxFQUFFO2dCQUN6RCxlQUFlLEVBQUUsRUFBRSxDQUFDLEVBQUU7Z0JBQ3RCLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixRQUFRLEVBQUUsSUFBSTtnQkFDZCxNQUFNLEVBQUUsSUFBSTtnQkFDWixRQUFRLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVE7YUFDNUQsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsR0FBRyxJQUFJLE9BQU8sRUFBRTtZQUNoRCxlQUFlLEVBQUUsRUFBRSxDQUFDLEVBQUU7WUFDdEIsVUFBVSxFQUFFLEtBQUs7WUFDakIsUUFBUSxFQUFFLENBQUM7WUFDWCxNQUFNLEVBQUUsS0FBSztZQUNiLFFBQVEsRUFBRSxXQUFXO1NBQ3hCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVyQixJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsR0FBRyxJQUFJLE9BQU8sRUFBRTtZQUNoRCxlQUFlLEVBQUUsRUFBRSxDQUFDLEVBQUU7WUFDdEIsVUFBVSxFQUFFLEtBQUs7WUFDakIsUUFBUSxFQUFFLENBQUM7WUFDWCxNQUFNLEVBQUUsS0FBSztZQUNiLFFBQVEsRUFBRSxNQUFNO1NBQ25CLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUN6QixDQUFDO0NBQ0o7QUFoREQsNENBZ0RDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXdzIGZyb20gXCJAcHVsdW1pL2F3c1wiO1xuaW1wb3J0IHsgQ29tcG9uZW50UmVzb3VyY2UsIENvbXBvbmVudFJlc291cmNlT3B0aW9ucywgT3V0cHV0IH0gZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5pbXBvcnQgeyBJVnBjIH0gZnJvbSBcIi4vVnBjXCI7XG5cbi8qKlxuICogQSBzaW1wbGUgc2VjdXJpdHkgZ3JvdXAgZm9yIG1hbnkgc3RhbmRhcmQgY2FzZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBTdGRTZWN1cml0eUdyb3VwIGV4dGVuZHMgQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgICByZWFkb25seSBzZWN1cml0eUdyb3VwSWQ6IE91dHB1dDxzdHJpbmc+O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBTdGRTZWN1cml0eUdyb3VwQXJncywgb3B0cz86IENvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcInBhdDp2cGM6U3RkU2VjdXJpdHlHcm91cFwiLCBuYW1lLCBhcmdzLCBvcHRzKTtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcblxuICAgICAgICBjb25zdCBzZyA9IG5ldyBhd3MuZWMyLlNlY3VyaXR5R3JvdXAobmFtZSwge1xuICAgICAgICAgICAgdnBjSWQ6IGFyZ3MudnBjLnZwY0lkLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IG5hbWUsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuICAgICAgICB0aGlzLnNlY3VyaXR5R3JvdXBJZCA9IHNnLmlkO1xuXG4gICAgICAgIGZvciAoY29uc3QgcG9ydCBvZiBhcmdzLmluZ3Jlc3NQb3J0cykge1xuICAgICAgICAgICAgbmV3IGF3cy52cGMuU2VjdXJpdHlHcm91cEluZ3Jlc3NSdWxlKGAke25hbWV9LWlwdjQtJHtwb3J0fWAsIHtcbiAgICAgICAgICAgICAgICBzZWN1cml0eUdyb3VwSWQ6IHNnLmlkLFxuICAgICAgICAgICAgICAgIGlwUHJvdG9jb2w6IFwidGNwXCIsXG4gICAgICAgICAgICAgICAgZnJvbVBvcnQ6IHBvcnQsXG4gICAgICAgICAgICAgICAgdG9Qb3J0OiBwb3J0LFxuICAgICAgICAgICAgICAgIGNpZHJJcHY0OiBhcmdzLnB1YmxpY0luZ3Jlc3MgPyBcIjAuMC4wLjAvMFwiIDogYXJncy52cGMuY2lkcklwdjQsXG4gICAgICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICAgICAgbmV3IGF3cy52cGMuU2VjdXJpdHlHcm91cEluZ3Jlc3NSdWxlKGAke25hbWV9LWlwdjYtJHtwb3J0fWAsIHtcbiAgICAgICAgICAgICAgICBzZWN1cml0eUdyb3VwSWQ6IHNnLmlkLFxuICAgICAgICAgICAgICAgIGlwUHJvdG9jb2w6IFwidGNwXCIsXG4gICAgICAgICAgICAgICAgZnJvbVBvcnQ6IHBvcnQsXG4gICAgICAgICAgICAgICAgdG9Qb3J0OiBwb3J0LFxuICAgICAgICAgICAgICAgIGNpZHJJcHY2OiBhcmdzLnB1YmxpY0luZ3Jlc3MgPyBcIjo6LzBcIiA6IGFyZ3MudnBjLmNpZHJJcHY2LFxuICAgICAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBuZXcgYXdzLnZwYy5TZWN1cml0eUdyb3VwRWdyZXNzUnVsZShgJHtuYW1lfS1pcHY0YCwge1xuICAgICAgICAgICAgc2VjdXJpdHlHcm91cElkOiBzZy5pZCxcbiAgICAgICAgICAgIGlwUHJvdG9jb2w6IFwidGNwXCIsXG4gICAgICAgICAgICBmcm9tUG9ydDogMCxcbiAgICAgICAgICAgIHRvUG9ydDogNjU1MzUsXG4gICAgICAgICAgICBjaWRySXB2NDogXCIwLjAuMC4wLzBcIixcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgbmV3IGF3cy52cGMuU2VjdXJpdHlHcm91cEVncmVzc1J1bGUoYCR7bmFtZX0taXB2NmAsIHtcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBJZDogc2cuaWQsXG4gICAgICAgICAgICBpcFByb3RvY29sOiBcInRjcFwiLFxuICAgICAgICAgICAgZnJvbVBvcnQ6IDAsXG4gICAgICAgICAgICB0b1BvcnQ6IDY1NTM1LFxuICAgICAgICAgICAgY2lkcklwdjY6IFwiOjovMFwiLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RkU2VjdXJpdHlHcm91cEFyZ3Mge1xuICAgIHJlYWRvbmx5IGluZ3Jlc3NQb3J0czogbnVtYmVyW107XG4gICAgcmVhZG9ubHkgcHVibGljSW5ncmVzczogYm9vbGVhbjtcbiAgICByZWFkb25seSB2cGM6IElWcGM7XG59XG4iXX0=