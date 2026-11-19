export enum TelehealthRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  IN_SESSION = 'in_session',
  COMPLETED = 'completed',
}

export enum TelehealthSessionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  ENDED = 'ended',
  FAILED = 'failed',
}

export enum TelehealthMeetingProvider {
  GOOGLE_MEET = 'google_meet',
}

export enum TelehealthAvailabilityStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
  UNAVAILABLE = 'unavailable',
}
