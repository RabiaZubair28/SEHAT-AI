import { Injectable } from '@nestjs/common';
import { CreateTokenCounterDto } from './dto/create-token-counter.dto';
import { UpdateTokenCounterDto } from './dto/update-token-counter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenCounter } from './entities/token-counter.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TokenCounterService {
  constructor(
    @InjectRepository(TokenCounter)
    private readonly tokenCounterRepository: Repository<TokenCounter>,
  ) {}

  async getNextToken(): Promise<string> {
    const today = new Date().toISOString().slice(0, 10);
    let tokenRecord = await this.tokenCounterRepository.findOneBy({
      date: today,
    });

    if (!tokenRecord) {
      tokenRecord = this.tokenCounterRepository.create({
        date: today,
        lastToken: 1,
      });
    } else {
      tokenRecord.lastToken += 1;
    }

    await this.tokenCounterRepository.save(tokenRecord);

    return tokenRecord.lastToken.toString().padStart(4, '0');
  }
}
