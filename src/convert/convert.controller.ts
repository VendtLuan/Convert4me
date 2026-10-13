import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ConvertService } from './convert.service';
import { CreateConvertDto } from './dto/create-convert.dto';
import { UpdateConvertDto } from './dto/update-convert.dto';

@Controller('convert')
export class ConvertController {
  constructor(private readonly convertService: ConvertService) {}

  @Post()
  create(@Body() createConvertDto: CreateConvertDto) {
    return this.convertService.create(createConvertDto);
  }

  @Get()
  findAll() {
    return this.convertService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.convertService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateConvertDto: UpdateConvertDto) {
    return this.convertService.update(+id, updateConvertDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.convertService.remove(+id);
  }
}
