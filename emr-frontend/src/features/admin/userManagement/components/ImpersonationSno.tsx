import { useState } from "react";
import { useGenerateImpersonationLinkMutation } from "@/features/auth/services/authApiServices";
import { Button, Popover, Spin } from "antd";
import { CheckOutlined, CopyOutlined } from "@ant-design/icons";

interface ImpersonationSnoProps {
  userId: number;
  sno: number;
}

const ImpersonationSno = ({ userId, sno }: ImpersonationSnoProps) => {
  const [generate, { data, error, isError, isSuccess }] =
    useGenerateImpersonationLinkMutation();
  const [copied, setCopied] = useState(false);

  const errorMessage =
    (error as any)?.data?.error?.data?.message ||
    "Could not generate impersonation link";

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const renderContent = () => {
    if (isError) {
      return <p className="max-w-[360px] text-xs">{errorMessage}</p>;
    }

    if (isSuccess && data?.url) {
      return (
        <div className="flex max-w-[360px] items-start gap-2">
          <p className="flex-1 break-all select-text text-xs">{data.url}</p>
          <Button
            type="text"
            size="small"
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={() => handleCopy(data.url)}
          />
        </div>
      );
    }

    return <Spin size="small" />;
  };

  const handleOpenChange = (visible: boolean) => {
    if (visible) {
      generate(userId);
    }
  };

  return (
    <Popover
      trigger="hover"
      content={renderContent()}
      onOpenChange={handleOpenChange}
    >
      <span className="cursor-default">{sno}</span>
    </Popover>
  );
};

export default ImpersonationSno;