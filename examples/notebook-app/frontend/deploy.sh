#!/usr/bin/env bash
set -e

pnpm i
pnpm run build

BUCKET=$(cd ../infra && pulumi stack output frontendArtifactBucket)
aws s3 cp --recursive ./build "s3://$BUCKET/frontend/latest/"
