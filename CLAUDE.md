# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands

```bash
npm run build    # Compile TypeScript to dist/
npm run test     # Run all tests with Jest
npx jest src/path/to/file.spec.ts  # Run a single test file
```

## Architecture

This is a Pulumi component library (`@datalisk/pulumi-aws-toolbox`) for deploying serverless AWS infrastructure. It uses TypeScript and compiles to CommonJS.

### Module Structure

The library exports namespaced modules via `src/index.ts`:
- `pat.website` - StaticWebsite with CloudFront + S3, Lambda integration, CloudFront functions
- `pat.vpc` - IPv6-focused VPC with public/private subnets, Jumphost, security groups
- `pat.ci` - S3ArtifactStore for build artifacts, S3Folder abstraction
- `pat.database` - Ec2PostgresqlDatabase for self-hosted PostgreSQL on EC2
- `pat.lambda` - SimpleNodeLambda with sensible defaults
- `pat.ses` - SesProxyMailer for cross-account email via Lambda
- `pat.util` - IAM, SSM, and Pulumi utilities

### Key Design Patterns

**StaticWebsite routing**: Routes are defined with a `RouteType` enum (S3, Lambda, SingleAsset, Custom) that determines how CloudFront forwards requests.

**S3ArtifactStore + S3Folder**: Build artifacts are stored in S3 with a folder abstraction (`bucket/artifact-name/version`). The artifact store creates the bucket; `getArtifact()` returns an S3Folder reference for use in website routes.

**VPC architecture**: Three availability zones with public subnets (IPv4+IPv6 internet access) and private subnets (IPv6-only egress, no inbound). No NAT gateways by design.

**CloudFront functions**: `ViewerRequestFunction` and `ViewerResponseFunction` in `src/website/cloudfront-function.ts` chain handlers for request/response processing.
