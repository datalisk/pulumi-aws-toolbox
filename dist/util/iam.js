"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assumeRolePolicyForAwsService = assumeRolePolicyForAwsService;
function assumeRolePolicyForAwsService(serviceName) {
    return {
        Version: "2012-10-17",
        Statement: [{
                Effect: "Allow",
                Action: "sts:AssumeRole",
                Principal: {
                    Service: `${serviceName}.amazonaws.com`,
                },
            }]
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWwvaWFtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsc0VBV0M7QUFYRCxTQUFnQiw2QkFBNkIsQ0FBQyxXQUF1QjtJQUNqRSxPQUFPO1FBQ0gsT0FBTyxFQUFFLFlBQVk7UUFDckIsU0FBUyxFQUFFLENBQUM7Z0JBQ1IsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsTUFBTSxFQUFFLGdCQUFnQjtnQkFDeEIsU0FBUyxFQUFFO29CQUNQLE9BQU8sRUFBRSxHQUFHLFdBQVcsZ0JBQWdCO2lCQUMxQzthQUNKLENBQUM7S0FDTCxDQUFDO0FBQ04sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tIFwiQHB1bHVtaS9hd3NcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGFzc3VtZVJvbGVQb2xpY3lGb3JBd3NTZXJ2aWNlKHNlcnZpY2VOYW1lOiBBd3NTZXJ2aWNlKTogYXdzLmlhbS5Qb2xpY3lEb2N1bWVudCB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgVmVyc2lvbjogXCIyMDEyLTEwLTE3XCIsXG4gICAgICAgIFN0YXRlbWVudDogW3tcbiAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICAgICAgQWN0aW9uOiBcInN0czpBc3N1bWVSb2xlXCIsXG4gICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlOiBgJHtzZXJ2aWNlTmFtZX0uYW1hem9uYXdzLmNvbWAsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9XVxuICAgIH07XG59XG5cbmV4cG9ydCB0eXBlIEF3c1NlcnZpY2UgPSBcImxhbWJkYVwiO1xuIl19