import { Module } from '@nestjs/common';
import { GenesysModule } from '../genesys/genesys.module';
import { ConvertService } from './convert.service';
import { ConvertController } from './convert.controller';

@Module({
  imports: [GenesysModule],
  controllers: [ConvertController],
  providers: [ConvertService],
})
export class ConvertModule {}
