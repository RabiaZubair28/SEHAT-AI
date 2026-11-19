import asyncio
import io
import os

from faster_whisper import WhisperModel

from app.contracts.transcription import STTProvider, TranscriptionResult


class LocalWhisperSTTProvider(STTProvider):
    def __init__(self, model_size: str = "base"):
        self.model = WhisperModel(
            model_size,
            device=os.getenv("WHISPER_DEVICE", "cpu"),
            compute_type=os.getenv("WHISPER_COMPUTE_TYPE", "int8"),
        )

    async def transcribe(
        self,
        audio: bytes,
        filename: str,
        content_type: str | None = None,
    ) -> TranscriptionResult:

        def run_transcription():
            audio_stream = io.BytesIO(audio)

            # Keep hotwords short; they bias recognition but do not train it.
            hotwords = os.getenv("WHISPER_HOTWORDS", "").strip()
            segments, info = self.model.transcribe(
                audio_stream,
                beam_size=5,
                vad_filter=True,
                hotwords=hotwords or None,
            )

            text = " ".join(
                segment.text.strip()
                for segment in segments
            ).strip()

            return TranscriptionResult(
                text=text,
                language=info.language,
            )

        return await asyncio.to_thread(run_transcription)