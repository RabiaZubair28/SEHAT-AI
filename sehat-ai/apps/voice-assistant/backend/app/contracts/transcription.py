from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class TranscriptionResult:
    text: str
    language: str | None = None


class STTProvider(ABC):
    @abstractmethod
    async def transcribe(
        self,
        audio: bytes,
        filename: str,
        content_type: str | None = None,
    ) -> TranscriptionResult:
        """Convert audio into text."""
        pass