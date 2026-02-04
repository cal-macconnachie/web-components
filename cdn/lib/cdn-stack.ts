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
import { FunctionUrlOrigin, HttpOrigin, S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { Architecture, Code, Function as LambdaFunction, FunctionUrlAuthType, Runtime } from 'aws-cdk-lib/aws-lambda'
import { BlockPublicAccess, Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import * as path from 'path'

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
    const mcpFunctionUrl = mcpLambda.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [cdk.aws_lambda.HttpMethod.GET, cdk.aws_lambda.HttpMethod.POST, cdk.aws_lambda.HttpMethod.OPTIONS],
        allowedHeaders: ['*'],
        maxAge: cdk.Duration.hours(1)
      }
    })

    // Certificate for MCP subdomain (CDK automatically deploys in us-east-1 for CloudFront)
    const mcpCertificate = new Certificate(this, 'mcp-certificate', {
      domainName: 'mcp.cdn.cals-api.com',
      validation: CertificateValidation.fromDns()
    })

    // Cache policy for MCP (no caching for dynamic API)
    const mcpCachePolicy = new CachePolicy(this, 'mcp-cache-policy', {
      cachePolicyName: 'cals-wcl-mcp-cache',
      comment: 'No caching for MCP server (dynamic API)',
      defaultTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.seconds(0),
      minTtl: cdk.Duration.seconds(0),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior: CacheHeaderBehavior.allowList('Authorization', 'Content-Type'),
      queryStringBehavior: CacheQueryStringBehavior.all(),
    })

    // Response headers policy for MCP
    const mcpResponseHeadersPolicy = new ResponseHeadersPolicy(this, 'mcp-response-headers', {
      responseHeadersPolicyName: 'cals-wcl-mcp-headers',
      comment: 'CORS and security headers for MCP server',
      corsBehavior: {
        accessControlAllowOrigins: ['*'],
        accessControlAllowHeaders: ['*'],
        accessControlAllowMethods: ['GET', 'POST', 'OPTIONS'],
        accessControlAllowCredentials: false,
        accessControlMaxAge: cdk.Duration.hours(1),
        originOverride: true,
      },
      securityHeadersBehavior: {
        contentTypeOptions: { override: true },
        referrerPolicy: { referrerPolicy: HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN, override: true },
        strictTransportSecurity: {
          accessControlMaxAge: cdk.Duration.days(365),
          includeSubdomains: true,
          override: true,
        },
      },
    })

    // CloudFront distribution for MCP subdomain
    const mcpDistribution = new Distribution(this, 'mcp-distribution', {
      defaultBehavior: {
        origin: new FunctionUrlOrigin(mcpFunctionUrl),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: mcpResponseHeadersPolicy,
        cachePolicy: mcpCachePolicy,
        allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
        compress: true,
      },
      domainNames: ['mcp.cdn.cals-api.com'],
      certificate: mcpCertificate,
      priceClass: PriceClass.PRICE_CLASS_100,
    })

    // Outputs for MCP server
    new cdk.CfnOutput(this, 'McpFunctionUrl', {
      value: mcpFunctionUrl.url,
      description: 'MCP Lambda Function URL',
      exportName: 'cals-wcl-mcp-function-url',
    })

    new cdk.CfnOutput(this, 'McpDistributionId', {
      value: mcpDistribution.distributionId,
      description: 'MCP CloudFront distribution ID',
      exportName: 'cals-wcl-mcp-distribution-id',
    })

    new cdk.CfnOutput(this, 'McpEndpoint', {
      value: 'https://mcp.cdn.cals-api.com',
      description: 'MCP Server endpoint',
      exportName: 'cals-wcl-mcp-endpoint',
    })
  }
}
