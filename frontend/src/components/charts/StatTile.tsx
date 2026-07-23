interface StatTileProps {
  label: string;
  value: string | number;
}

export default function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="text-xs font-bold text-gray-500 uppercase">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}
