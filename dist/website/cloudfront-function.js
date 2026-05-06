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
exports.ViewerResponseFunction = exports.ViewerRequestFunction = void 0;
exports.loadHandlerCode = loadHandlerCode;
const aws = __importStar(require("@pulumi/aws"));
const fs = require("fs");
/**
 * Creates a CloudFront function that processes the request/response through a chain of handlers.
 *
 * A handler may decide to stop processing following handlers and return it's result immediately.
 */
class CloudfrontChainedFunction {
    constructor(name, eventType, parent) {
        this.name = name;
        this.eventType = eventType;
        this.parent = parent;
        this.handlerChain = [];
    }
    customHandler(handler) {
        this.handlerChain.push(handler);
        return this;
    }
    createOrUndefined() {
        if (this.handlerChain.length > 0) {
            return this.create();
        }
        else {
            return undefined;
        }
    }
    create() {
        var _a, _b;
        const handlersDir = `${__dirname}/../../resources/cloudfront-function-handlers/${this.eventType}`;
        const handlerNames = this.handlerChain.map(handler => handler.name).join();
        let code = `const handlerChain = [${handlerNames}];

async function handler(event) {
    let input = ${this.eventType == "viewer-request" ? "event.request" : "event.response"};
    for (let i = 0; i < handlerChain.length; i++) {
        const handler = handlerChain[i];
        const processed = await handler(input);
        const outputEvent = ${this.eventType == "viewer-request" ? "processed.request" : "processed.response"};
        if (processed.stop) {
            return outputEvent;
        } else {
            input = outputEvent;
        }
    }
    return input;
}`;
        for (const handler of this.handlerChain) {
            const handlerCode = (_a = handler.code) !== null && _a !== void 0 ? _a : loadHandlerCode(`${handlersDir}/${handler.name}.js`, (_b = handler.replacements) !== null && _b !== void 0 ? _b : {});
            code += `\n\n// ----------- Handler: ${handler.name} -----------\n`;
            code += handlerCode;
        }
        return new aws.cloudfront.Function(this.name, {
            runtime: "cloudfront-js-2.0",
            comment: `${this.eventType}: ${handlerNames}`,
            publish: true,
            code,
        }, {
            parent: this.parent,
        });
    }
}
class ViewerRequestFunction extends CloudfrontChainedFunction {
    constructor(name, parent) {
        super(name, "viewer-request", parent);
    }
    /**
     * Rewrites the requested path to serve an actual HTML file.
     *
     * Strategy 'FILE':
     * If the last element in the path does not contain a dot, it appends '.html'.
     * If the requested path ends with a slash, the user is redirected to a URL without slash (with status 301 Moved Permanently).
     * Example: '/about' is rewritten to '/about.html'
     *
     * Stragtegy 'SUB_DIR':
     * - appending 'index.html' if path ends with a slash or
     * - appending '/index.html' if paths ends without a slash and doesn't contain a file extension.
     * Example: '/about' or '/about/' are rewritten to '/about/index.html'
     */
    rewriteWebpagePath(strategy) {
        if (strategy == 'FILE') {
            this.handlerChain.push({
                name: "rewriteWebpageToFileHandler",
            });
        }
        else {
            this.handlerChain.push({
                name: "rewriteWebpageToSubdirHandler",
            });
        }
        return this;
    }
    /**
     * Rewrites a path by replacing a single path element with a replacement string.
     */
    rewritePathElement(pathElementIndex, replacement) {
        this.handlerChain.push({
            name: "rewritePathElementHandler",
            replacements: {
                "process.env.PATH_ELEMENT_INDEX": JSON.stringify(pathElementIndex),
                "process.env.REPLACEMENT": JSON.stringify(replacement),
            }
        });
        return this;
    }
    /**
     * Rewrites the requested path to the given path.
     * @param path a path, starting with a slash
     */
    rewritePathTo(path) {
        this.handlerChain.push({
            name: "rewritePathToHandler",
            replacements: {
                "process.env.PATH": JSON.stringify(path),
            }
        });
        return this;
    }
    /**
     * Responds with a redirect (HTTP 301, Moved Permanently) to the specified URL.
     */
    redirectPermanently(redirectUrl) {
        this.handlerChain.push({
            name: "redirectHandler",
            replacements: {
                "process.env.REDIRECT_URL": JSON.stringify(redirectUrl),
            }
        });
        return this;
    }
    // TODO enable once regex flags are supported by CloudFront functions
    // /**
    //  * Rewrites a path based on a regex pattern. The content of each group is replace with a corresponding replacement.
    //  */
    // rewritePath(pattern: RegExp, replacements: string[]) {
    //     this.handlerChain.push(
    //         {
    //             name: "rewritePathRegexHandler",
    //             replacements: {
    //                 "process.env.PATTERN": JSON.stringify(pattern.source),
    //                 "JSON.parse(process.env.REPLACEMENTS)": JSON.stringify(replacements),
    //             }
    //         }
    //     );
    //     return this;
    // }
    /**
     * Adds a HTTP basic auth check.
     * If the checks fails the processing is stopped.
     */
    withBasicAuth(username, password) {
        this.handlerChain.push({
            name: "basicAuthHandler",
            replacements: {
                "__BASIC_AUTH__": Buffer.from(`${username}:${password}`).toString('base64'),
            }
        });
        return this;
    }
}
exports.ViewerRequestFunction = ViewerRequestFunction;
class ViewerResponseFunction extends CloudfrontChainedFunction {
    constructor(name, parent) {
        super(name, "viewer-response", parent);
    }
    statusCode(statusCode) {
        this.handlerChain.push({
            name: "statusCodeHandler",
            replacements: { "process.env.STATUS_CODE": `${statusCode}` },
        });
        return this;
    }
    /**
     * Sets the cache-control header to control browser caching.
     * @param immutable if resources can be treated as immutable (will be cached by up to a year)
     */
    withCacheControl(immutable) {
        this.handlerChain.push({
            name: "cacheControlHandler",
            replacements: { "__IMMUTABLE__": `${immutable}` },
        });
        return this;
    }
    /**
     * Deprecated.
     * Adds several common security-related HTTP headers to the response, see the handler code for details.
     */
    withSecurityHeaders() {
        this.handlerChain.push({
            name: "securityHeadersHandler",
        });
        return this;
    }
}
exports.ViewerResponseFunction = ViewerResponseFunction;
function loadHandlerCode(path, replacements) {
    let handlerCode = fs.readFileSync(path, "utf-8");
    Object.keys(replacements).forEach(key => {
        const value = replacements[key];
        handlerCode = handlerCode.replace(key, value);
    });
    return handlerCode;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvdWRmcm9udC1mdW5jdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJzaXRlL2Nsb3VkZnJvbnQtZnVuY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUErTkEsMENBT0M7QUF0T0QsaURBQW1DO0FBR25DLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUV6Qjs7OztHQUlHO0FBQ0gsTUFBZSx5QkFBeUI7SUFNcEMsWUFBWSxJQUFZLEVBQUUsU0FBb0IsRUFBRSxNQUEwQjtRQUN0RSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUMzQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQsYUFBYSxDQUFDLE9BQWdCO1FBQzFCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxpQkFBaUI7UUFDYixJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQy9CLE9BQU8sSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3pCLENBQUM7YUFBTSxDQUFDO1lBQ0osT0FBTyxTQUFTLENBQUM7UUFDckIsQ0FBQztJQUNMLENBQUM7SUFFRCxNQUFNOztRQUNGLE1BQU0sV0FBVyxHQUFHLEdBQUcsU0FBUyxpREFBaUQsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBRWxHLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLElB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QUFxQjtZQUMzQixZQUFZLEVBQUUsRUFBRSxlQUFlLEVBQUUsR0FBRyxTQUFTLEVBQUUsRUFBRTtTQUNwRCxDQUFDLENBQUM7UUFDSCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsbUJBQW1CO1FBQ2YsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUM7WUFDbkIsSUFBSSxFQUFFLHdCQUF3QjtTQUNqQyxDQUFDLENBQUM7UUFDSCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0NBQ0o7QUFuQ0Qsd0RBbUNDO0FBRUQsU0FBZ0IsZUFBZSxDQUFDLElBQVksRUFBRSxZQUF1QztJQUNqRixJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNqRCxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNwQyxNQUFNLEtBQUssR0FBRyxZQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakMsV0FBVyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2xELENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxXQUFXLENBQUM7QUFDdkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tIFwiQHB1bHVtaS9hd3NcIjtcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcbmltcG9ydCB7IENvbXBvbmVudFJlc291cmNlIH0gZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5jb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQ2xvdWRGcm9udCBmdW5jdGlvbiB0aGF0IHByb2Nlc3NlcyB0aGUgcmVxdWVzdC9yZXNwb25zZSB0aHJvdWdoIGEgY2hhaW4gb2YgaGFuZGxlcnMuXG4gKiBcbiAqIEEgaGFuZGxlciBtYXkgZGVjaWRlIHRvIHN0b3AgcHJvY2Vzc2luZyBmb2xsb3dpbmcgaGFuZGxlcnMgYW5kIHJldHVybiBpdCdzIHJlc3VsdCBpbW1lZGlhdGVseS5cbiAqL1xuYWJzdHJhY3QgY2xhc3MgQ2xvdWRmcm9udENoYWluZWRGdW5jdGlvbiB7XG4gICAgcHJpdmF0ZSBuYW1lOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBldmVudFR5cGU6IEV2ZW50VHlwZTtcbiAgICBwcml2YXRlIHBhcmVudD86IENvbXBvbmVudFJlc291cmNlO1xuICAgIHByb3RlY3RlZCBoYW5kbGVyQ2hhaW46IEhhbmRsZXJbXTtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgZXZlbnRUeXBlOiBFdmVudFR5cGUsIHBhcmVudD86IENvbXBvbmVudFJlc291cmNlKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZXZlbnRUeXBlID0gZXZlbnRUeXBlO1xuICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgdGhpcy5oYW5kbGVyQ2hhaW4gPSBbXTtcbiAgICB9XG5cbiAgICBjdXN0b21IYW5kbGVyKGhhbmRsZXI6IEhhbmRsZXIpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVyQ2hhaW4ucHVzaChoYW5kbGVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY3JlYXRlT3JVbmRlZmluZWQoKSB7XG4gICAgICAgIGlmICh0aGlzLmhhbmRsZXJDaGFpbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjcmVhdGUoKSB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXJzRGlyID0gYCR7X19kaXJuYW1lfS8uLi8uLi9yZXNvdXJjZXMvY2xvdWRmcm9udC1mdW5jdGlvbi1oYW5kbGVycy8ke3RoaXMuZXZlbnRUeXBlfWA7XG5cbiAgICAgICAgY29uc3QgaGFuZGxlck5hbWVzID0gdGhpcy5oYW5kbGVyQ2hhaW4ubWFwKGhhbmRsZXIgPT4gaGFuZGxlci5uYW1lKS5qb2luKCk7XG4gICAgICAgIGxldCBjb2RlID0gYGNvbnN0IGhhbmRsZXJDaGFpbiA9IFske2hhbmRsZXJOYW1lc31dO1xuXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVyKGV2ZW50KSB7XG4gICAgbGV0IGlucHV0ID0gJHt0aGlzLmV2ZW50VHlwZSA9PSBcInZpZXdlci1yZXF1ZXN0XCIgPyBcImV2ZW50LnJlcXVlc3RcIiA6IFwiZXZlbnQucmVzcG9uc2VcIn07XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBoYW5kbGVyQ2hhaW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgaGFuZGxlciA9IGhhbmRsZXJDaGFpbltpXTtcbiAgICAgICAgY29uc3QgcHJvY2Vzc2VkID0gYXdhaXQgaGFuZGxlcihpbnB1dCk7XG4gICAgICAgIGNvbnN0IG91dHB1dEV2ZW50ID0gJHt0aGlzLmV2ZW50VHlwZSA9PSBcInZpZXdlci1yZXF1ZXN0XCIgPyBcInByb2Nlc3NlZC5yZXF1ZXN0XCIgOiBcInByb2Nlc3NlZC5yZXNwb25zZVwifTtcbiAgICAgICAgaWYgKHByb2Nlc3NlZC5zdG9wKSB7XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0RXZlbnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbnB1dCA9IG91dHB1dEV2ZW50O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbnB1dDtcbn1gO1xuXG4gICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiB0aGlzLmhhbmRsZXJDaGFpbikge1xuICAgICAgICAgICAgY29uc3QgaGFuZGxlckNvZGUgPSBoYW5kbGVyLmNvZGUgPz8gbG9hZEhhbmRsZXJDb2RlKGAke2hhbmRsZXJzRGlyfS8ke2hhbmRsZXIubmFtZX0uanNgLCBoYW5kbGVyLnJlcGxhY2VtZW50cyA/PyB7fSk7XG4gICAgICAgICAgICBjb2RlICs9IGBcXG5cXG4vLyAtLS0tLS0tLS0tLSBIYW5kbGVyOiAke2hhbmRsZXIubmFtZX0gLS0tLS0tLS0tLS1cXG5gO1xuICAgICAgICAgICAgY29kZSArPSBoYW5kbGVyQ29kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgYXdzLmNsb3VkZnJvbnQuRnVuY3Rpb24odGhpcy5uYW1lLCB7XG4gICAgICAgICAgICBydW50aW1lOiBcImNsb3VkZnJvbnQtanMtMi4wXCIsXG4gICAgICAgICAgICBjb21tZW50OiBgJHt0aGlzLmV2ZW50VHlwZX06ICR7aGFuZGxlck5hbWVzfWAsXG4gICAgICAgICAgICBwdWJsaXNoOiB0cnVlLFxuICAgICAgICAgICAgY29kZSxcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcGFyZW50OiB0aGlzLnBhcmVudCxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVmlld2VyUmVxdWVzdEZ1bmN0aW9uIGV4dGVuZHMgQ2xvdWRmcm9udENoYWluZWRGdW5jdGlvbiB7XG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBwYXJlbnQ/OiBDb21wb25lbnRSZXNvdXJjZSkge1xuICAgICAgICBzdXBlcihuYW1lLCBcInZpZXdlci1yZXF1ZXN0XCIsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV3cml0ZXMgdGhlIHJlcXVlc3RlZCBwYXRoIHRvIHNlcnZlIGFuIGFjdHVhbCBIVE1MIGZpbGUuXG4gICAgICogXG4gICAgICogU3RyYXRlZ3kgJ0ZJTEUnOlxuICAgICAqIElmIHRoZSBsYXN0IGVsZW1lbnQgaW4gdGhlIHBhdGggZG9lcyBub3QgY29udGFpbiBhIGRvdCwgaXQgYXBwZW5kcyAnLmh0bWwnLlxuICAgICAqIElmIHRoZSByZXF1ZXN0ZWQgcGF0aCBlbmRzIHdpdGggYSBzbGFzaCwgdGhlIHVzZXIgaXMgcmVkaXJlY3RlZCB0byBhIFVSTCB3aXRob3V0IHNsYXNoICh3aXRoIHN0YXR1cyAzMDEgTW92ZWQgUGVybWFuZW50bHkpLlxuICAgICAqIEV4YW1wbGU6ICcvYWJvdXQnIGlzIHJld3JpdHRlbiB0byAnL2Fib3V0Lmh0bWwnXG4gICAgICogXG4gICAgICogU3RyYWd0ZWd5ICdTVUJfRElSJzpcbiAgICAgKiAtIGFwcGVuZGluZyAnaW5kZXguaHRtbCcgaWYgcGF0aCBlbmRzIHdpdGggYSBzbGFzaCBvclxuICAgICAqIC0gYXBwZW5kaW5nICcvaW5kZXguaHRtbCcgaWYgcGF0aHMgZW5kcyB3aXRob3V0IGEgc2xhc2ggYW5kIGRvZXNuJ3QgY29udGFpbiBhIGZpbGUgZXh0ZW5zaW9uLlxuICAgICAqIEV4YW1wbGU6ICcvYWJvdXQnIG9yICcvYWJvdXQvJyBhcmUgcmV3cml0dGVuIHRvICcvYWJvdXQvaW5kZXguaHRtbCdcbiAgICAgKi9cbiAgICByZXdyaXRlV2VicGFnZVBhdGgoc3RyYXRlZ3k6IFdlYnBhZ2VSZXdyaXRlU3RyYXRlZ3kpIHtcbiAgICAgICAgaWYgKHN0cmF0ZWd5ID09ICdGSUxFJykge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVyQ2hhaW4ucHVzaCh7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJyZXdyaXRlV2VicGFnZVRvRmlsZUhhbmRsZXJcIixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVyQ2hhaW4ucHVzaCh7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJyZXdyaXRlV2VicGFnZVRvU3ViZGlySGFuZGxlclwiLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV3cml0ZXMgYSBwYXRoIGJ5IHJlcGxhY2luZyBhIHNpbmdsZSBwYXRoIGVsZW1lbnQgd2l0aCBhIHJlcGxhY2VtZW50IHN0cmluZy5cbiAgICAgKi9cbiAgICByZXdyaXRlUGF0aEVsZW1lbnQocGF0aEVsZW1lbnRJbmRleDogbnVtYmVyLCByZXBsYWNlbWVudDogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuaGFuZGxlckNoYWluLnB1c2goXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJyZXdyaXRlUGF0aEVsZW1lbnRIYW5kbGVyXCIsXG4gICAgICAgICAgICAgICAgcmVwbGFjZW1lbnRzOiB7XG4gICAgICAgICAgICAgICAgICAgIFwicHJvY2Vzcy5lbnYuUEFUSF9FTEVNRU5UX0lOREVYXCI6IEpTT04uc3RyaW5naWZ5KHBhdGhFbGVtZW50SW5kZXgpLFxuICAgICAgICAgICAgICAgICAgICBcInByb2Nlc3MuZW52LlJFUExBQ0VNRU5UXCI6IEpTT04uc3RyaW5naWZ5KHJlcGxhY2VtZW50KSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJld3JpdGVzIHRoZSByZXF1ZXN0ZWQgcGF0aCB0byB0aGUgZ2l2ZW4gcGF0aC5cbiAgICAgKiBAcGFyYW0gcGF0aCBhIHBhdGgsIHN0YXJ0aW5nIHdpdGggYSBzbGFzaFxuICAgICAqL1xuICAgIHJld3JpdGVQYXRoVG8ocGF0aDogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuaGFuZGxlckNoYWluLnB1c2goXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJyZXdyaXRlUGF0aFRvSGFuZGxlclwiLFxuICAgICAgICAgICAgICAgIHJlcGxhY2VtZW50czoge1xuICAgICAgICAgICAgICAgICAgICBcInByb2Nlc3MuZW52LlBBVEhcIjogSlNPTi5zdHJpbmdpZnkocGF0aCksXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXNwb25kcyB3aXRoIGEgcmVkaXJlY3QgKEhUVFAgMzAxLCBNb3ZlZCBQZXJtYW5lbnRseSkgdG8gdGhlIHNwZWNpZmllZCBVUkwuXG4gICAgICovXG4gICAgcmVkaXJlY3RQZXJtYW5lbnRseShyZWRpcmVjdFVybDogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuaGFuZGxlckNoYWluLnB1c2goXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJyZWRpcmVjdEhhbmRsZXJcIixcbiAgICAgICAgICAgICAgICByZXBsYWNlbWVudHM6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9jZXNzLmVudi5SRURJUkVDVF9VUkxcIjogSlNPTi5zdHJpbmdpZnkocmVkaXJlY3RVcmwpLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLy8gVE9ETyBlbmFibGUgb25jZSByZWdleCBmbGFncyBhcmUgc3VwcG9ydGVkIGJ5IENsb3VkRnJvbnQgZnVuY3Rpb25zXG4gICAgLy8gLyoqXG4gICAgLy8gICogUmV3cml0ZXMgYSBwYXRoIGJhc2VkIG9uIGEgcmVnZXggcGF0dGVybi4gVGhlIGNvbnRlbnQgb2YgZWFjaCBncm91cCBpcyByZXBsYWNlIHdpdGggYSBjb3JyZXNwb25kaW5nIHJlcGxhY2VtZW50LlxuICAgIC8vICAqL1xuICAgIC8vIHJld3JpdGVQYXRoKHBhdHRlcm46IFJlZ0V4cCwgcmVwbGFjZW1lbnRzOiBzdHJpbmdbXSkge1xuICAgIC8vICAgICB0aGlzLmhhbmRsZXJDaGFpbi5wdXNoKFxuICAgIC8vICAgICAgICAge1xuICAgIC8vICAgICAgICAgICAgIG5hbWU6IFwicmV3cml0ZVBhdGhSZWdleEhhbmRsZXJcIixcbiAgICAvLyAgICAgICAgICAgICByZXBsYWNlbWVudHM6IHtcbiAgICAvLyAgICAgICAgICAgICAgICAgXCJwcm9jZXNzLmVudi5QQVRURVJOXCI6IEpTT04uc3RyaW5naWZ5KHBhdHRlcm4uc291cmNlKSxcbiAgICAvLyAgICAgICAgICAgICAgICAgXCJKU09OLnBhcnNlKHByb2Nlc3MuZW52LlJFUExBQ0VNRU5UUylcIjogSlNPTi5zdHJpbmdpZnkocmVwbGFjZW1lbnRzKSxcbiAgICAvLyAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgICk7XG4gICAgLy8gICAgIHJldHVybiB0aGlzO1xuICAgIC8vIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBIVFRQIGJhc2ljIGF1dGggY2hlY2suXG4gICAgICogSWYgdGhlIGNoZWNrcyBmYWlscyB0aGUgcHJvY2Vzc2luZyBpcyBzdG9wcGVkLlxuICAgICAqL1xuICAgIHdpdGhCYXNpY0F1dGgodXNlcm5hbWU6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZykge1xuICAgICAgICB0aGlzLmhhbmRsZXJDaGFpbi5wdXNoKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwiYmFzaWNBdXRoSGFuZGxlclwiLFxuICAgICAgICAgICAgICAgIHJlcGxhY2VtZW50czoge1xuICAgICAgICAgICAgICAgICAgICBcIl9fQkFTSUNfQVVUSF9fXCI6IEJ1ZmZlci5mcm9tKGAke3VzZXJuYW1lfToke3Bhc3N3b3JkfWApLnRvU3RyaW5nKCdiYXNlNjQnKSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFZpZXdlclJlc3BvbnNlRnVuY3Rpb24gZXh0ZW5kcyBDbG91ZGZyb250Q2hhaW5lZEZ1bmN0aW9uIHtcbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHBhcmVudD86IENvbXBvbmVudFJlc291cmNlKSB7XG4gICAgICAgIHN1cGVyKG5hbWUsIFwidmlld2VyLXJlc3BvbnNlXCIsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgc3RhdHVzQ29kZShzdGF0dXNDb2RlOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVyQ2hhaW4ucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiBcInN0YXR1c0NvZGVIYW5kbGVyXCIsXG4gICAgICAgICAgICByZXBsYWNlbWVudHM6IHsgXCJwcm9jZXNzLmVudi5TVEFUVVNfQ09ERVwiOiBgJHtzdGF0dXNDb2RlfWAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGNhY2hlLWNvbnRyb2wgaGVhZGVyIHRvIGNvbnRyb2wgYnJvd3NlciBjYWNoaW5nLlxuICAgICAqIEBwYXJhbSBpbW11dGFibGUgaWYgcmVzb3VyY2VzIGNhbiBiZSB0cmVhdGVkIGFzIGltbXV0YWJsZSAod2lsbCBiZSBjYWNoZWQgYnkgdXAgdG8gYSB5ZWFyKVxuICAgICAqL1xuICAgIHdpdGhDYWNoZUNvbnRyb2woaW1tdXRhYmxlOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuaGFuZGxlckNoYWluLnB1c2goe1xuICAgICAgICAgICAgbmFtZTogXCJjYWNoZUNvbnRyb2xIYW5kbGVyXCIsXG4gICAgICAgICAgICByZXBsYWNlbWVudHM6IHsgXCJfX0lNTVVUQUJMRV9fXCI6IGAke2ltbXV0YWJsZX1gIH0sXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXByZWNhdGVkLlxuICAgICAqIEFkZHMgc2V2ZXJhbCBjb21tb24gc2VjdXJpdHktcmVsYXRlZCBIVFRQIGhlYWRlcnMgdG8gdGhlIHJlc3BvbnNlLCBzZWUgdGhlIGhhbmRsZXIgY29kZSBmb3IgZGV0YWlscy5cbiAgICAgKi9cbiAgICB3aXRoU2VjdXJpdHlIZWFkZXJzKCkge1xuICAgICAgICB0aGlzLmhhbmRsZXJDaGFpbi5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IFwic2VjdXJpdHlIZWFkZXJzSGFuZGxlclwiLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZEhhbmRsZXJDb2RlKHBhdGg6IHN0cmluZywgcmVwbGFjZW1lbnRzOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9KSB7XG4gICAgbGV0IGhhbmRsZXJDb2RlID0gZnMucmVhZEZpbGVTeW5jKHBhdGgsIFwidXRmLThcIik7XG4gICAgT2JqZWN0LmtleXMocmVwbGFjZW1lbnRzKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcmVwbGFjZW1lbnRzIVtrZXldO1xuICAgICAgICBoYW5kbGVyQ29kZSA9IGhhbmRsZXJDb2RlLnJlcGxhY2Uoa2V5LCB2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGhhbmRsZXJDb2RlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEhhbmRsZXIge1xuICAgIC8qKlxuICAgICAqIFRoZSBoYW5kbGVyIGNvZGUuIElmIG9taXR0ZWQsIHdpbGwgdHJ5IHRvIGxvYWQgYSBpbnRlcm5hbCBoYW5kbGVyIHdpdGggdGhlIHNhbWUgJ25hbWUnLlxuICAgICAqL1xuICAgIHJlYWRvbmx5IGNvZGU/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcblxuICAgIC8qKlxuICAgICAqIE5hbWUgb2YgdGhlIGhhbmRsZXIgZnVuY3Rpb24gd2l0aGluIHRoZSBjb2RlLlxuICAgICAqL1xuICAgIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFN0cmluZyByZXBsYWNlbWVudHMgdG8gYmUgcGVyZm9ybWVkIG9uIHRoZSBoYW5kbGVyIGNvZGUuXG4gICAgICovXG4gICAgcmVhZG9ubHkgcmVwbGFjZW1lbnRzPzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcbn1cblxuZXhwb3J0IHR5cGUgRXZlbnRUeXBlID0gYHZpZXdlci1yZXF1ZXN0YCB8IGB2aWV3ZXItcmVzcG9uc2VgO1xuXG5leHBvcnQgdHlwZSBXZWJwYWdlUmV3cml0ZVN0cmF0ZWd5ID0gJ0ZJTEUnIHwgJ1NVQl9ESVInO1xuIl19