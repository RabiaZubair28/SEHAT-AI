import { PartialType } from '@nestjs/swagger';
import { CreateTalukaDto } from './create-taluka.dto';

export class UpdateTalukaDto extends PartialType(CreateTalukaDto) {}
