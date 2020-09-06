#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EcsClusterQaBotStack } from '../lib/ecs_cluster_qa_bot-stack';

const app = new cdk.App();
new EcsClusterQaBotStack(app, 'EcsClusterQaBotStack');
