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
exports.getSsmSecret = getSsmSecret;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
function getSsmSecret(name) {
    const result = pulumi.secret(aws.ssm.getParameter({
        name,
        withDecryption: true
    }));
    return result.apply(x => x.value);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3NtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWwvc3NtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHQSxvQ0FNQztBQVRELGlEQUFtQztBQUNuQyx1REFBeUM7QUFFekMsU0FBZ0IsWUFBWSxDQUFDLElBQVk7SUFDckMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQztRQUM5QyxJQUFJO1FBQ0osY0FBYyxFQUFFLElBQUk7S0FDdkIsQ0FBQyxDQUFDLENBQUM7SUFDSixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tIFwiQHB1bHVtaS9hd3NcIjtcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNzbVNlY3JldChuYW1lOiBzdHJpbmcpOiBwdWx1bWkuT3V0cHV0PHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IHB1bHVtaS5zZWNyZXQoYXdzLnNzbS5nZXRQYXJhbWV0ZXIoe1xuICAgICAgICBuYW1lLFxuICAgICAgICB3aXRoRGVjcnlwdGlvbjogdHJ1ZVxuICAgIH0pKTtcbiAgICByZXR1cm4gcmVzdWx0LmFwcGx5KHggPT4geC52YWx1ZSk7XG59XG4iXX0=