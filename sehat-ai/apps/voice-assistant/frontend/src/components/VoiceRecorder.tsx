
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

export interface TranscriptionResult {
  transcript: string;
  detected_language: string | null;
  provider: string;
}

interface VoiceAssistantProps {
  apiBaseUrl: string;
  onTranscriptionComplete?: (
    result: TranscriptionResult
  ) => void;
}

export function VoiceRecorder({
  apiBaseUrl,
  onTranscriptionComplete,
}: VoiceAssistantProps) {
  const [audioFile, setAudioFile] = useState<File | null>(
    null
  );
  const [result, setResult] =
    useState<TranscriptionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }

      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
    };
  }, []);

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] ?? null;

    setAudioFile(file);
    setResult(null);
    setError(null);
  };

  const startRecording = async () => {
    if (recording || loading) return;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Microphone recording is not supported."
        );
      }

      if (typeof MediaRecorder === "undefined") {
        throw new Error(
          "MediaRecorder is not supported."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      if (!mountedRef.current) {
        stream
          .getTracks()
          .forEach((track) => track.stop());
        return;
      }

      const mimeType = [
        "audio/webm",
        "audio/mp4",
      ].find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        if (mountedRef.current) {
          setError("Recording failed.");
          setRecording(false);
        }

        stream
          .getTracks()
          .forEach((track) => track.stop());
      };

      recorder.onstop = () => {
        const type =
          recorder.mimeType || "audio/webm";

        const blob = new Blob(
          chunksRef.current,
          { type }
        );

        if (mountedRef.current) {
          if (blob.size > 0) {
            const extension = type.includes("mp4")
              ? "m4a"
              : "webm";

            setAudioFile(
              new File(
                [blob],
                `recording.${extension}`,
                { type }
              )
            );
          } else {
            setError("No audio was recorded.");
          }

          setRecording(false);
        }

        stream
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
        recorderRef.current = null;
        chunksRef.current = [];
      };

      setError(null);
      setResult(null);
      setAudioFile(null);

      recorder.start();
      setRecording(true);
    } catch (err) {
      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;

      if (mountedRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Microphone access failed."
        );
      }
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile || loading || recording) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/voice-assistant/transcribe`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Transcription failed (${response.status})`
        );
      }

      const data: TranscriptionResult =
        await response.json();

      if (mountedRef.current) {
        setResult(data);

        if (data.transcript?.trim()) {
          onTranscriptionComplete?.(data);
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <section>
      <h2>SEHAT AI — Voice Assistant</h2>

      <p>
        Record your voice or upload an audio file.
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={startRecording}
          disabled={recording || loading}
        >
          Start Recording
        </button>

        <button
          type="button"
          onClick={stopRecording}
          disabled={!recording}
        >
          Stop Recording
        </button>
      </div>

      {recording && (
        <p role="status">
          Recording in progress...
        </p>
      )}

      <div style={{ marginTop: 20 }}>
        <label htmlFor="voice-audio-file">
          Or upload audio:
        </label>

        <input
          id="voice-audio-file"
          type="file"
          accept="audio/*,.m4a"
          onChange={handleFileChange}
          disabled={recording || loading}
        />
      </div>

      {audioFile && (
        <p>Audio ready: {audioFile.name}</p>
      )}

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={handleTranscribe}
          disabled={
            !audioFile || loading || recording
          }
        >
          {loading
            ? "Transcribing..."
            : "Transcribe Audio"}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          style={{ color: "crimson" }}
        >
          {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>Transcript</h3>

          <p>
            {result.transcript ||
              "No speech detected."}
          </p>

          <p>
            <strong>Language:</strong>{" "}
            {result.detected_language ?? "Unknown"}
          </p>

          <p>
            <strong>Provider:</strong>{" "}
            {result.provider}
          </p>
        </div>
      )}
    </section>
  );
}
