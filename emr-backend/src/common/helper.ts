import { randomInt } from 'crypto';
import dayjs from './utils/dayjs.util';

export function generateMrNo(year: number, facilityId: number): number {
  const yy = year.toString().slice(-2);
  const randomNumber = randomInt(10000, 100000).toString();
  return parseInt(yy + facilityId.toString() + randomNumber, 10);
}

export function isUnderFive(dob: string): boolean {
  if (!dob) return false;
  const age = dayjs().diff(dayjs(dob), 'year');
  return age < 5;
}

export function generateErNo(facilityId: number): string {
  const now = new Date();
  const year = now.getFullYear() % 100;
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const facilityDigit = String(facilityId).slice(-1);
  const randomPart = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');

  return `ER-${year}${month}${facilityDigit}${randomPart}`;
}
