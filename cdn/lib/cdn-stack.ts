import * as cdk from 'aws-cdk-lib'
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager'
import {
  CacheHeaderBehavior,
  CachePolicy,
  CacheQueryStringBehavior,
  Distribution,
  HeadersFrameOption,
  HeadersReferrerPolicy,
  OriginAccessIdentity,
  PriceClass,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront'
import { HttpOrigin, S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { Architecture, Code, Function as LambdaFunction, FunctionUrlAuthType, Runtime } from 'aws-cdk-lib/aws-lambda'
import { BlockPublicAccess, Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import * as path from 'path'
import { FunctionUrlParser } from './function-url-parser'

export class CdnStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket with CORS configuration
    const bucket = new Bucket(this, 'cals-wcl', {
      bucketName: 'cals-wcl',
      versioned: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL, // Keep bucket private
      cors: [
        {
          allowedMethods: [HttpMethods.GET, HttpMethods.HEAD],
          allowedOrigins: ['*'], // Adjust to specific domains if needed
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    })

    // Create Origin Access Identity for CloudFront to access S3
    const originAccessIdentity = new OriginAccessIdentity(this, 'OAI', {
      comment: 'OAI for cals-wcl',
    })

    // Grant CloudFront read access to the bucket
    bucket.grantRead(originAccessIdentity)

    // Create Cache Policy for aggressive caching of static web components
    const cachePolicy = new CachePolicy(this, 'CachePolicy', {
      cachePolicyName: 'cals-wcl-cache',
      comment: 'Aggressive caching for static web components',
      defaultTtl: cdk.Duration.days(30),
      maxTtl: cdk.Duration.days(365),
      minTtl: cdk.Duration.seconds(0),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior: CacheHeaderBehavior.none(),
      queryStringBehavior: CacheQueryStringBehavior.none(),
    })

    // Create Response Headers Policy for CORS and security headers
    const responseHeadersPolicy = new ResponseHeadersPolicy(this, 'ResponseHeadersPolicy', {
      responseHeadersPolicyName: 'cals-wcl-headers',
      comment: 'CORS and security headers for web components',
      corsBehavior: {
        accessControlAllowOrigins: ['*'], // Adjust to specific domains if needed
        accessControlAllowHeaders: ['*'],
        accessControlAllowMethods: ['GET', 'HEAD'],
        accessControlAllowCredentials: false,
        accessControlMaxAge: cdk.Duration.hours(1),
        originOverride: true,
      },
      securityHeadersBehavior: {
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: HeadersFrameOption.DENY, override: true },
        referrerPolicy: { referrerPolicy: HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN, override: true },
        strictTransportSecurity: {
          accessControlMaxAge: cdk.Duration.days(365),
          includeSubdomains: true,
          override: true,
        },
      },
    })

    const certificate = new Certificate(this, 'domain-certificate', {
      domainName: 'cdn.cals-api.com',
      validation: CertificateValidation.fromDns(),
    })

    // MCP Server Lambda Function
    const mcpLambda = new LambdaFunction(this, 'mcp-server-lambda', {
      functionName: 'cals-wcl-mcp-server',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      handler: 'bundle.handler',
      code: Code.fromAsset(path.join(__dirname, '../lambda/dist')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: 'production'
      },
      description: 'MCP Server for Cal\'s Web Components Library'
    })

    // Create Function URL for the Lambda
    // Note: AllowedMethods must be 6 chars max. OPTIONS (7 chars) triggers PropertyValidation error
    const mcpFunctionUrl = mcpLambda.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [cdk.aws_lambda.HttpMethod.GET, cdk.aws_lambda.HttpMethod.POST, cdk.aws_lambda.HttpMethod.PUT, cdk.aws_lambda.HttpMethod.DELETE],
        allowedHeaders: ['*'],
        maxAge: cdk.Duration.hours(1)
      }
    })

    // Parse Function URL domain using Custom Resource
    const urlParser = new FunctionUrlParser(this, 'mcp-url-parser', {
      functionUrl: mcpFunctionUrl
    })

    const distribution = new Distribution(this, 'cals-wcl-distribution', {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessIdentity(bucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy,
        cachePolicy,
        compress: true, // Enable gzip/brotli compression
      },
      additionalBehaviors: {
        '/mcp/*': {
          origin: new HttpOrigin(urlParser.domainName, {
            protocolPolicy: cdk.aws_cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            originSslProtocols: [cdk.aws_cloudfront.OriginSslPolicy.TLS_V1_2],
          }),
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_DISABLED,
        }
      },
      domainNames: ['cdn.cals-api.com'],
      certificate: certificate,
      priceClass: PriceClass.PRICE_CLASS_100, // US, Canada, Europe only
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0), // Don't cache 404->index.html redirects
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
      ],
    })

    // Export bucket name and distribution ID for CI/CD
    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      description: 'S3 bucket name for web components',
      exportName: 'cals-wcl-bucket-name',
    })

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: 'cals-wcl-distribution-id',
    })

    // MCP Server outputs
    new cdk.CfnOutput(this, 'McpFunctionUrl', {
      value: mcpFunctionUrl.url,
      description: 'MCP Lambda Function URL',
      exportName: 'cals-wcl-mcp-function-url',
    })

    new cdk.CfnOutput(this, 'McpEndpoint', {
      value: 'https://cdn.cals-api.com/mcp/',
      description: 'MCP Server endpoint (via CloudFront)',
      exportName: 'cals-wcl-mcp-endpoint',
    })
  }
}
