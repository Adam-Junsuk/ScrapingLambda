//Users/adam/scraping-lambda/lambda.ts
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { RequestListener } from 'http';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import express from 'express';

// AWS Lambda와 관련된 타입을 임포트합니다.
import { Context, Handler } from 'aws-lambda';

// 소스 맵 지원을 위해 필요합니다.
require('source-map-support/register');

// AWS Lambda에서 Express 앱을 실행하기 위한 라이브러리입니다.
import { configure as serverlessExpress } from '@vendia/serverless-express';

// Swagger 설정을 위한 모듈을 임포트합니다.
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
//src/lambda.ts
// AWS Lambda에서 재사용할 수 있도록 앱 인스턴스를 캐시합니다.
let cachedApp: RequestListener | null = null; // 타입을 RequestListener로 변경

// Swagger 설정을 위한 함수입니다.
function setupSwagger(app: INestApplication) {
  const version = process.env.npm_package_version ?? '0.0.0';
  const title = process.env.npm_package_name ?? 'Title';
  const description = process.env.npm_package_description ?? 'Description';
  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .build();
  const options: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  };
  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: title,
  };
  const document = SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('docs', app, document, customOptions);
}

// NestJS 앱을 부트스트랩하는 함수입니다.
async function bootstrapServer(): Promise<RequestListener> {
  if (!cachedApp) {
    const expressApp = express();
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      {
        logger: ['error', 'warn', 'debug'],
      },
    );
    setupSwagger(nestApp);

    nestApp.useGlobalPipes(new ValidationPipe());
    nestApp.enableVersioning({ type: VersioningType.URI });
    await nestApp.init();
    cachedApp = expressApp as unknown as RequestListener; // 명시적 타입 변환
  }
  return cachedApp;
}

// AWS Lambda 핸들러 함수입니다.
export const handler: Handler = async (event: any, context: Context) => {
  const app = await bootstrapServer();
  const serverlessExpressHandler = serverlessExpress({ app });
  return serverlessExpressHandler(event, context);
};
