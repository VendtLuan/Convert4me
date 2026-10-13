import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { ConvertModule } from './convert/convert.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ConvertModule,
  ],
})
export class AppModule {}
