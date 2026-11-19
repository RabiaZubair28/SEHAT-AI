declare module "react-qr-scanner" {
    import { Component } from "react";

    interface QrScannerProps {
        delay?: number;
        style?: React.CSSProperties;
        onError?: (error: any) => void;
        onScan?: (data: any) => void;
        facingMode?: "user" | "environment";
    }

    export default class QrScanner extends Component<QrScannerProps> { }
}
