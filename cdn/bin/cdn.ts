#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdnStack } from '../lib/cdn-stack';

const app = new cdk.App();
new CdnStack(app, 'CdnStack', {
  env: { account: '472312425428', region: 'us-east-1' }
});