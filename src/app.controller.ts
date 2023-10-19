// Users/adam/scraping-lambda/src/app.controller.ts
import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly scrappingService: AppService) {}
  private readonly logger = new Logger(AppService.name);

  @Get('startScrapping')
  async startScrapping() {
    console.log('GET 요청이 /startScrapping로 들어왔습니다.');

    // 스크래핑 로직을 실행합니다.
    const result = await this.scrappingService.startScrapping();

    return result;
  }
}
