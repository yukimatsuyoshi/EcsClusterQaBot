import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as ssm from '@aws-cdk/aws-ssm';
import * as iam from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';


export class EcsClusterQaBotStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'EcsClusterQaBot-Table', {
      partitionKey: {
        name: "item_id",
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    const vpc = new ec2.Vpc(this, 'EcsClusterQaBot-Vpc', {
      maxAzs: 1,
      subnetConfiguration:[
        {
            name: "public",
            subnetType: ec2.SubnetType.PUBLIC
        },
      ],
      natGateways: 0
    })

    const cluster = new ecs.Cluster(this, "EcsClusterQaBot-Cluster", {
      vpc: vpc
    })

    const taskdef = new ecs.FargateTaskDefinition(this, "EcsClusterQaBot-TaskDef", {
      cpu: 1024,
      memoryLimitMiB: 4096
    })

    table.grantReadWriteData(taskdef.taskRole)
    taskdef.addToTaskRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ["ssm:GetParameter"]
      })
    )

    const container = taskdef.addContainer("EcsClusterQaBot-Container", {
      image: ecs.ContainerImage.fromRegistry("registry.gitlab.com/tomomano/intro-aws/handson03:latest"),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "EcsClusterQaBot",
        logRetention: logs.RetentionDays.ONE_DAY
      })
    })

    new ssm.StringParameter(this, "ECS_CLUSTER_NAME", {
      parameterName: "ECS_CLUSTER_NAME",
      stringValue: cluster.clusterName
    })
    new ssm.StringParameter(this, "ECS_TASK_DEFINITION_ARN", {
      parameterName: "ECS_TASK_DEFINITION_ARN",
      stringValue: taskdef.taskDefinitionArn
    })
    new ssm.StringParameter(this, "ECS_TASK_VPC_SUBNET_1", {
      parameterName: "ECS_TASK_VPC_SUBNET_1",
      stringValue: vpc.publicSubnets[0].subnetId
    })
    new ssm.StringParameter(this, "CONTAINER_NAME", {
      parameterName: "CONTAINER_NAME",
      stringValue: container.containerName
    })
    new ssm.StringParameter(this, "TABLE_NAME", {
      parameterName: "TABLE_NAME",
      stringValue: table.tableName
    })

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName
    })
    new cdk.CfnOutput(this, "TaskDefinitionArn", {
      value: taskdef.taskDefinitionArn
    })
  }
}
