# Notebook App built with Pulumi AWS Toolbox

A open-source and serverless pastebin alternative, created with just ~100 lines of infrastructure code.

It's a demo app on how to use pulumi-aws-toolbox, a library for deploying serverless web apps to the AWS cloud.

The UI of the app is built with SvelteKit and Tailwind. We're using AWS Lambda and S3 for the backend. So AWS cost should be almost $0.

An existing deployment is available at [https://notebook.datalisk.com](https://notebook.datalisk.com).

## Quick start

Follow these steps to build and deploy the app to your own AWS account.

- Install Nodejs >= 18
- Install pnpm e.g. with "npm install -g pnpm"
- Install the Pulumi CLI
- Go to "/infra"
- Run 'pnpm install'
- Paste AWS credentials and run 'npx pulumi-aws-login' to set up Pulumi to use your current AWS account (you need to create the bucket manually on first run)
- Create a new Pulumi infrastructure stack
  ```
  pulumi stack init
  ```
- The app needs an existing AWS Route53 hosted zone (for DNS) and an AWS ACM certificate (for HTTPS, in us-east-1 region). These are the only resources you need to create manually in AWS and they can be shared across applications.
Set them in your stack with:
  ```
  pulumi config set acmCertificateArn_usEast1 "arn:aws:acm:us-east-1:xxx:certificate/xxx"
  pulumi config set hostedZoneId "AAAABBBB111122"
  ```
- Deploy the app with
  ```
  pulumi up
  ```

Your app is fully deployed now.
This will also build and deploy the SvelteKit frontend to S3.
