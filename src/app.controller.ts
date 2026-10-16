import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Redirect('/health', 302)
  root(): void {}

  @Get('health')
  health(): { message: string } {
    return { message: 'Ok' };
  }
}
