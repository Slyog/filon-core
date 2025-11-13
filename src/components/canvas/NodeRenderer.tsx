"use client";

export const nodeTypes = {
  default: ({ data }: { data: { label?: string } }) => (
    <div className="p-2 rounded border bg-white text-black text-sm">{data.label}</div>
  ),
  goal: ({ data }: { data: { label?: string } }) => (
    <div className="p-2 rounded bg-black text-white text-sm">{data.label}</div>
  ),
  track: ({ data }: { data: { label?: string } }) => (
    <div className="p-2 rounded bg-gray-200 text-black text-sm">{data.label}</div>
  ),
};

