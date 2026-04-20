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
exports.SesProxyMailer = void 0;
const aws = __importStar(require("@pulumi/aws"));
const lambda_1 = require("../lambda");
/**
 * Creates a AWS Lambda to send email using SES.
 *
 * It acts as a proxy for the SendRawEmail command, allowing you
 *  - to send email from a private subnet using IPv6 (SES doesn't support IPv6 yet)
 *  - to send email from a different account by assuming another role.
 *
 * You can control who can send email, by configuring who can invoke this lambda.
 * If 'assumeRoleArn' isn't specified the lambda can send email via any configured SES identity.
 */
class SesProxyMailer extends lambda_1.SimpleNodeLambda {
    constructor(name, args, opts) {
        var _a;
        super(name, {
            codeDir: `${__dirname}/../../resources/ses-proxy-mailer`,
            roleInlinePolicies: [
                ...(args.assumeRoleArn ? [{
                        name: "STS",
                        policy: {
                            Version: "2012-10-17",
                            Statement: [{
                                    Effect: "Allow",
                                    Action: ["sts:AssumeRole"],
                                    Resource: [args.assumeRoleArn]
                                }]
                        }
                    }] : [{
                        name: "SES",
                        policy: {
                            Version: "2012-10-17",
                            Statement: [{
                                    Effect: "Allow",
                                    Action: "ses:SendRawEmail",
                                    Resource: "*",
                                }]
                        }
                    }])
            ],
            environmentVariables: {
                ...(args.assumeRoleArn ? { ASSUME_ROLE_ARN: args.assumeRoleArn } : {}),
                REGION: (_a = args.region) !== null && _a !== void 0 ? _a : aws.getRegionOutput().name,
            },
        }, opts, "pat:ses:SesProxyMailer");
    }
}
exports.SesProxyMailer = SesProxyMailer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VzUHJveHlNYWlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2VzL1Nlc1Byb3h5TWFpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBR25DLHNDQUErRDtBQUUvRDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFhLGNBQWUsU0FBUSx5QkFBZ0I7SUFDaEQsWUFBWSxJQUFZLEVBQUUsSUFBd0IsRUFBRSxJQUErQjs7UUFDL0UsS0FBSyxDQUFDLElBQUksRUFBRTtZQUNSLE9BQU8sRUFBRSxHQUFHLFNBQVMsbUNBQW1DO1lBQ3hELGtCQUFrQixFQUFFO2dCQUNoQixHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDdEIsSUFBSSxFQUFFLEtBQUs7d0JBQ1gsTUFBTSxFQUFFOzRCQUNKLE9BQU8sRUFBRSxZQUFZOzRCQUNyQixTQUFTLEVBQUUsQ0FBQztvQ0FDUixNQUFNLEVBQUUsT0FBTztvQ0FDZixNQUFNLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQztvQ0FDMUIsUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztpQ0FDakMsQ0FBQzt5QkFDTDtxQkFDZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN0QixJQUFJLEVBQUUsS0FBSzt3QkFDWCxNQUFNLEVBQUU7NEJBQ0osT0FBTyxFQUFFLFlBQVk7NEJBQ3JCLFNBQVMsRUFBRSxDQUFDO29DQUNSLE1BQU0sRUFBRSxPQUFPO29DQUNmLE1BQU0sRUFBRSxrQkFBa0I7b0NBQzFCLFFBQVEsRUFBRSxHQUFHO2lDQUNoQixDQUFDO3lCQUNMO3FCQUNnQixDQUFDLENBQUM7YUFDMUI7WUFDRCxvQkFBb0IsRUFBRTtnQkFDbEIsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNwRSxNQUFNLEVBQUUsTUFBQSxJQUFJLENBQUMsTUFBTSxtQ0FBSSxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUMsSUFBSTthQUNwRDtTQUNKLEVBQUUsSUFBSSxFQUFFLHdCQUF3QixDQUFDLENBQUM7SUFDdkMsQ0FBQztDQUNKO0FBakNELHdDQWlDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tIFwiQHB1bHVtaS9hd3NcIjtcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcbmltcG9ydCB7IENvbXBvbmVudFJlc291cmNlT3B0aW9ucyB9IGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuaW1wb3J0IHsgUm9sZUlubGluZVBvbGljeSwgU2ltcGxlTm9kZUxhbWJkYSB9IGZyb20gXCIuLi9sYW1iZGFcIjtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQVdTIExhbWJkYSB0byBzZW5kIGVtYWlsIHVzaW5nIFNFUy5cbiAqIFxuICogSXQgYWN0cyBhcyBhIHByb3h5IGZvciB0aGUgU2VuZFJhd0VtYWlsIGNvbW1hbmQsIGFsbG93aW5nIHlvdVxuICogIC0gdG8gc2VuZCBlbWFpbCBmcm9tIGEgcHJpdmF0ZSBzdWJuZXQgdXNpbmcgSVB2NiAoU0VTIGRvZXNuJ3Qgc3VwcG9ydCBJUHY2IHlldClcbiAqICAtIHRvIHNlbmQgZW1haWwgZnJvbSBhIGRpZmZlcmVudCBhY2NvdW50IGJ5IGFzc3VtaW5nIGFub3RoZXIgcm9sZS5cbiAqIFxuICogWW91IGNhbiBjb250cm9sIHdobyBjYW4gc2VuZCBlbWFpbCwgYnkgY29uZmlndXJpbmcgd2hvIGNhbiBpbnZva2UgdGhpcyBsYW1iZGEuXG4gKiBJZiAnYXNzdW1lUm9sZUFybicgaXNuJ3Qgc3BlY2lmaWVkIHRoZSBsYW1iZGEgY2FuIHNlbmQgZW1haWwgdmlhIGFueSBjb25maWd1cmVkIFNFUyBpZGVudGl0eS5cbiAqL1xuZXhwb3J0IGNsYXNzIFNlc1Byb3h5TWFpbGVyIGV4dGVuZHMgU2ltcGxlTm9kZUxhbWJkYSB7XG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBTZXNQcm94eU1haWxlckFyZ3MsIG9wdHM/OiBDb21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIobmFtZSwge1xuICAgICAgICAgICAgY29kZURpcjogYCR7X19kaXJuYW1lfS8uLi8uLi9yZXNvdXJjZXMvc2VzLXByb3h5LW1haWxlcmAsXG4gICAgICAgICAgICByb2xlSW5saW5lUG9saWNpZXM6IFtcbiAgICAgICAgICAgICAgICAuLi4oYXJncy5hc3N1bWVSb2xlQXJuID8gW3tcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJTVFNcIixcbiAgICAgICAgICAgICAgICAgICAgcG9saWN5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBWZXJzaW9uOiBcIjIwMTItMTAtMTdcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFN0YXRlbWVudDogW3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZmZlY3Q6IFwiQWxsb3dcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFtcInN0czpBc3N1bWVSb2xlXCJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBbYXJncy5hc3N1bWVSb2xlQXJuXVxuICAgICAgICAgICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gYXMgUm9sZUlubGluZVBvbGljeV0gOiBbe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcIlNFU1wiLFxuICAgICAgICAgICAgICAgICAgICBwb2xpY3k6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFZlcnNpb246IFwiMjAxMi0xMC0xN1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgU3RhdGVtZW50OiBbe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFjdGlvbjogXCJzZXM6U2VuZFJhd0VtYWlsXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IFwiKlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gYXMgUm9sZUlubGluZVBvbGljeV0pXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZW52aXJvbm1lbnRWYXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAuLi4oYXJncy5hc3N1bWVSb2xlQXJuID8ge0FTU1VNRV9ST0xFX0FSTjogYXJncy5hc3N1bWVSb2xlQXJufSA6IHt9KSxcbiAgICAgICAgICAgICAgICBSRUdJT046IGFyZ3MucmVnaW9uID8/IGF3cy5nZXRSZWdpb25PdXRwdXQoKS5uYW1lLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgb3B0cywgXCJwYXQ6c2VzOlNlc1Byb3h5TWFpbGVyXCIpO1xuICAgIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZXNQcm94eU1haWxlckFyZ3Mge1xuICAgIGFzc3VtZVJvbGVBcm4/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcblxuICAgIC8qKlxuICAgICAqIE9wdGlvbmFsbHksIHNwZWNpZnkgd2hpY2ggcmVnaW9uYWwgU0VTIHNlcnZpY2UgdG8gdXNlLlxuICAgICAqL1xuICAgIHJlZ2lvbj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xufVxuIl19