#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdnStack } from '../lib/cdn-stack';

const app = new cdk.App();
new CdnStack(app, 'CdnStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
  crossRegionReferences: true
});