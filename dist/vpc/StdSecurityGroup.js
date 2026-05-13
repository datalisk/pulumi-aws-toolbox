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
 * A simple security group that
 * - allows ingress on the specified ports from either the public internet or the VPC CIDR block
 * - allows all egress traffic to any destination
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3RkU2VjdXJpdHlHcm91cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy92cGMvU3RkU2VjdXJpdHlHcm91cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQywyQ0FBcUY7QUFHckY7Ozs7R0FJRztBQUNILE1BQWEsZ0JBQWlCLFNBQVEsMEJBQWlCO0lBSW5ELFlBQVksSUFBWSxFQUFFLElBQTBCLEVBQUUsSUFBK0I7UUFDakYsS0FBSyxDQUFDLDBCQUEwQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFFakIsTUFBTSxFQUFFLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUU7WUFDdkMsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSztZQUNyQixXQUFXLEVBQUUsSUFBSTtTQUNwQixFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDckIsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBRTdCLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ25DLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLElBQUksU0FBUyxJQUFJLEVBQUUsRUFBRTtnQkFDekQsZUFBZSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2dCQUN0QixVQUFVLEVBQUUsS0FBSztnQkFDakIsUUFBUSxFQUFFLElBQUk7Z0JBQ2QsTUFBTSxFQUFFLElBQUk7Z0JBQ1osUUFBUSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRO2FBQ2pFLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUVyQixJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsR0FBRyxJQUFJLFNBQVMsSUFBSSxFQUFFLEVBQUU7Z0JBQ3pELGVBQWUsRUFBRSxFQUFFLENBQUMsRUFBRTtnQkFDdEIsVUFBVSxFQUFFLEtBQUs7Z0JBQ2pCLFFBQVEsRUFBRSxJQUFJO2dCQUNkLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFFBQVEsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUTthQUM1RCxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDekIsQ0FBQztRQUVELElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLElBQUksT0FBTyxFQUFFO1lBQ2hELGVBQWUsRUFBRSxFQUFFLENBQUMsRUFBRTtZQUN0QixVQUFVLEVBQUUsS0FBSztZQUNqQixRQUFRLEVBQUUsQ0FBQztZQUNYLE1BQU0sRUFBRSxLQUFLO1lBQ2IsUUFBUSxFQUFFLFdBQVc7U0FDeEIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXJCLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLElBQUksT0FBTyxFQUFFO1lBQ2hELGVBQWUsRUFBRSxFQUFFLENBQUMsRUFBRTtZQUN0QixVQUFVLEVBQUUsS0FBSztZQUNqQixRQUFRLEVBQUUsQ0FBQztZQUNYLE1BQU0sRUFBRSxLQUFLO1lBQ2IsUUFBUSxFQUFFLE1BQU07U0FDbkIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3pCLENBQUM7Q0FDSjtBQWhERCw0Q0FnREMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSBcIkBwdWx1bWkvYXdzXCI7XG5pbXBvcnQgeyBDb21wb25lbnRSZXNvdXJjZSwgQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zLCBPdXRwdXQgfSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcbmltcG9ydCB7IElWcGMgfSBmcm9tIFwiLi9WcGNcIjtcblxuLyoqXG4gKiBBIHNpbXBsZSBzZWN1cml0eSBncm91cCB0aGF0XG4gKiAtIGFsbG93cyBpbmdyZXNzIG9uIHRoZSBzcGVjaWZpZWQgcG9ydHMgZnJvbSBlaXRoZXIgdGhlIHB1YmxpYyBpbnRlcm5ldCBvciB0aGUgVlBDIENJRFIgYmxvY2tcbiAqIC0gYWxsb3dzIGFsbCBlZ3Jlc3MgdHJhZmZpYyB0byBhbnkgZGVzdGluYXRpb25cbiAqL1xuZXhwb3J0IGNsYXNzIFN0ZFNlY3VyaXR5R3JvdXAgZXh0ZW5kcyBDb21wb25lbnRSZXNvdXJjZSB7XG4gICAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICAgIHJlYWRvbmx5IHNlY3VyaXR5R3JvdXBJZDogT3V0cHV0PHN0cmluZz47XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFN0ZFNlY3VyaXR5R3JvdXBBcmdzLCBvcHRzPzogQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwicGF0OnZwYzpTdGRTZWN1cml0eUdyb3VwXCIsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuXG4gICAgICAgIGNvbnN0IHNnID0gbmV3IGF3cy5lYzIuU2VjdXJpdHlHcm91cChuYW1lLCB7XG4gICAgICAgICAgICB2cGNJZDogYXJncy52cGMudnBjSWQsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogbmFtZSxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG4gICAgICAgIHRoaXMuc2VjdXJpdHlHcm91cElkID0gc2cuaWQ7XG5cbiAgICAgICAgZm9yIChjb25zdCBwb3J0IG9mIGFyZ3MuaW5ncmVzc1BvcnRzKSB7XG4gICAgICAgICAgICBuZXcgYXdzLnZwYy5TZWN1cml0eUdyb3VwSW5ncmVzc1J1bGUoYCR7bmFtZX0taXB2NC0ke3BvcnR9YCwge1xuICAgICAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBJZDogc2cuaWQsXG4gICAgICAgICAgICAgICAgaXBQcm90b2NvbDogXCJ0Y3BcIixcbiAgICAgICAgICAgICAgICBmcm9tUG9ydDogcG9ydCxcbiAgICAgICAgICAgICAgICB0b1BvcnQ6IHBvcnQsXG4gICAgICAgICAgICAgICAgY2lkcklwdjQ6IGFyZ3MucHVibGljSW5ncmVzcyA/IFwiMC4wLjAuMC8wXCIgOiBhcmdzLnZwYy5jaWRySXB2NCxcbiAgICAgICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgICAgICBuZXcgYXdzLnZwYy5TZWN1cml0eUdyb3VwSW5ncmVzc1J1bGUoYCR7bmFtZX0taXB2Ni0ke3BvcnR9YCwge1xuICAgICAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBJZDogc2cuaWQsXG4gICAgICAgICAgICAgICAgaXBQcm90b2NvbDogXCJ0Y3BcIixcbiAgICAgICAgICAgICAgICBmcm9tUG9ydDogcG9ydCxcbiAgICAgICAgICAgICAgICB0b1BvcnQ6IHBvcnQsXG4gICAgICAgICAgICAgICAgY2lkcklwdjY6IGFyZ3MucHVibGljSW5ncmVzcyA/IFwiOjovMFwiIDogYXJncy52cGMuY2lkcklwdjYsXG4gICAgICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5ldyBhd3MudnBjLlNlY3VyaXR5R3JvdXBFZ3Jlc3NSdWxlKGAke25hbWV9LWlwdjRgLCB7XG4gICAgICAgICAgICBzZWN1cml0eUdyb3VwSWQ6IHNnLmlkLFxuICAgICAgICAgICAgaXBQcm90b2NvbDogXCJ0Y3BcIixcbiAgICAgICAgICAgIGZyb21Qb3J0OiAwLFxuICAgICAgICAgICAgdG9Qb3J0OiA2NTUzNSxcbiAgICAgICAgICAgIGNpZHJJcHY0OiBcIjAuMC4wLjAvMFwiLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICBuZXcgYXdzLnZwYy5TZWN1cml0eUdyb3VwRWdyZXNzUnVsZShgJHtuYW1lfS1pcHY2YCwge1xuICAgICAgICAgICAgc2VjdXJpdHlHcm91cElkOiBzZy5pZCxcbiAgICAgICAgICAgIGlwUHJvdG9jb2w6IFwidGNwXCIsXG4gICAgICAgICAgICBmcm9tUG9ydDogMCxcbiAgICAgICAgICAgIHRvUG9ydDogNjU1MzUsXG4gICAgICAgICAgICBjaWRySXB2NjogXCI6Oi8wXCIsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdGRTZWN1cml0eUdyb3VwQXJncyB7XG4gICAgcmVhZG9ubHkgaW5ncmVzc1BvcnRzOiBudW1iZXJbXTtcbiAgICByZWFkb25seSBwdWJsaWNJbmdyZXNzOiBib29sZWFuO1xuICAgIHJlYWRvbmx5IHZwYzogSVZwYztcbn1cbiJdfQ==