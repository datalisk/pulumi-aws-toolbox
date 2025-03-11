# Notebook Example App Built with Pulumi AWS Toolbox

Notebook is an open-source, serverless pastebin alternative that demonstrates how to deploy a modern web app to AWS using Pulumi and the pulumi-aws-toolbox library—all with about 100 lines of infrastructure code.

## Overview

Notebook leverages a fully serverless architecture to keep AWS costs nearly $0. It integrates several AWS services and modern web frameworks to provide a scalable, low-maintenance application:

- **Frontend:** Built with SvelteKit and styled with Tailwind CSS.
- **Backend:** With AWS Lambda for handling user data.
- **Static Assets:** Hosted on Amazon S3.
- **Content Delivery:** Using Amazon CloudFront.

A live demo is available at [https://notebook.datalisk.com](https://notebook.datalisk.com).


## Deployment

### Prerequisites

Before deploying the app, ensure you have the following installed and configured:

- **Node.js:** Version 18 or higher.
- **pnpm:** Install via:
  ```bash
  npm install -g pnpm
  ```
- **Pulumi CLI:** [Download and install Pulumi](https://www.pulumi.com/docs/get-started/install/).
- **AWS Credentials:** e.g. paste temporary session credentials into the console.
- **Pulumi Login:** Use either Pulumi's S3 backend or Pulumi Cloud. If using the S3 backend, you may find the `npx pulumi-aws-login` command useful, see the [docs](../../README.md#pulumi-aws-login).

### Stack creation

Follow these steps to build and deploy Notebook to your AWS account:

1. **Navigate to the Infrastructure Directory:**
   ```bash
   cd infra
   ```

2. **Install Project Dependencies:**
   ```bash
   pnpm install
   ```

3. **Initialize a New Pulumi Stack:**
   ```bash
   pulumi stack init
   ```

4. **Configure Required AWS Resources:**
   Notebook requires:
   - An existing AWS Route53 hosted zone (for DNS management).
   - An AWS ACM certificate in the us-east-1 region (for HTTPS).
   
   Create these resources manually if needed, then configure them in your Pulumi stack:
   ```bash
   pulumi config set acmCertificateArn_usEast1 "arn:aws:acm:us-east-1:xxx:certificate/xxx"
   pulumi config set hostedZoneId "AAAABBBB111122"
   ```

5. **Deploy the Application:**
   ```bash
   pulumi up
   ```

## Summary

Your app is fully deployed now.
This will also build and deploy the SvelteKit frontend to S3.

Use this example as a foundation for integrating additional AWS services or custom features. Enjoy building and extending your Notebook app!
