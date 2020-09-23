import { GolbalAuroraRDSMaster, InstanceTypeEnum, GolbalAuroraRDSSlaveInfra } from './index';
//import { GolbalAuroraRDSMaster, InstanceTypeEnum } from './index';
import { App, Stack, CfnOutput } from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

const mockApp = new App();
const envSingapro  = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'ap-southeast-1' };
const envTokyo = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'ap-northeast-1' };

const stackM = new Stack(mockApp, 'testing-stackM',{env: envTokyo});
const VPCPublic = new ec2.Vpc(stackM,'defaultVpc',{
  natGateways: 0,
  maxAzs: 3,
  subnetConfiguration: [{
    cidrMask: 26,
    name: 'RunnerVPC',
    subnetType: ec2.SubnetType.PUBLIC,
  }],
});
const  GdbM = new GolbalAuroraRDSMaster(stackM, 'testing',{
  instanceType: InstanceTypeEnum.R5_LARGE,
  vpc: VPCPublic,
});
GdbM.rdsCluster.connections.allowDefaultPortFrom(ec2.Peer.ipv4(`${process.env.MYIP}/32`))

const stackS = new Stack(mockApp, 'testing-stackS',{env: envSingapro});
const VPCPublic2 = new ec2.Vpc(stackS,'defaultVpc2',{
  natGateways: 0,
  maxAzs: 3,
  subnetConfiguration: [{
    cidrMask: 26,
    name: 'RunnerVPC2',
    subnetType: ec2.SubnetType.PUBLIC,
  }],
});
new GolbalAuroraRDSSlaveInfra(stackS, 'Slaveregion',{vpc: VPCPublic2,subnetType:ec2.SubnetType.PUBLIC });

stackM.addDependency(stackS)


new CfnOutput(stackM, 'password', { value: GdbM.rdsPassword });

GdbM.addRegionalCluster(stackM,'addregionalrds',{
  region: 'ap-southeast-1',
  dbSubnetGroupName: 'testing-stacks-publicsubnetgroup',
});