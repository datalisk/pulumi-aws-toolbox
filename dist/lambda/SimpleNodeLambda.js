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
    // TODO remove type param
    constructor(name, args, opts, type) {
        var _a, _b, _c;
        super(type !== null && type !== void 0 ? type : "pat:lambda:SimpleNodeLambda", name, args, opts);
        const builder = new Builder_1.Builder(name, args, { parent: this });
        const logGroup = builder.createLogGroup();
        const role = builder.createRole();
        const vpcConfig = builder.createVpcConfig();
        this.function = new aws.lambda.Function(name, {
            ...this.getCodeArgs(args),
            handler: (_a = args.handler) !== null && _a !== void 0 ? _a : `index.handler`,
            runtime: aws.lambda.Runtime.NodeJS24dX,
            architectures: ["arm64"],
            role: role.arn,
            memorySize: (_b = args.memorySize) !== null && _b !== void 0 ? _b : 128,
            timeout: (_c = args.timeout) !== null && _c !== void 0 ? _c : 60,
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
    getCodeArgs(args) {
        if (!args.codeDir && !args.codeS3Folder) {
            throw new Error("Either codeDir or codeS3Folder must be provided.");
        }
        if (args.codeDir && args.codeS3Folder) {
            throw new Error("Only one of codeDir or codeS3Folder can be provided.");
        }
        return args.codeDir ? {
            description: args.codeDir.substring(args.codeDir.lastIndexOf('/') + 1),
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(args.codeDir),
            })
        } : {
            description: args.codeS3Folder.path,
            s3Bucket: args.codeS3Folder.bucket.bucket,
            s3Key: pulumi.interpolate `${args.codeS3Folder.path}/function.zip`,
        };
    }
}
exports.SimpleNodeLambda = SimpleNodeLambda;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2ltcGxlTm9kZUxhbWJkYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9sYW1iZGEvU2ltcGxlTm9kZUxhbWJkYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFHekMsdUNBQW9EO0FBRXBEOztHQUVHO0FBQ0gsTUFBYSxnQkFBaUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBRzFELHlCQUF5QjtJQUN6QixZQUFZLElBQVksRUFBRSxJQUEwQixFQUFFLElBQStCLEVBQUUsSUFBYTs7UUFDaEcsS0FBSyxDQUFDLElBQUksYUFBSixJQUFJLGNBQUosSUFBSSxHQUFJLDZCQUE2QixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFL0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxpQkFBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMxRCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDMUMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2xDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUU1QyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO1lBQzFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7WUFDekIsT0FBTyxFQUFFLE1BQUEsSUFBSSxDQUFDLE9BQU8sbUNBQUksZUFBZTtZQUN4QyxPQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVTtZQUN0QyxhQUFhLEVBQUUsQ0FBQyxPQUFPLENBQUM7WUFDeEIsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHO1lBQ2QsVUFBVSxFQUFFLE1BQUEsSUFBSSxDQUFDLFVBQVUsbUNBQUksR0FBRztZQUNsQyxPQUFPLEVBQUUsTUFBQSxJQUFJLENBQUMsT0FBTyxtQ0FBSSxFQUFFO1lBQzNCLFdBQVcsRUFBRTtnQkFDVCxTQUFTLEVBQUUsSUFBSSxDQUFDLG9CQUFvQjthQUN2QztZQUNELFNBQVM7WUFDVCxhQUFhLEVBQUU7Z0JBQ1gsUUFBUSxFQUFFLFFBQVEsQ0FBQyxJQUFJO2dCQUN2QixTQUFTLEVBQUUsTUFBTTthQUNwQjtTQUNKLEVBQUU7WUFDQyxNQUFNLEVBQUUsSUFBSTtTQUNmLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyxXQUFXLENBQUMsSUFBMEI7UUFDMUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3BDLE1BQU0sSUFBSSxLQUFLLENBQUMsc0RBQXNELENBQUMsQ0FBQztRQUM1RSxDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNsQixXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RFLElBQUksRUFBRSxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDO2dCQUNoQyxHQUFHLEVBQUUsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO2FBQ2xELENBQUM7U0FDTCxDQUFDLENBQUMsQ0FBQztZQUNBLFdBQVcsRUFBRSxJQUFJLENBQUMsWUFBYSxDQUFDLElBQUk7WUFDcEMsUUFBUSxFQUFFLElBQUksQ0FBQyxZQUFhLENBQUMsTUFBTSxDQUFDLE1BQU07WUFDMUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxXQUFXLENBQUEsR0FBRyxJQUFJLENBQUMsWUFBYSxDQUFDLElBQUksZUFBZTtTQUNyRSxDQUFDO0lBQ04sQ0FBQztDQUNKO0FBckRELDRDQXFEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tIFwiQHB1bHVtaS9hd3NcIjtcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcbmltcG9ydCB7IENvbXBvbmVudFJlc291cmNlT3B0aW9ucyB9IGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuaW1wb3J0IHsgUzNGb2xkZXIgfSBmcm9tIFwiLi4vY2lcIjtcbmltcG9ydCB7IEJhc2VMYW1iZGFBcmdzLCBCdWlsZGVyIH0gZnJvbSBcIi4vQnVpbGRlclwiO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBOb2RlanMgQVdTIExhbWJkYSB3aXRoIHVzZWZ1bCBkZWZhdWx0cyBmb3Igc21hbGwgJiBzaW1wbGUgdGFza3MuXG4gKi9cbmV4cG9ydCBjbGFzcyBTaW1wbGVOb2RlTGFtYmRhIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICByZWFkb25seSBmdW5jdGlvbjogYXdzLmxhbWJkYS5GdW5jdGlvbjtcblxuICAgIC8vIFRPRE8gcmVtb3ZlIHR5cGUgcGFyYW1cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFNpbXBsZU5vZGVMYW1iZGFBcmdzLCBvcHRzPzogQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zLCB0eXBlPzogc3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKHR5cGUgPz8gXCJwYXQ6bGFtYmRhOlNpbXBsZU5vZGVMYW1iZGFcIiwgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICAgICAgY29uc3QgYnVpbGRlciA9IG5ldyBCdWlsZGVyKG5hbWUsIGFyZ3MsIHsgcGFyZW50OiB0aGlzIH0pO1xuICAgICAgICBjb25zdCBsb2dHcm91cCA9IGJ1aWxkZXIuY3JlYXRlTG9nR3JvdXAoKTtcbiAgICAgICAgY29uc3Qgcm9sZSA9IGJ1aWxkZXIuY3JlYXRlUm9sZSgpO1xuICAgICAgICBjb25zdCB2cGNDb25maWcgPSBidWlsZGVyLmNyZWF0ZVZwY0NvbmZpZygpO1xuXG4gICAgICAgIHRoaXMuZnVuY3Rpb24gPSBuZXcgYXdzLmxhbWJkYS5GdW5jdGlvbihuYW1lLCB7XG4gICAgICAgICAgICAuLi50aGlzLmdldENvZGVBcmdzKGFyZ3MpLFxuICAgICAgICAgICAgaGFuZGxlcjogYXJncy5oYW5kbGVyID8/IGBpbmRleC5oYW5kbGVyYCxcbiAgICAgICAgICAgIHJ1bnRpbWU6IGF3cy5sYW1iZGEuUnVudGltZS5Ob2RlSlMyNGRYLFxuICAgICAgICAgICAgYXJjaGl0ZWN0dXJlczogW1wiYXJtNjRcIl0sXG4gICAgICAgICAgICByb2xlOiByb2xlLmFybixcbiAgICAgICAgICAgIG1lbW9yeVNpemU6IGFyZ3MubWVtb3J5U2l6ZSA/PyAxMjgsXG4gICAgICAgICAgICB0aW1lb3V0OiBhcmdzLnRpbWVvdXQgPz8gNjAsXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogYXJncy5lbnZpcm9ubWVudFZhcmlhYmxlcyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB2cGNDb25maWcsXG4gICAgICAgICAgICBsb2dnaW5nQ29uZmlnOiB7XG4gICAgICAgICAgICAgICAgbG9nR3JvdXA6IGxvZ0dyb3VwLm5hbWUsXG4gICAgICAgICAgICAgICAgbG9nRm9ybWF0OiBcIlRleHRcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHBhcmVudDogdGhpc1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldENvZGVBcmdzKGFyZ3M6IFNpbXBsZU5vZGVMYW1iZGFBcmdzKSB7XG4gICAgICAgIGlmICghYXJncy5jb2RlRGlyICYmICFhcmdzLmNvZGVTM0ZvbGRlcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRWl0aGVyIGNvZGVEaXIgb3IgY29kZVMzRm9sZGVyIG11c3QgYmUgcHJvdmlkZWQuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFyZ3MuY29kZURpciAmJiBhcmdzLmNvZGVTM0ZvbGRlcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT25seSBvbmUgb2YgY29kZURpciBvciBjb2RlUzNGb2xkZXIgY2FuIGJlIHByb3ZpZGVkLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhcmdzLmNvZGVEaXIgPyB7XG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYXJncy5jb2RlRGlyLnN1YnN0cmluZyhhcmdzLmNvZGVEaXIubGFzdEluZGV4T2YoJy8nKSArIDEpLFxuICAgICAgICAgICAgY29kZTogbmV3IHB1bHVtaS5hc3NldC5Bc3NldEFyY2hpdmUoe1xuICAgICAgICAgICAgICAgIFwiLlwiOiBuZXcgcHVsdW1pLmFzc2V0LkZpbGVBcmNoaXZlKGFyZ3MuY29kZURpciksXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IDoge1xuICAgICAgICAgICAgZGVzY3JpcHRpb246IGFyZ3MuY29kZVMzRm9sZGVyIS5wYXRoLFxuICAgICAgICAgICAgczNCdWNrZXQ6IGFyZ3MuY29kZVMzRm9sZGVyIS5idWNrZXQuYnVja2V0LFxuICAgICAgICAgICAgczNLZXk6IHB1bHVtaS5pbnRlcnBvbGF0ZWAke2FyZ3MuY29kZVMzRm9sZGVyIS5wYXRofS9mdW5jdGlvbi56aXBgLFxuICAgICAgICB9O1xuICAgIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaW1wbGVOb2RlTGFtYmRhQXJncyBleHRlbmRzIEJhc2VMYW1iZGFBcmdzIHtcbiAgICAvKipcbiAgICAgKiBBIGxvY2FsIGRpcmVjdG9yeSB3aXRoIHRoZSBKUyBzb3VyY2UgY29kZSB0byBkZXBsb3kuXG4gICAgICovXG4gICAgY29kZURpcj86IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIEEgUzMgZm9sZGVyIGNvbnRhaW5pbmcgYSBmdW5jdGlvbi56aXAgZmlsZSB0byBkZXBsb3kgYXMgdGhlIExhbWJkYSBjb2RlLlxuICAgICAqIEV4YW1wbGU6IHsgYnVja2V0OiBteUJ1Y2tldCwgcGF0aDogXCJiYWNrZW5kL2FiY2QxMjM0XCIgfVxuICAgICAqL1xuICAgIGNvZGVTM0ZvbGRlcj86IFMzRm9sZGVyO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGhhbmRsZXIgbmFtZS5cbiAgICAgKiBEZWZhdWx0cyB0byBcImluZGV4LmhhbmRsZXJcIiwgd2hpY2ggbWVhbnMgdGhlIGZ1bmN0aW9uIHdpbGwgbG9vayBmb3IgYSBpbmRleC5qcyBvciBpbmRleC5tanMgZmlsZSB3aXRoIGFuIGV4cG9ydGVkIGhhbmRsZXIgZnVuY3Rpb24uXG4gICAgICovXG4gICAgaGFuZGxlcj86IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIE1hcCBvZiBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIHRoZSBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICBlbnZpcm9ubWVudFZhcmlhYmxlcz86IHB1bHVtaS5JbnB1dDx7XG4gICAgICAgIFtrZXk6IHN0cmluZ106IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIH0+O1xuXG4gICAgLyoqXG4gICAgICogQW1vdW50IG9mIG1lbW9yeSBpbiBNQiB5b3VyIExhbWJkYSBGdW5jdGlvbiBjYW4gdXNlIGF0IHJ1bnRpbWUuIERlZmF1bHRzIHRvIGAxMjhgLiBTZWUgW0xpbWl0c10oaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2xhbWJkYS9sYXRlc3QvZGcvbGltaXRzLmh0bWwpXG4gICAgICovXG4gICAgbWVtb3J5U2l6ZT86IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIEFtb3VudCBvZiB0aW1lIHlvdXIgTGFtYmRhIEZ1bmN0aW9uIGhhcyB0byBydW4gaW4gc2Vjb25kcy4gRGVmYXVsdHMgdG8gYDYwYC5cbiAgICAgKi9cbiAgICB0aW1lb3V0PzogbnVtYmVyO1xufVxuIl19