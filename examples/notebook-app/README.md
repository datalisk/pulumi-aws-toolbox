# Notebook App built with Pulumi AWS Toolbox

A open-source and serverless pastebin alternative.
It's a demonstration app for pulumi-aws-toolbox.

## Deploy

Follow these steps to build and deploy the app to your own AWS account.

- Go to "/infra"
- Create a new stack
  ```
  pulumi install
  pulumi stack init
  ```
- Configure account details
  ```
  pulumi config set acmCertificateArn_usEast1 "arn:aws:acm:us-east-1:xxx:certificate/xxx"
  pulumi config set hostedZoneId "Z2CLY78SS0IAPN"
  ```
- Deploy infrastructure
  ```
  pulumi up
  ```
- Deploy frontend. Go to /frontend and run:
  ```
  ./deploy.sh
  ```

Your app is fully deployed now.
