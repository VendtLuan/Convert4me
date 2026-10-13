import { Injectable } from '@nestjs/common';
import { CreateConvertDto } from './dto/create-convert.dto';
import { UpdateConvertDto } from './dto/update-convert.dto';

@Injectable()
export class ConvertService {
  create(createConvertDto: CreateConvertDto) {
    return 'This action adds a new convert';
  }

  findAll() {
    return `This action returns all convert`;
  }

  findOne(id: number) {
    return `This action returns a #${id} convert`;
  }

  update(id: number, updateConvertDto: UpdateConvertDto) {
    return `This action updates a #${id} convert`;
  }

  remove(id: number) {
    return `This action removes a #${id} convert`;
  }
}
