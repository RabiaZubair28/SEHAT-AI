
import { useEffect, useRef, useState } from "react";
import { Alert, Typography } from "antd";
import "../styles/voice-assistant.css";
import VoiceReviewDialog from "../components/VoiceReviewDialog";
import {
  AudioOutlined,
  LoadingOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  extractPatientRegistrationFields,
  interpretPatientRegistrationAudio,
} from "../services/voiceAssistantApi";
import type { ExtractionResult, PatientRegistrationSection } from "../types";

const { Text } = Typography;

type Stage =
  | "idle"
  | "recording"
  | "transcribing"
  | "extracting"
  | "review"
  | "completed";

interface Props {
  apiBaseUrl: string;
  section?: PatientRegistrationSection;
  mode?: "legacy" | "ai";
  onApply: (
    result: ExtractionResult,
    section: PatientRegistrationSection
  ) => void;
}

export default function PatientRegistrationVoice({
  apiBaseUrl,
  section = "personal_details",
  mode = "legacy",
  onApply,
}: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [level, setLevel] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ExtractionResult | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [locationHints, setLocationHints] = useState<string[]>([]);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);
  const busyRef = useRef(false);
  const onApplyRef = useRef(onApply);
  const previewSectionRef = useRef(section);

  useEffect(() => {
    onApplyRef.current = onApply;
  }, [onApply]);

  const cleanupAudio = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    streamRef.current?.getTracks().forEach(
      (track) => track.stop()
    );
    streamRef.current = null;

    const context = audioContextRef.current;
    audioContextRef.current = null;

    if (context) {
      void context.close().catch(() => { });
    }

    if (mountedRef.current) {
      setLevel(0);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;

      const recorder = recorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }

      recorderRef.current = null;

      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }

      streamRef.current?.getTracks().forEach(
        (track) => track.stop()
      );

      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => { });
      }
    };
  }, []);

  const processAudio = async (
    blob: Blob,
    recordedSection: PatientRegistrationSection,
    requestId: number
  ) => {
    if (!mountedRef.current) return;

    setStage("transcribing");

    try {
      const isMp4 = blob.type.includes("mp4");

      const file = new File(
        [blob],
        isMp4 ? "recording.m4a" : "recording.webm",
        { type: blob.type }
      );

      if (mode === "ai") {
        const result = await interpretPatientRegistrationAudio(
          apiBaseUrl, recordedSection, file
        );
        if (!mountedRef.current || requestId !== requestIdRef.current) return;

        setTranscript(result.transcript ?? "");
        setSelectedFields(Object.keys(result.fields ?? {}));
        previewSectionRef.current = recordedSection;
        setPreview(result);
        setStage("review");
        return;
      }

      const body = new FormData();
      body.append("file", file);

      const response = await fetch(
        `${apiBaseUrl.replace(/\/$/, "")}/api/voice-assistant/transcribe`,
        {
          method: "POST",
          body,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Transcription failed (${response.status})`
        );
      }

      const data: {
        transcript?: string;
        text?: string;
      } = await response.json();

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      const text = (
        data.transcript ?? data.text ?? ""
      ).trim();

      if (!text) {
        throw new Error("No speech detected.");
      }

      setTranscript(text);
      setStage("extracting");

      const result =
        await extractPatientRegistrationFields(
          apiBaseUrl,
          recordedSection,
          text
        );

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      onApplyRef.current(result, recordedSection);
      setStage("completed");
    } catch (caught) {
      if (
        mountedRef.current &&
        requestId === requestIdRef.current
      ) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Voice processing failed."
        );
        setStage("idle");
      }
    } finally {
      busyRef.current = false;
    }
  };

  const startRecording = async () => {
    if (busyRef.current) return;

    busyRef.current = true;
    setError("");
    setTranscript("");
    setLocationHints([]);
    setPreview(null);

    const requestId = ++requestIdRef.current;

    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      ) {
        throw new Error("Microphone recording is unavailable.");
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        stream.getTracks().forEach(
          (track) => track.stop()
        );
        busyRef.current = false;
        return;
      }

      streamRef.current = stream;
      chunksRef.current = [];

      const mime = ["audio/webm", "audio/mp4"].find(
        (type) => MediaRecorder.isTypeSupported(type)
      );

      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;
      const recordedSection = section;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type:
            recorder.mimeType ||
            mime ||
            "audio/webm",
        });

        recorderRef.current = null;
        cleanupAudio();

        if (!mountedRef.current) return;

        if (blob.size === 0) {
          busyRef.current = false;
          setStage("idle");
          setError("No audio was recorded.");
          return;
        }

        void processAudio(
          blob,
          recordedSection,
          requestId
        );
      };

      recorder.onerror = () => {
        ++requestIdRef.current;
        recorder.onstop = null;
        recorderRef.current = null;
        cleanupAudio();
        busyRef.current = false;

        if (mountedRef.current) {
          setStage("idle");
          setError("Recording failed.");
        }
      };

      recorder.start();
      setStage("recording");

      try {
        const context = new AudioContext();
        audioContextRef.current = context;

        const source =
          context.createMediaStreamSource(stream);

        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        const samples = new Uint8Array(
          analyser.fftSize
        );

        const update = () => {
          if (recorder.state !== "recording") return;

          analyser.getByteTimeDomainData(samples);

          let energy = 0;

          for (const sample of samples) {
            const amplitude = (sample - 128) / 128;
            energy += amplitude * amplitude;
          }

          const rms = Math.sqrt(
            energy / samples.length
          );

          setLevel(
            Math.min(1, Math.max(0.04, rms * 8))
          );

          animationRef.current =
            requestAnimationFrame(update);
        };

        update();
      } catch {
        // Audio recording does not depend on visualization.
      }
    } catch (caught) {
      cleanupAudio();
      busyRef.current = false;
      setStage("idle");
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not access microphone."
      );
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;

    if (recorder?.state === "recording") {
      recorder.stop();
      setStage("transcribing");
    }
  };

  const processing = stage === "transcribing" || stage === "extracting";

  const applyPreview = () => {
    if (!preview) return;
    if (!selectedFields.length && !Object.keys(preview.references ?? {}).length) return;

    // Apply only the fields the user approved. Location IDs are never guessed.
    const approvedFields = Object.fromEntries(
      Object.entries(preview.fields).filter(([name]) => selectedFields.includes(name))
    );
    if (selectedFields.length) {
      try {
        onApplyRef.current(
          { ...preview, fields: approvedFields, references: {}, engine: "ai" },
          previewSectionRef.current
        );
      } catch {
        setError("Could not apply the selected fields. Review the form.");
        return;
      }
    }
    setLocationHints(Object.entries(preview.references ?? {}).map(
      ([name, item]) => `${name}: ${item.spoken_label}`
    ));
    setPreview(null);
    setStage("completed");
  };

  return (
    <div
      className="voice-assistant-recorder"
      style={{
        background:
          "linear-gradient(115deg, #f2faf5 0%, #fff 75%)",
        border: "1px solid #dcefe2",
        borderRadius: 16,
        padding: "16px 20px",
        margin: "14px 0 20px",
        boxShadow:
          "0 4px 18px rgba(20,90,45,0.045)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          aria-label={
            stage === "recording"
              ? "Stop recording"
              : "Start recording"
          }
          disabled={processing}
          onClick={() => {
            if (stage === "recording") {
              stopRecording();
            } else {
              void startRecording();
            }
          }}
          style={{
            position: "relative",
            width: 62,
            height: 62,
            flexShrink: 0,
            borderRadius: "50%",
            border: "none",
            background:
              stage === "recording"
                ? "#d84949"
                : "#26894e",
            color: "#fff",
            fontSize: 23,
            cursor: processing
              ? "not-allowed"
              : "pointer",
            display: "grid",
            placeItems: "center",
            boxShadow:
              "0 4px 14px rgba(35,130,75,0.17)",
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: -7,
              border: `2px solid ${stage === "recording"
                  ? "#59b979"
                  : "#d1ebd9"
                }`,
              borderRadius: "50%",
              opacity:
                stage === "recording"
                  ? 0.45 + level * 0.45
                  : 0.8,
              transform:
                stage === "recording"
                  ? `scale(${1 + level * 0.3})`
                  : "scale(1)",
              transition:
                "transform 90ms ease-out, opacity 90ms",
              pointerEvents: "none",
            }}
          />

          {processing ? (
            <LoadingOutlined />
          ) : stage === "recording" ? (
            <StopOutlined />
          ) : (
            <AudioOutlined />
          )}
        </button>

        <div style={{ flex: "1 1 200px" }}>
          <Text strong style={{ display: "block" }}>
            {stage === "recording"
              ? "Listening..."
              : stage === "transcribing"
                ? "Transcribing..."
                : stage === "extracting"
                  ? "Understanding patient information..."
                  : stage === "review"
                    ? "Review AI suggestions"
                    : stage === "completed"
                    ? (mode === "ai" ? "Voice review completed" : "Patient fields updated")
                    : "Tap to start voice recording"}
          </Text>

          <Text
            type="secondary"
            style={{ fontSize: 12 }}
          >
            {stage === "recording"
              ? "Speak naturally. Tap again to stop."
              : "The patient registration form stays visible."}
          </Text>
        </div>
      </div>

      {mode === "ai" && locationHints.length > 0 && (
        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          message="Select these locations manually from the EMR dropdowns"
          description={locationHints.join(" · ")}
        />
      )}

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginTop: 16 }}
        />
      )}

      {transcript && (
        <div
          style={{
            marginTop: 16,
            background: "#fff",
            border: "1px solid #e6eee8",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            Transcript
          </Text>
          <div style={{ marginTop: 4 }}>
            <Text>{transcript}</Text>
          </div>
        </div>
      )}
      <VoiceReviewDialog
        result={preview}
        selected={selectedFields}
        onToggle={(name, checked) => setSelectedFields((current) =>
          checked ? [...current, name] : current.filter((item) => item !== name)
        )}
        onCancel={() => { setPreview(null); setStage("idle"); }}
        onConfirm={applyPreview}
      />
    </div>
  );
}
