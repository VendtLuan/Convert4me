import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { ConvertModule } from './convert/convert.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [ConvertModule],
  controllers: [AppController],
})
export class AppModule {}
