import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { RadarCoordinates } from '../lib/api/types';
import { useAppStore } from '../store/useAppStore';

interface BioavailabilityRadarChartProps {
  radarData: RadarCoordinates;
}

export const BioavailabilityRadarChart: React.FC<BioavailabilityRadarChartProps> = ({ radarData }) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const chartData = [
    {
      subject: 'LIPO (LogP)',
      Target: radarData.LIPO,
      OptimalBoundary: 1.0,
      fullMark: 1.3,
    },
    {
      subject: 'SIZE (MW)',
      Target: radarData.SIZE,
      OptimalBoundary: 1.0,
      fullMark: 1.3,
    },
    {
      subject: 'POLAR (TPSA)',
      Target: radarData.POLAR,
      OptimalBoundary: 1.0,
      fullMark: 1.3,
    },
    {
      subject: 'INSOLU (Solub.)',
      Target: radarData.INSOLU,
      OptimalBoundary: 1.0,
      fullMark: 1.3,
    },
    {
      subject: 'INSATU (Sp3)',
      Target: radarData.INSATU,
      OptimalBoundary: 1.0,
      fullMark: 1.3,
    },
    {
      subject: 'FLEX (RotBonds)',
      Target: radarData.FLEX,
      OptimalBoundary: 1.0,
      fullMark: 1.3,
    },
  ];

  return (
    <div className="w-full h-[320px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke={isDark ? '#282a2e' : '#e2e4ea'} strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            stroke={isDark ? '#998f82' : '#86868b'}
            tick={{ fill: isDark ? '#e2e2e8' : '#1d1d1f', fontSize: 11, fontFamily: 'JetBrains Mono' }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 1.3]} tick={false} axisLine={false} />

          {/* Optimal Boundary Polygon (Champagne Gold) */}
          <Radar
            name="Optimal Bioavailability Envelope"
            dataKey="OptimalBoundary"
            stroke={isDark ? '#d4b483' : '#b87918'}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill={isDark ? '#f1cf9c' : '#d4b483'}
            fillOpacity={isDark ? 0.12 : 0.18}
          />

          {/* Candidate Molecule Polygon (Sage Green) */}
          <Radar
            name="Target Molecule"
            dataKey="Target"
            stroke={isDark ? '#99d3b4' : '#28875a'}
            strokeWidth={2.2}
            fill={isDark ? '#99d3b4' : '#28875a'}
            fillOpacity={isDark ? 0.35 : 0.4}
          />

          <Legend
            wrapperStyle={{
              fontSize: '11px',
              color: isDark ? '#d1c5b7' : '#515154',
              paddingTop: '10px',
              fontFamily: 'Geist, sans-serif',
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1a1c20' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
              borderRadius: '16px',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono',
              boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.6)' : '0 12px 30px rgba(0,0,0,0.1)',
              color: isDark ? '#e2e2e8' : '#1d1d1f',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
