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
exports.SimpleNodeLambda = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const Builder_1 = require("./Builder");
/**
 * Creates a Nodejs AWS Lambda with useful defaults for small & simple tasks.
 */
class SimpleNodeLambda extends pulumi.ComponentResource {
    constructor(name, args, opts, type) {
        var _a, _b;
        super(type !== null && type !== void 0 ? type : "pat:lambda:SimpleNodeLambda", name, args, opts);
        const builder = new Builder_1.Builder(name, args, { parent: this });
        const logGroup = builder.createLogGroup();
        const role = builder.createRole();
        const vpcConfig = builder.createVpcConfig();
        this.function = new aws.lambda.Function(name, {
            description: args.codeDir.substring(args.codeDir.lastIndexOf('/') + 1),
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(args.codeDir),
            }),
            handler: `index.handler`,
            runtime: aws.lambda.Runtime.NodeJS20dX,
            architectures: ["arm64"],
            role: role.arn,
            memorySize: (_a = args.memorySize) !== null && _a !== void 0 ? _a : 128,
            timeout: (_b = args.timeout) !== null && _b !== void 0 ? _b : 60,
            environment: {
                variables: args.environmentVariables,
            },
            vpcConfig,
            loggingConfig: {
                logGroup: logGroup.name,
                logFormat: "Text",
            },
        }, {
            parent: this
        });
    }
}
exports.SimpleNodeLambda = SimpleNodeLambda;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2ltcGxlTm9kZUxhbWJkYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9sYW1iZGEvU2ltcGxlTm9kZUxhbWJkYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFFekMsdUNBQW9EO0FBRXBEOztHQUVHO0FBQ0gsTUFBYSxnQkFBaUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBRzFELFlBQVksSUFBWSxFQUFFLElBQTBCLEVBQUUsSUFBK0IsRUFBRSxJQUFhOztRQUNoRyxLQUFLLENBQUMsSUFBSSxhQUFKLElBQUksY0FBSixJQUFJLEdBQUksNkJBQTZCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUUvRCxNQUFNLE9BQU8sR0FBRyxJQUFJLGlCQUFPLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzFELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUMxQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDbEMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRTVDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUU7WUFDMUMsV0FBVyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0RSxJQUFJLEVBQUUsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQztnQkFDaEMsR0FBRyxFQUFFLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQzthQUNsRCxDQUFDO1lBQ0YsT0FBTyxFQUFFLGVBQWU7WUFDeEIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVU7WUFDdEMsYUFBYSxFQUFFLENBQUMsT0FBTyxDQUFDO1lBQ3hCLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRztZQUNkLFVBQVUsRUFBRSxNQUFBLElBQUksQ0FBQyxVQUFVLG1DQUFJLEdBQUc7WUFDbEMsT0FBTyxFQUFFLE1BQUEsSUFBSSxDQUFDLE9BQU8sbUNBQUksRUFBRTtZQUMzQixXQUFXLEVBQUU7Z0JBQ1QsU0FBUyxFQUFFLElBQUksQ0FBQyxvQkFBb0I7YUFDdkM7WUFDRCxTQUFTO1lBQ1QsYUFBYSxFQUFFO2dCQUNYLFFBQVEsRUFBRSxRQUFRLENBQUMsSUFBSTtnQkFDdkIsU0FBUyxFQUFFLE1BQU07YUFDcEI7U0FDSixFQUFFO1lBQ0MsTUFBTSxFQUFFLElBQUk7U0FDZixDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUFsQ0QsNENBa0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXdzIGZyb20gXCJAcHVsdW1pL2F3c1wiO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuaW1wb3J0IHsgQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zIH0gZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5pbXBvcnQgeyBCYXNlTGFtYmRhQXJncywgQnVpbGRlciB9IGZyb20gXCIuL0J1aWxkZXJcIjtcblxuLyoqXG4gKiBDcmVhdGVzIGEgTm9kZWpzIEFXUyBMYW1iZGEgd2l0aCB1c2VmdWwgZGVmYXVsdHMgZm9yIHNtYWxsICYgc2ltcGxlIHRhc2tzLlxuICovXG5leHBvcnQgY2xhc3MgU2ltcGxlTm9kZUxhbWJkYSBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcmVhZG9ubHkgZnVuY3Rpb246IGF3cy5sYW1iZGEuRnVuY3Rpb247XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFNpbXBsZU5vZGVMYW1iZGFBcmdzLCBvcHRzPzogQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zLCB0eXBlPzogc3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKHR5cGUgPz8gXCJwYXQ6bGFtYmRhOlNpbXBsZU5vZGVMYW1iZGFcIiwgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICAgICAgY29uc3QgYnVpbGRlciA9IG5ldyBCdWlsZGVyKG5hbWUsIGFyZ3MsIHsgcGFyZW50OiB0aGlzIH0pO1xuICAgICAgICBjb25zdCBsb2dHcm91cCA9IGJ1aWxkZXIuY3JlYXRlTG9nR3JvdXAoKTtcbiAgICAgICAgY29uc3Qgcm9sZSA9IGJ1aWxkZXIuY3JlYXRlUm9sZSgpO1xuICAgICAgICBjb25zdCB2cGNDb25maWcgPSBidWlsZGVyLmNyZWF0ZVZwY0NvbmZpZygpO1xuXG4gICAgICAgIHRoaXMuZnVuY3Rpb24gPSBuZXcgYXdzLmxhbWJkYS5GdW5jdGlvbihuYW1lLCB7XG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYXJncy5jb2RlRGlyLnN1YnN0cmluZyhhcmdzLmNvZGVEaXIubGFzdEluZGV4T2YoJy8nKSArIDEpLFxuICAgICAgICAgICAgY29kZTogbmV3IHB1bHVtaS5hc3NldC5Bc3NldEFyY2hpdmUoe1xuICAgICAgICAgICAgICAgIFwiLlwiOiBuZXcgcHVsdW1pLmFzc2V0LkZpbGVBcmNoaXZlKGFyZ3MuY29kZURpciksXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGhhbmRsZXI6IGBpbmRleC5oYW5kbGVyYCxcbiAgICAgICAgICAgIHJ1bnRpbWU6IGF3cy5sYW1iZGEuUnVudGltZS5Ob2RlSlMyMGRYLFxuICAgICAgICAgICAgYXJjaGl0ZWN0dXJlczogW1wiYXJtNjRcIl0sXG4gICAgICAgICAgICByb2xlOiByb2xlLmFybixcbiAgICAgICAgICAgIG1lbW9yeVNpemU6IGFyZ3MubWVtb3J5U2l6ZSA/PyAxMjgsXG4gICAgICAgICAgICB0aW1lb3V0OiBhcmdzLnRpbWVvdXQgPz8gNjAsXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogYXJncy5lbnZpcm9ubWVudFZhcmlhYmxlcyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB2cGNDb25maWcsXG4gICAgICAgICAgICBsb2dnaW5nQ29uZmlnOiB7XG4gICAgICAgICAgICAgICAgbG9nR3JvdXA6IGxvZ0dyb3VwLm5hbWUsXG4gICAgICAgICAgICAgICAgbG9nRm9ybWF0OiBcIlRleHRcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHBhcmVudDogdGhpc1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2ltcGxlTm9kZUxhbWJkYUFyZ3MgZXh0ZW5kcyBCYXNlTGFtYmRhQXJncyB7XG4gICAgLyoqXG4gICAgICogQSBkaXJlY3Rvcnkgd2l0aCB0aGUgSlMgc291cmNlIGNvZGUgdG8gZGVwbG95LlxuICAgICAqIEl0IG11c3QgY29udGFpbiBhIGluZGV4LmpzL2luZGV4Lm1qcyBmaWxlIHdpdGggYSBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGNvZGVEaXI6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIE1hcCBvZiBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIHRoZSBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICBlbnZpcm9ubWVudFZhcmlhYmxlcz86IHB1bHVtaS5JbnB1dDx7XG4gICAgICAgIFtrZXk6IHN0cmluZ106IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIH0+O1xuXG4gICAgLyoqXG4gICAgICogQW1vdW50IG9mIG1lbW9yeSBpbiBNQiB5b3VyIExhbWJkYSBGdW5jdGlvbiBjYW4gdXNlIGF0IHJ1bnRpbWUuIERlZmF1bHRzIHRvIGAxMjhgLiBTZWUgW0xpbWl0c10oaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2xhbWJkYS9sYXRlc3QvZGcvbGltaXRzLmh0bWwpXG4gICAgICovXG4gICAgbWVtb3J5U2l6ZT86IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIEFtb3VudCBvZiB0aW1lIHlvdXIgTGFtYmRhIEZ1bmN0aW9uIGhhcyB0byBydW4gaW4gc2Vjb25kcy4gRGVmYXVsdHMgdG8gYDYwYC5cbiAgICAgKi9cbiAgICB0aW1lb3V0PzogbnVtYmVyO1xufVxuIl19