import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AKUH_GUIDELINES_BASE_URL } from 'src/common/app.constants';

@Injectable()
export class AkuhGuidelinesService {
  private readonly guidelinesApiKey: string;
  private readonly contentApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.guidelinesApiKey = this.configService.get<string>(
      'AKUH_GUIDELINES_API_KEY',
    )!;
    this.contentApiKey = this.configService.get<string>(
      'AKUH_GUIDELINES_CONTENT_API_KEY',
    )!;
  }

  async getAllGuidelines() {
    const url = `${AKUH_GUIDELINES_BASE_URL}/get_guidelines.php?api_key=${this.guidelinesApiKey}`;
    const response = await fetch(url);
    const json = await response.json();

    if (!json.success) {
      throw new InternalServerErrorException(
        json.message ?? 'Failed to fetch guidelines',
      );
    }

    return json.data as { id: number; title: string }[];
  }

  async getGuidelineContent(id: number) {
    const url = `${AKUH_GUIDELINES_BASE_URL}/get_guidelines_content.php?id=${id}&api_key=${this.contentApiKey}`;
    const response = await fetch(url);
    const json = await response.json();

    if (!json.success) {
      throw new NotFoundException(json.message ?? 'Guideline not found');
    }

    return json.data as {
      id: number;
      title: string;
      formatted_content: string;
    };
  }
}
