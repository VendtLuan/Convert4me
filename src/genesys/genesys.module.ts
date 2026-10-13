import { Module } from '@nestjs/common';
import { GenesysApiService } from './genesys-api.service';

@Module({
  providers: [GenesysApiService],
  exports: [GenesysApiService],
})
export class GenesysModule {}
