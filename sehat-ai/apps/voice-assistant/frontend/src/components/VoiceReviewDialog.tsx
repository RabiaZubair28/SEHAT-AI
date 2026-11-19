import { Alert, Button, Checkbox, Modal, Typography } from "antd";
import type { ExtractionResult } from "../types";

interface Props {
  result: ExtractionResult | null;
  selected: string[];
  onToggle: (name: string, checked: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const { Text } = Typography;

// AI results are suggestions only. Nothing reaches the EMR form until confirmed.
export default function VoiceReviewDialog({
  result, selected, onToggle, onCancel, onConfirm,
}: Props) {
  const fields = Object.entries(result?.fields ?? {});
  const locations = Object.entries(result?.references ?? {});
  const issues = result?.unresolved ?? [];

  return (
    <Modal
      title="Review voice suggestions"
      open={result !== null}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>Cancel</Button>,
        <Button
          key="apply"
          type="primary"
          disabled={!selected.length && !locations.length}
          onClick={onConfirm}
        >
          Confirm review
        </Button>,
      ]}
    >
      <Alert
        type="warning"
        showIcon
        message="Check each suggestion. Uncheck incorrect values."
        style={{ marginBottom: 12 }}
      />

      {fields.map(([name, field]) => (
        <div key={name} style={{ padding: "7px 0", borderBottom: "1px solid #f0f0f0" }}>
          <Checkbox checked={selected.includes(name)} onChange={(event) => onToggle(name, event.target.checked)}>
            <strong>{name.replace(/_/g, " ")}</strong>: {String(field.value)}
          </Checkbox>
          {field.raw_value && (
            <div style={{ marginLeft: 24 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Heard: {field.raw_value}</Text>
            </div>
          )}
        </div>
      ))}

      {locations.length > 0 && (
        <Alert
          type="info"
          style={{ marginTop: 14 }}
          message="Location names - select manually in EMR"
          description={locations.map(([name, ref]) => `${name}: ${ref.spoken_label}`).join(" · ")}
        />
      )}
      {issues.length > 0 && (
        <Alert
          type="warning"
          style={{ marginTop: 12 }}
          message="These values need manual correction"
          description={issues.map((issue) => `${issue.field_name}: ${issue.reason}`).join(" | ")}
        />
      )}
      {result && !fields.length && !locations.length && (
        <Text type="secondary">No fields were confidently extracted.</Text>
      )}
    </Modal>
  );
}
