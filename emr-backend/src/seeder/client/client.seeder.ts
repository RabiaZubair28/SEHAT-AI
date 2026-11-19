import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from 'src/clients/entities/client.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ClientSeeder {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) { }

  async seed() {
    console.log('Seeding API clients...');
    await this.ensureTableExists();

    const defaultClientKey =
      process.env.INCOMING_CLIENT_KEY ??
      '9f3c7b8e4a21d6f0c5b7a3e91d2f8c6a4e0b9d3f7a1c5e8b2f6d0a4c9e7b1f3';
    const defaultAllowedIps = this.parseAllowedIps(process.env.INCOMING_ALLOWED_IPS);

    const clientsToSeed: Array<{
      id: number;
      clientName: string;
      clientKey: string;
      status: string;
      allowedIps: string[];
    }> = [
        {
          id: 1,
          clientName: 'HRMIS',
          clientKey: defaultClientKey,
          status: 'active',
          allowedIps:
            defaultAllowedIps.length > 0 ? defaultAllowedIps : ['127.0.0.1', '::1'],
        },
        {
          id: 2,
          clientName: 'HR Data',
          clientKey: "9f3c7b8e4a21d6f0c5b7a3e91d2f8c6a4e0b9d3f7a1c5e8b2f6d0a4c9e737dh",
          status: 'active',
          allowedIps:
            defaultAllowedIps.length > 0 ? defaultAllowedIps : ['127.0.0.1', '::1'],
        },
      ];

    for (const clientData of clientsToSeed) {
      const existingClient = await this.clientRepository.findOne({
        where: [{ id: clientData.id }, { clientName: clientData.clientName }],
      });

      if (!existingClient) {
        const newClient = this.clientRepository.create(clientData);
        await this.clientRepository.save(newClient);
        console.log(`Created API client: ${clientData.clientName}`);
        continue;
      }

      existingClient.clientName = clientData.clientName;
      existingClient.clientKey = clientData.clientKey;
      existingClient.status = clientData.status;
      existingClient.allowedIps = clientData.allowedIps;

      await this.clientRepository.save(existingClient);
      console.log(`Updated API client: ${clientData.clientName}`);
    }

    console.log('API client seeding completed.');
  }

  private async ensureTableExists(): Promise<void> {
    await this.clientRepository.query(`
      CREATE TABLE IF NOT EXISTS "clients" (
        "id" SERIAL NOT NULL,
        "client_key" character varying(128) NOT NULL,
        "client_name" character varying(120) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "allowed_ips" text[] NOT NULL DEFAULT '{}'::text[],
        CONSTRAINT "PK_clients_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_clients_client_key" UNIQUE ("client_key"),
        CONSTRAINT "UQ_clients_client_name" UNIQUE ("client_name")
      )
    `);
  }

  private parseAllowedIps(value?: string): string[] {
    if (!value) {
      return [];
    }

    return value
      .split(',')
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0);
  }
}
