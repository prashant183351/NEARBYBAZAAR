import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  color?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sublabel, color }) => (
  <div
    className={`rounded shadow p-6 bg-white flex flex-col items-start border-l-4 ${color || 'border-blue-500'}`}
  >
    <div className="text-sm text-gray-500 mb-1">{label}</div>
    <div className="text-2xl font-bold mb-1">{value}</div>
    {sublabel && <div className="text-xs text-gray-400">{sublabel}</div>}
  </div>
);

export default KpiCard;
