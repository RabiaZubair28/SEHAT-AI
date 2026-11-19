import React, { useEffect, useState } from "react";
import { Modal, Spin, Typography, Upload, Button } from "antd";
import { CameraOutlined, UploadOutlined } from "@ant-design/icons";
import QrScanner from "react-qr-scanner";
import jsQR from "jsqr";

const { Text } = Typography;

type QRScannerModalProps = {
  open: boolean;
  onClose: () => void;
  onScanSuccess?: (value: string) => void;
  title?: string;
};

export const QRModal: React.FC<QRScannerModalProps> = ({
  open,
  onClose,
  onScanSuccess,
  title = "Immunisation card QR",
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraChecked, setCameraChecked] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      setCameraChecked(false);
      checkCameraSupport();
    }
  }, [open]);

  const checkCameraSupport = () => {
    const isInsecureContext =
      window.location.protocol === "http:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    if (isInsecureContext) {
      setUseFallback(true);
      setLoading(false);
      setError("Camera requires HTTPS. Using file upload mode.");
      setCameraChecked(true);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setUseFallback(true);
      setLoading(false);
      setError("Camera not supported in this browser.");
      setCameraChecked(true);
      return;
    }

    setUseFallback(false);
    setCameraChecked(true);
  };

  const handleScan = (data: any) => {
    setLoading(false);

    if (data) {
      const value = data.text || data;
      onScanSuccess?.(value);
      onClose();
    }
  };

  const handleError = (err: any) => {
    console.error("QR Scan Error:", err);
    setLoading(false);

    if (
      err.name === "NotAllowedError" ||
      err.name === "PermissionDeniedError"
    ) {
      setUseFallback(true);
      setError("Camera access denied. Using file upload mode.");
    }
  };

  const handleFileUpload = (file: File) => {
    setScanning(true);
    setError(null);

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const context = canvas.getContext("2d");
        if (!context) {
          setScanning(false);
          setError("Failed to process image.");
          return;
        }

        context.drawImage(img, 0, 0);

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        setScanning(false);

        if (code) {
          onScanSuccess?.(code.data);
          onClose();
        } else {
          setError("No QR code found. Please try again with a clearer image.");
        }
      };

      img.onerror = () => {
        setScanning(false);
        setError("Failed to load image.");
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      setScanning(false);
      setError("Failed to read file.");
    };

    reader.readAsDataURL(file);

    return false;
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={380}
      title={<div style={{ textAlign: "center", width: "100%" }}>{title}</div>}
    >
      <div style={{ position: "relative", minHeight: 260 }}>
        {(loading || scanning) && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255, 255, 255, 0.9)",
              zIndex: 10,
            }}
          >
            <Spin
              tip={scanning ? "Scanning QR code..." : "Initializing camera..."}
            />
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fff7e6",
              border: "1px solid #ffd591",
              borderRadius: 4,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text type="warning" style={{ fontSize: 13 }}>
              {error}
            </Text>
          </div>
        )}

        {cameraChecked && useFallback && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 260,
              gap: 16,
            }}
          >
            <CameraOutlined style={{ fontSize: 48, color: "#1890ff" }} />

            <Upload
              accept="image/*"
              beforeUpload={handleFileUpload}
              showUploadList={false}
              capture="environment"
            >
              <Button type="primary" icon={<UploadOutlined />} size="large">
                Take Photo / Upload Image
              </Button>
            </Upload>

            <Text
              type="secondary"
              style={{ textAlign: "center", fontSize: 12 }}
            >
              On mobile: Opens camera automatically
              <br />
              On desktop: Upload QR code image
            </Text>
          </div>
        )}

        {cameraChecked && !useFallback && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <QrScanner
              delay={300}
              onError={handleError}
              onScan={handleScan}
              style={{ width: "100%", height: 260 }}
            />
          </div>
        )}
      </div>

      {cameraChecked && !useFallback && (
        <Text
          type="secondary"
          style={{ display: "block", marginTop: 16, textAlign: "center" }}
        >
          Point your camera at a valid QR code.
        </Text>
      )}
    </Modal>
  );
};

export default QRModal;
