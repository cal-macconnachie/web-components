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
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { BlockPublicAccess, Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

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
  }
}
