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
exports.Builder = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const iam_1 = require("../util/iam");
const vpc_1 = require("../vpc");
/**
 * Builer that makes it easier to create a AWS Lambda.
 * Can be used to create a log group, role, and VPC config that can be used to construct the actual lambda function.
 */
class Builder {
    constructor(name, args, opts) {
        this.name = name;
        this.args = args;
        this.opts = opts;
    }
    createLogGroup() {
        return new aws.cloudwatch.LogGroup(this.name, {
            name: pulumi.interpolate `/aws/lambda/${this.name}`,
            retentionInDays: 365,
        }, this.opts);
    }
    createRole() {
        var _a, _b;
        const role = new aws.iam.Role(`${this.name}-execute`, {
            assumeRolePolicy: (0, iam_1.assumeRolePolicyForAwsService)("lambda"),
        }, this.opts);
        // attach execution policy for VPC and logging
        if (this.args.vpc != undefined) {
            new aws.iam.RolePolicyAttachment(`${this.name}-execute`, {
                role: role,
                policyArn: aws.iam.ManagedPolicy.AWSLambdaVPCAccessExecutionRole,
            }, this.opts);
        }
        else {
            new aws.iam.RolePolicyAttachment(`${this.name}-execute`, {
                role: role,
                policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
            }, this.opts);
        }
        // create user policies - not using 'inlinePolicies' property because removal behavior is exteremly suprising
        (_a = this.args.roleManagedPolicies) === null || _a === void 0 ? void 0 : _a.forEach((policyArn, index) => {
            new aws.iam.RolePolicyAttachment(`${this.name}-${index}`, {
                role: role,
                policyArn,
            }, this.opts);
        });
        (_b = this.args.roleInlinePolicies) === null || _b === void 0 ? void 0 : _b.forEach(inlinePolicy => {
            new aws.iam.RolePolicy(`${this.name}-${inlinePolicy.name}`, {
                role: role,
                policy: inlinePolicy.policy,
            }, this.opts);
        });
        return role;
    }
    createVpcConfig() {
        if (this.args.vpc != undefined) {
            const sg = new vpc_1.StdSecurityGroup(this.name, {
                vpc: this.args.vpc,
                ingressPorts: [],
                publicIngress: false,
            });
            return {
                subnetIds: this.args.vpc.privateSubnetIds,
                securityGroupIds: [sg.securityGroupId],
                ipv6AllowedForDualStack: true,
            };
        }
        else {
            return undefined;
        }
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQnVpbGRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9sYW1iZGEvQnVpbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFFekMscUNBQTREO0FBQzVELGdDQUFnRDtBQUVoRDs7O0dBR0c7QUFDSCxNQUFhLE9BQU87SUFLaEIsWUFBWSxJQUFZLEVBQUUsSUFBb0IsRUFBRSxJQUErQjtRQUMzRSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUNyQixDQUFDO0lBRUQsY0FBYztRQUNWLE9BQU8sSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQzFDLElBQUksRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFBLGVBQWUsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNsRCxlQUFlLEVBQUUsR0FBRztTQUN2QixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsQixDQUFDO0lBRUQsVUFBVTs7UUFDTixNQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksVUFBVSxFQUFFO1lBQ2xELGdCQUFnQixFQUFFLElBQUEsbUNBQTZCLEVBQUMsUUFBUSxDQUFDO1NBQzVELEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWQsOENBQThDO1FBQzlDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7WUFDN0IsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksVUFBVSxFQUFFO2dCQUNyRCxJQUFJLEVBQUUsSUFBSTtnQkFDVixTQUFTLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsK0JBQStCO2FBQ25FLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xCLENBQUM7YUFBTSxDQUFDO1lBQ0osSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksVUFBVSxFQUFFO2dCQUNyRCxJQUFJLEVBQUUsSUFBSTtnQkFDVixTQUFTLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsMkJBQTJCO2FBQy9ELEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xCLENBQUM7UUFFRCw2R0FBNkc7UUFDN0csTUFBQSxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQiwwQ0FBRSxPQUFPLENBQUMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDeEQsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLEVBQUUsRUFBRTtnQkFDdEQsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsU0FBUzthQUNaLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBQSxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQiwwQ0FBRSxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDakQsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUN4RCxJQUFJLEVBQUUsSUFBSTtnQkFDVixNQUFNLEVBQUUsWUFBWSxDQUFDLE1BQU07YUFDOUIsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEIsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsZUFBZTtRQUNYLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7WUFDN0IsTUFBTSxFQUFFLEdBQUcsSUFBSSxzQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO2dCQUN2QyxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHO2dCQUNsQixZQUFZLEVBQUUsRUFBRTtnQkFDaEIsYUFBYSxFQUFFLEtBQUs7YUFDdkIsQ0FBQyxDQUFDO1lBRUgsT0FBTztnQkFDSCxTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCO2dCQUN6QyxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUM7Z0JBQ3RDLHVCQUF1QixFQUFFLElBQUk7YUFDaEMsQ0FBQztRQUNOLENBQUM7YUFBTSxDQUFDO1lBQ0osT0FBTyxTQUFTLENBQUM7UUFDckIsQ0FBQztJQUNMLENBQUM7Q0FDSjtBQXRFRCwwQkFzRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSBcIkBwdWx1bWkvYXdzXCI7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5pbXBvcnQgeyBDb21wb25lbnRSZXNvdXJjZU9wdGlvbnMgfSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcbmltcG9ydCB7IGFzc3VtZVJvbGVQb2xpY3lGb3JBd3NTZXJ2aWNlIH0gZnJvbSBcIi4uL3V0aWwvaWFtXCI7XG5pbXBvcnQgeyBJVnBjLCBTdGRTZWN1cml0eUdyb3VwIH0gZnJvbSBcIi4uL3ZwY1wiO1xuXG4vKipcbiAqIEJ1aWxlciB0aGF0IG1ha2VzIGl0IGVhc2llciB0byBjcmVhdGUgYSBBV1MgTGFtYmRhLlxuICogQ2FuIGJlIHVzZWQgdG8gY3JlYXRlIGEgbG9nIGdyb3VwLCByb2xlLCBhbmQgVlBDIGNvbmZpZyB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbnN0cnVjdCB0aGUgYWN0dWFsIGxhbWJkYSBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEJ1aWxkZXIge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBhcmdzOiBCYXNlTGFtYmRhQXJncztcbiAgICBvcHRzPzogQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBCYXNlTGFtYmRhQXJncywgb3B0cz86IENvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmFyZ3MgPSBhcmdzO1xuICAgICAgICB0aGlzLm9wdHMgPSBvcHRzO1xuICAgIH1cblxuICAgIGNyZWF0ZUxvZ0dyb3VwKCkge1xuICAgICAgICByZXR1cm4gbmV3IGF3cy5jbG91ZHdhdGNoLkxvZ0dyb3VwKHRoaXMubmFtZSwge1xuICAgICAgICAgICAgbmFtZTogcHVsdW1pLmludGVycG9sYXRlYC9hd3MvbGFtYmRhLyR7dGhpcy5uYW1lfWAsXG4gICAgICAgICAgICByZXRlbnRpb25JbkRheXM6IDM2NSxcbiAgICAgICAgfSwgdGhpcy5vcHRzKTtcbiAgICB9XG5cbiAgICBjcmVhdGVSb2xlKCkge1xuICAgICAgICBjb25zdCByb2xlID0gbmV3IGF3cy5pYW0uUm9sZShgJHt0aGlzLm5hbWV9LWV4ZWN1dGVgLCB7XG4gICAgICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBhc3N1bWVSb2xlUG9saWN5Rm9yQXdzU2VydmljZShcImxhbWJkYVwiKSxcbiAgICAgICAgfSwgdGhpcy5vcHRzKTtcblxuICAgICAgICAvLyBhdHRhY2ggZXhlY3V0aW9uIHBvbGljeSBmb3IgVlBDIGFuZCBsb2dnaW5nXG4gICAgICAgIGlmICh0aGlzLmFyZ3MudnBjICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbmV3IGF3cy5pYW0uUm9sZVBvbGljeUF0dGFjaG1lbnQoYCR7dGhpcy5uYW1lfS1leGVjdXRlYCwge1xuICAgICAgICAgICAgICAgIHJvbGU6IHJvbGUsXG4gICAgICAgICAgICAgICAgcG9saWN5QXJuOiBhd3MuaWFtLk1hbmFnZWRQb2xpY3kuQVdTTGFtYmRhVlBDQWNjZXNzRXhlY3V0aW9uUm9sZSxcbiAgICAgICAgICAgIH0sIHRoaXMub3B0cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXcgYXdzLmlhbS5Sb2xlUG9saWN5QXR0YWNobWVudChgJHt0aGlzLm5hbWV9LWV4ZWN1dGVgLCB7XG4gICAgICAgICAgICAgICAgcm9sZTogcm9sZSxcbiAgICAgICAgICAgICAgICBwb2xpY3lBcm46IGF3cy5pYW0uTWFuYWdlZFBvbGljeS5BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUsXG4gICAgICAgICAgICB9LCB0aGlzLm9wdHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY3JlYXRlIHVzZXIgcG9saWNpZXMgLSBub3QgdXNpbmcgJ2lubGluZVBvbGljaWVzJyBwcm9wZXJ0eSBiZWNhdXNlIHJlbW92YWwgYmVoYXZpb3IgaXMgZXh0ZXJlbWx5IHN1cHJpc2luZ1xuICAgICAgICB0aGlzLmFyZ3Mucm9sZU1hbmFnZWRQb2xpY2llcz8uZm9yRWFjaCgocG9saWN5QXJuLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgbmV3IGF3cy5pYW0uUm9sZVBvbGljeUF0dGFjaG1lbnQoYCR7dGhpcy5uYW1lfS0ke2luZGV4fWAsIHtcbiAgICAgICAgICAgICAgICByb2xlOiByb2xlLFxuICAgICAgICAgICAgICAgIHBvbGljeUFybixcbiAgICAgICAgICAgIH0sIHRoaXMub3B0cyk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmFyZ3Mucm9sZUlubGluZVBvbGljaWVzPy5mb3JFYWNoKGlubGluZVBvbGljeSA9PiB7XG4gICAgICAgICAgICBuZXcgYXdzLmlhbS5Sb2xlUG9saWN5KGAke3RoaXMubmFtZX0tJHtpbmxpbmVQb2xpY3kubmFtZX1gLCB7XG4gICAgICAgICAgICAgICAgcm9sZTogcm9sZSxcbiAgICAgICAgICAgICAgICBwb2xpY3k6IGlubGluZVBvbGljeS5wb2xpY3ksXG4gICAgICAgICAgICB9LCB0aGlzLm9wdHMpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcm9sZTtcbiAgICB9XG5cbiAgICBjcmVhdGVWcGNDb25maWcoKTogYXdzLnR5cGVzLmlucHV0LmxhbWJkYS5GdW5jdGlvblZwY0NvbmZpZyB8IHVuZGVmaW5lZCB7XG4gICAgICAgIGlmICh0aGlzLmFyZ3MudnBjICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc3Qgc2cgPSBuZXcgU3RkU2VjdXJpdHlHcm91cCh0aGlzLm5hbWUsIHtcbiAgICAgICAgICAgICAgICB2cGM6IHRoaXMuYXJncy52cGMsXG4gICAgICAgICAgICAgICAgaW5ncmVzc1BvcnRzOiBbXSxcbiAgICAgICAgICAgICAgICBwdWJsaWNJbmdyZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Ym5ldElkczogdGhpcy5hcmdzLnZwYy5wcml2YXRlU3VibmV0SWRzLFxuICAgICAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBJZHM6IFtzZy5zZWN1cml0eUdyb3VwSWRdLFxuICAgICAgICAgICAgICAgIGlwdjZBbGxvd2VkRm9yRHVhbFN0YWNrOiB0cnVlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmFzZUxhbWJkYUFyZ3Mge1xuICAgIC8qKlxuICAgICAqIElubGluZSBwb2xpY2llcyBmb3IgdGhlIExhbWJkYSBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICByb2xlSW5saW5lUG9saWNpZXM/OiBSb2xlSW5saW5lUG9saWN5W107XG5cbiAgICAvKipcbiAgICAgKiBBZGRpdGlvbmFsIG1hbmFnZWQgcG9saWN5cyBmb3IgdGhlIGxhbWJkYSBmdW5jdGlvbi5cbiAgICAgKiBQb2xpY2llcyB0byB3cml0ZSB0byB0aGUgQ2xvdWRXYXRjaCBsb2cgZ3JvdXAgYW5kIHRvIHVzZSB0aGUgVlBDIChpZiByZWxldmFudCkgYXJlIGFkZGVkIGF1dG9tYXRpY2FsbHkuXG4gICAgICovXG4gICAgcm9sZU1hbmFnZWRQb2xpY2llcz86IHN0cmluZ1tdO1xuXG4gICAgLyoqXG4gICAgICogSWYgc3BlY2lmaWVkLCB0aGUgTGFtYmRhIHdpbGwgYmUgY3JlYXRlZCB1c2luZyB0aGUgVlBDJ3MgcHJpdmF0ZSBzdWJuZXRzLlxuICAgICAqL1xuICAgIHZwYz86IElWcGM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUm9sZUlubGluZVBvbGljeSB7XG4gICAgLyoqXG4gICAgICogTmFtZSBvZiB0aGUgcm9sZSBwb2xpY3kuXG4gICAgICovXG4gICAgbmFtZTogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgLyoqXG4gICAgICogUG9saWN5IGRvY3VtZW50IGFzIGEgSlNPTiBmb3JtYXR0ZWQgc3RyaW5nLlxuICAgICAqL1xuICAgIHBvbGljeTogcHVsdW1pLklucHV0PHN0cmluZyB8IGF3cy5pYW0uUG9saWN5RG9jdW1lbnQ+O1xufVxuIl19