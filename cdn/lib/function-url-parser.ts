import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as cr from 'aws-cdk-lib/custom-resources'
import { Construct } from 'constructs'

export interface FunctionUrlParserProps {
  functionUrl: lambda.IFunctionUrl
}

/**
 * Custom resource that parses Lambda Function URL to extract domain name
 * Workaround for CloudFormation early validation bug with Fn::Select/Fn::Split
 */
export class FunctionUrlParser extends Construct {
  public readonly domainName: string

  constructor(scope: Construct, id: string, props: FunctionUrlParserProps) {
    super(scope, id)

    // Inline Lambda that parses the URL
    const parserFunction = new lambda.Function(this, 'Parser', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          const url = event.ResourceProperties.Url;
          const domain = new URL(url).hostname;

          if (event.RequestType === 'Delete') {
            return { PhysicalResourceId: domain };
          }

          return {
            PhysicalResourceId: domain,
            Data: { DomainName: domain }
          };
        };
      `),
      timeout: cdk.Duration.seconds(30)
    })

    // Custom resource provider
    const provider = new cr.Provider(this, 'Provider', {
      onEventHandler: parserFunction
    })

    // Custom resource that calls the parser
    const resource = new cdk.CustomResource(this, 'Resource', {
      serviceToken: provider.serviceToken,
      properties: {
        Url: props.functionUrl.url
      }
    })

    this.domainName = resource.getAttString('DomainName')
  }
}
