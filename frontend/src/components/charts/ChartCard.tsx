interface ChartCardProps {
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}

export default function ChartCard({ title, wide, children }: ChartCardProps) {
  return (
    <div
      className={`p-4 bg-white border border-gray-200 rounded-lg shadow-sm ${wide ? 'lg:col-span-2' : ''}`}
    >
      <div className="text-sm font-semibold text-gray-900 mb-3">{title}</div>
      {children}
    </div>
  );
}
