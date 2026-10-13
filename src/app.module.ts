import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { ConvertModule } from './convert/convert.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConvertModule,
  ],
})
export class AppModule {}
