// Imports para recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// CPU Chart Component
{cpuChartData && (
  <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <Activity className="w-4 h-4 text-blue-600" />
        CPU em Tempo Real
        <Badge variant="outline" className="ml-auto">
          {cpuChartData.current.toFixed(1)}%
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cpuChartData.data.map((value, index) => ({
            time: `${(cpuChartData.data.length - index - 1) * 2}s`,
            value: value,
            index: index
          })).reverse()}>
            <defs>
              <linearGradient id="gradient-cpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
            <XAxis 
              dataKey="time" 
              fontSize={10}
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <YAxis 
              fontSize={10}
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: any) => [`${value}%`, 'CPU']}
              labelFormatter={(label) => `${label} atrás`}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#gradient-cpu)"
              fillOpacity={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
)}

// RAM Chart Component
{ramChartData && (
  <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-green-600" />
        RAM em Tempo Real
        <Badge variant="outline" className="ml-auto">
          {ramChartData.current.toFixed(1)}%
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={ramChartData.data.map((value, index) => ({
            time: `${(ramChartData.data.length - index - 1) * 2}s`,
            value: value,
            index: index
          })).reverse()}>
            <defs>
              <linearGradient id="gradient-ram" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
            <XAxis 
              dataKey="time" 
              fontSize={10}
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <YAxis 
              fontSize={10}
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: any) => [`${value}%`, 'RAM']}
              labelFormatter={(label) => `${label} atrás`}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradient-ram)"
              fillOpacity={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
)}
