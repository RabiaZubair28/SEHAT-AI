import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { ApiClientRequest } from 'src/auth/interfaces/api-client-request.interface';
import { Client } from 'src/clients/entities/client.entity';
import { CLIENT_KEY_HEADER } from 'src/common/app.constants';
import { Repository } from 'typeorm';

@Injectable()
export class ClientKeyAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ApiClientRequest>();
    const clientKey = this.extractClientKey(request);

    if (!clientKey) {
      throw new UnauthorizedException('Client key is missing');
    }

    const client = await this.clientRepository.findOne({
      where: {
        clientKey,
        status: 'active',
      },
      select: ['id', 'clientName', 'allowedIps'],
    });

    if (!client) {
      throw new UnauthorizedException('Invalid or inactive client key');
    }

    const requestIp = this.extractRequestIp(request);
    if (!requestIp) {
      throw new ForbiddenException('Request IP could not be determined');
    }

    const allowedIps = (client.allowedIps ?? [])
      .map((ip) => this.normalizeIp(ip))
      .filter((ip): ip is string => Boolean(ip));

    if (!allowedIps.length) {
      throw new ForbiddenException(
        'No allowed IPs are configured for this client',
      );
    }

    const isAllowed = this.isIpAllowed(requestIp, allowedIps);
    if (!isAllowed) {
      throw new ForbiddenException(
        `IP ${requestIp} is not allowed for this client`,
      );
    }

    request.apiClient = {
      id: client.id,
      name: client.clientName,
      ip: requestIp,
    };

    return true;
  }

  private extractClientKey(request: Request): string | undefined {
    const rawHeader = request.headers[CLIENT_KEY_HEADER];
    const key = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    const normalizedKey = key?.trim();
    return normalizedKey || undefined;
  }

  private extractRequestIp(request: Request): string | null {
    const forwardedFor = request.headers['x-forwarded-for'];
    const realIp = request.headers['x-real-ip'];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor;
    const realIpValue = Array.isArray(realIp) ? realIp[0] : realIp;

    return (
      this.normalizeIp(forwardedIp) ||
      this.normalizeIp(realIpValue) ||
      this.normalizeIp(request.ip) ||
      this.normalizeIp(request.socket?.remoteAddress) ||
      null
    );
  }

  private normalizeIp(ip?: string | null): string | null {
    if (!ip) {
      return null;
    }

    let normalized = ip.split(',')[0].trim();
    if (!normalized) {
      return null;
    }

    if (normalized.startsWith('::ffff:')) {
      normalized = normalized.slice(7);
    }

    if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(normalized)) {
      normalized = normalized.split(':')[0];
    }

    return normalized;
  }

  private isIpAllowed(requestIp: string, allowedEntries: string[]): boolean {
    return allowedEntries.some((entry) => {
      if (entry === requestIp) {
        return true;
      }

      if (this.isIpv4Cidr(entry) && this.isIpv4(requestIp)) {
        return this.isIpv4InCidr(requestIp, entry);
      }

      return false;
    });
  }

  private isIpv4(ip: string): boolean {
    return this.ipv4ToInt(ip) !== null;
  }

  private isIpv4Cidr(value: string): boolean {
    return /^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/.test(value);
  }

  private isIpv4InCidr(ip: string, cidr: string): boolean {
    const [baseIp, prefixText] = cidr.split('/');
    const prefix = Number(prefixText);

    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      return false;
    }

    const ipInt = this.ipv4ToInt(ip);
    const baseInt = this.ipv4ToInt(baseIp);

    if (ipInt === null || baseInt === null) {
      return false;
    }

    const mask =
      prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;

    return (ipInt & mask) === (baseInt & mask);
  }

  private ipv4ToInt(ip: string): number | null {
    const parts = ip.split('.');
    if (parts.length !== 4) {
      return null;
    }

    const octets = parts.map((part) => Number(part));
    if (
      octets.some(
        (octet) =>
          !Number.isInteger(octet) || octet < 0 || octet > 255,
      )
    ) {
      return null;
    }

    return (
      (((octets[0] << 24) >>> 0) |
        (octets[1] << 16) |
        (octets[2] << 8) |
        octets[3]) >>>
      0
    );
  }
}
