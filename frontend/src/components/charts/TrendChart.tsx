import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatDay } from '../../lib/dates';
export function TrendChart({
  data,
  color,
  valueLabel,
  formatValue,
  domain = [0, 'auto'],
}: {
  data: { localDate: string; value: number | null }[];
  color: string;
  valueLabel: string;
  formatValue: (value: number) => string;
  domain?: [number, number | 'auto'];
}) {
  return (
    <div className="trend-chart" aria-label={`${valueLabel} trend`}>
      <ResponsiveContainer width="100%" height={195} minWidth={0}>
        <AreaChart
          data={data}
          margin={{ top: 15, right: 12, bottom: 0, left: -18 }}
          accessibilityLayer
        >
          <CartesianGrid vertical={false} stroke="#edf0e8" />
          <XAxis
            dataKey="localDate"
            tickFormatter={(date: string) => formatDay(date, 'MMM d')}
            tick={{ fontSize: 9, fill: '#93a08a' }}
            axisLine={false}
            tickLine={false}
            minTickGap={35}
          />
          <YAxis
            domain={domain}
            tick={{ fontSize: 9, fill: '#93a08a' }}
            tickFormatter={(value: number) => String(Number(value.toFixed(1)))}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            labelFormatter={(label) => formatDay(String(label), 'MMM d')}
            formatter={(value) => [formatValue(Number(value)), valueLabel]}
            contentStyle={{
              border: '1px solid #e4e8df',
              borderRadius: 9,
              fontSize: 11,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.07}
            isAnimationActive={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
