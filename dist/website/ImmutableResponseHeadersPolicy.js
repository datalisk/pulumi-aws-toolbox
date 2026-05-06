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
exports.ImmutableResponseHeadersPolicy = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const utils_1 = require("./utils");
/**
 * Creates a Cloudfront ResponseHeadersPolicy which sets the
 * cache-control header to indicate that the response will not be updated while it's fresh.
 */
class ImmutableResponseHeadersPolicy extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        var _a;
        super("pat:website:ImmutableResponseHeadersPolicy", name, args, opts);
        const maxAge = ((_a = args.days) !== null && _a !== void 0 ? _a : 365) * 24 * 60 * 60;
        const policy = new aws.cloudfront.ResponseHeadersPolicy(name, {
            securityHeadersConfig: utils_1.defaultSecurityHeadersConfig,
            customHeadersConfig: {
                items: [{
                        header: "cache-control",
                        value: `public, max-age=${maxAge}, immutable`,
                        override: true,
                    }],
            }
        }, {
            parent: this,
        });
        this.policyId = policy.id;
    }
}
exports.ImmutableResponseHeadersPolicy = ImmutableResponseHeadersPolicy;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW1tdXRhYmxlUmVzcG9uc2VIZWFkZXJzUG9saWN5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3dlYnNpdGUvSW1tdXRhYmxlUmVzcG9uc2VIZWFkZXJzUG9saWN5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVEQUF5QztBQUN6QyxtQ0FBdUQ7QUFFdkQ7OztHQUdHO0FBQ0gsTUFBYSw4QkFBK0IsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBR3hFLFlBQVksSUFBWSxFQUFFLElBQXdDLEVBQUUsSUFBc0M7O1FBQ3RHLEtBQUssQ0FBQyw0Q0FBNEMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXRFLE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBQSxJQUFJLENBQUMsSUFBSSxtQ0FBSSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUVqRCxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFO1lBQzFELHFCQUFxQixFQUFFLG9DQUE0QjtZQUNuRCxtQkFBbUIsRUFBRTtnQkFDakIsS0FBSyxFQUFFLENBQUM7d0JBQ0osTUFBTSxFQUFFLGVBQWU7d0JBQ3ZCLEtBQUssRUFBRSxtQkFBbUIsTUFBTSxhQUFhO3dCQUM3QyxRQUFRLEVBQUUsSUFBSTtxQkFDakIsQ0FBQzthQUNMO1NBQ0osRUFBRTtZQUNDLE1BQU0sRUFBRSxJQUFJO1NBQ2YsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQzlCLENBQUM7Q0FDSjtBQXZCRCx3RUF1QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSBcIkBwdWx1bWkvYXdzXCI7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5pbXBvcnQgeyBkZWZhdWx0U2VjdXJpdHlIZWFkZXJzQ29uZmlnIH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQ2xvdWRmcm9udCBSZXNwb25zZUhlYWRlcnNQb2xpY3kgd2hpY2ggc2V0cyB0aGVcbiAqIGNhY2hlLWNvbnRyb2wgaGVhZGVyIHRvIGluZGljYXRlIHRoYXQgdGhlIHJlc3BvbnNlIHdpbGwgbm90IGJlIHVwZGF0ZWQgd2hpbGUgaXQncyBmcmVzaC5cbiAqL1xuZXhwb3J0IGNsYXNzIEltbXV0YWJsZVJlc3BvbnNlSGVhZGVyc1BvbGljeSBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcmVhZG9ubHkgcG9saWN5SWQ6IHB1bHVtaS5PdXRwdXQ8cHVsdW1pLklEPjtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogSW1tdXRhYmxlUmVzcG9uc2VIZWFkZXJzUG9saWN5QXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJwYXQ6d2Vic2l0ZTpJbW11dGFibGVSZXNwb25zZUhlYWRlcnNQb2xpY3lcIiwgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICAgICAgY29uc3QgbWF4QWdlID0gKGFyZ3MuZGF5cyA/PyAzNjUpICogMjQgKiA2MCAqIDYwO1xuXG4gICAgICAgIGNvbnN0IHBvbGljeSA9IG5ldyBhd3MuY2xvdWRmcm9udC5SZXNwb25zZUhlYWRlcnNQb2xpY3kobmFtZSwge1xuICAgICAgICAgICAgc2VjdXJpdHlIZWFkZXJzQ29uZmlnOiBkZWZhdWx0U2VjdXJpdHlIZWFkZXJzQ29uZmlnLFxuICAgICAgICAgICAgY3VzdG9tSGVhZGVyc0NvbmZpZzoge1xuICAgICAgICAgICAgICAgIGl0ZW1zOiBbe1xuICAgICAgICAgICAgICAgICAgICBoZWFkZXI6IFwiY2FjaGUtY29udHJvbFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogYHB1YmxpYywgbWF4LWFnZT0ke21heEFnZX0sIGltbXV0YWJsZWAsXG4gICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMucG9saWN5SWQgPSBwb2xpY3kuaWQ7XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEltbXV0YWJsZVJlc3BvbnNlSGVhZGVyc1BvbGljeUFyZ3Mge1xuICAgIC8qKlxuICAgICAqIEZvciBob3cgbWFueSBkYXlzIHRoZSBpbW11dGFibGUgcmVzb3VyY2Ugc2hvdWxkIGJlIGNhY2hlZCBhbmQgY29uc2lkZXJlZCBmcmVzaCAoZGVmYXVsdDogMzY1KS5cbiAgICAgKi9cbiAgICByZWFkb25seSBkYXlzPzogbnVtYmVyO1xufVxuIl19