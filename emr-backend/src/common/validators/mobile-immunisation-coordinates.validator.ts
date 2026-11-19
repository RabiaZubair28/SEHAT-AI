import { BadRequestException } from '@nestjs/common';
import { ImmunisationDosageStatus } from 'src/common/enums/enums';

interface DoseCoordinatesCheck {
  vaccine_id: number;
  status?: ImmunisationDosageStatus;
  latitude?: number;
  longitude?: number;
}

export function assertNewAdministeredCoordinates(
  doses: DoseCoordinatesCheck[],
  isMobile?: boolean,
): void {
  if (!isMobile || !Array.isArray(doses)) {
    return;
  }

  const offending = doses
    .map((dose, index) => ({ dose, index }))
    .filter(({ dose }) => {
      return (
        dose.status === ImmunisationDosageStatus.ADMINISTERED &&
        (dose.latitude == null || dose.longitude == null)
      );
    });

  if (offending.length) {
    throw new BadRequestException(
      `latitude and longitude are required for newly administered doses when on mobile. ` +
        `Missing on: ${offending
          .map(
            ({ dose, index }) =>
              `dose ${index + 1} (vaccine_id ${dose.vaccine_id}, status ${dose.status})`,
          )
          .join(', ')}`,
    );
  }
}
