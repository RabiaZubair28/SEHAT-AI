import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { Client } from 'src/clients/entities/client.entity';
import { createDataSource } from 'src/data-source';
import { ClientSeeder } from './client.seeder';

dotenv.config();

const dataSource = createDataSource(true);

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSource.options),
    TypeOrmModule.forFeature([Client]),
  ],
  providers: [ClientSeeder],
  exports: [ClientSeeder],
})
export class ClientSeederModule {}
