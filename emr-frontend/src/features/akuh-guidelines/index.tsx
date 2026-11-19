import { useState } from "react";
import { Input, Spin } from "antd";
import {
  ArrowLeftOutlined,
  SearchOutlined,
  RightOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  useGetGuidelinesQuery,
  useGetGuidelineContentQuery,
} from "@/services/guidelinesApi";

interface Guideline {
  id: number;
  title: string;
}

function GuidelineContent({ id, onBack }: { id: number; onBack: () => void }) {
  const { data, isLoading, isError } = useGetGuidelineContentQuery(id);

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 text-sm font-medium cursor-pointer px-3 py-2 rounded-lg transition-colors hover:bg-green-50"
        style={{ color: "var(--color-green-custom)" }}
      >
        <ArrowLeftOutlined /> Back to Guidelines
      </button>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spin size="large" />
        </div>
      )}

      {isError && (
        <div className="text-red-500 text-center py-8">
          Failed to load guideline content.
        </div>
      )}

      {data?.data && (
        <div>
          <h2
            className="text-xl font-bold mb-6 pb-3 border-b"
            style={{
              color: "var(--color-green-custom)",
              borderColor: "#e5e7eb",
            }}
          >
            {data.data.title}
          </h2>
          <div
            className="guideline-content prose max-w-none"
            dangerouslySetInnerHTML={{ __html: data.data.formatted_content }}
          />
        </div>
      )}
    </div>
  );
}

export default function AkuhGuidelines() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useGetGuidelinesQuery();

  const allGuidelines: Guideline[] = data?.data ?? [];

  const filtered = search.trim()
    ? allGuidelines.filter((g) =>
        g.title.toLowerCase().includes(search.toLowerCase()),
      )
    : allGuidelines;

  if (selectedId !== null) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <GuidelineContent id={selectedId} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div
        className="rounded-xl p-6 mb-6"
        style={{
          background:
            "linear-gradient(135deg, var(--color-green-custom) 0%, #1a6b45 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-lg p-2">
            <FileTextOutlined style={{ color: "white", fontSize: 20 }} />
          </div>
          <h1 className="text-2xl font-bold text-white">AKUH Guidelines</h1>
        </div>
        <p className="text-white/70 text-sm ml-12">
          AKUH Practical Clinical Guidelines | Government of Sindh EMR.
        </p>
      </div>

      {/* Search */}
      <Input
        prefix={
          <SearchOutlined style={{ color: "var(--color-green-custom)" }} />
        }
        placeholder="Search guidelines..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
        size="large"
        allowClear
        style={{ borderRadius: 10 }}
      />

      {/* Count */}
      {!isLoading && !isError && allGuidelines.length > 0 && (
        <p className="text-xs text-gray-400 mb-3">
          {filtered.length} guideline{filtered.length !== 1 ? "s" : ""}
          {search.trim() ? " found" : " available"}
        </p>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spin size="large" />
        </div>
      )}

      {isError && (
        <div className="text-red-500 text-center py-8">
          Failed to load guidelines. Please try again.
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="text-gray-400 text-center py-8">
          No guidelines found.
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
          {filtered.map((item, i) => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className="group flex items-center justify-between px-5 py-3.5 cursor-pointer transition-all duration-150"
              style={{
                borderBottom: i < filtered.length - 1 ? "1px solid #f0f0f0" : "none",
                borderLeft: "3px solid transparent",
                backgroundColor: i % 2 === 0 ? "white" : "#f9fdfb",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.backgroundColor = "#e8f5ee";
                el.style.borderLeftColor = "var(--color-green-custom)";
                el.style.paddingLeft = "22px";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.backgroundColor = i % 2 === 0 ? "white" : "#f9fdfb";
                el.style.borderLeftColor = "transparent";
                el.style.paddingLeft = "20px";
              }}
            >
              <span className="text-sm text-gray-700 group-hover:text-gray-900 group-hover:font-medium transition-all" style={{ lineHeight: "1.5" }}>
                {item.title}
              </span>
              <RightOutlined
                className="text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                style={{ color: "var(--color-green-custom)" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
