import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Interface for container statistics
export interface ContainerStats {
    cpu: number;
    memory: number;
    timestamp: string;
    raw?: {
        cpuUsage: number;
        memoryLimit: number;
        numberOfCpus: number;
    };
    source?: string;
    mock?: boolean;
    error?: string;
}

// Interface for historical data points
export interface StatsDataPoint {
    time: number;
    cpu: number;
    memory: number;
}

// Hook to fetch container statistics
export function useContainerStats(containerId: string, enabled: boolean = true) {
    return useQuery<ContainerStats>({
        queryKey: ["/api/docker/containers", containerId, "stats"],
        queryFn: () => apiRequest(`/api/docker/containers/${containerId}/stats`),
        refetchInterval: enabled ? 2000 : false, // Update every 2 seconds
        refetchIntervalInBackground: true,
        staleTime: 1000, // Consider data stale after 1 second
        enabled: enabled && !!containerId,
        retry: 2,
        retryDelay: 500,
    });
}

// Function to generate historical data from current stats
export function generateHistoricalData(currentStats: ContainerStats, previousData?: StatsDataPoint[]): StatsDataPoint[] {
    const maxDataPoints = 20;

    // If we have previous data, update it
    if (previousData && previousData.length > 0) {
        const newData = [...previousData];

        // Add new data point
        const newPoint = {
            time: Date.now(),
            cpu: currentStats.cpu,
            memory: currentStats.memory
        };

        newData.push(newPoint);

        // Keep only the last maxDataPoints
        if (newData.length > maxDataPoints) {
            newData.shift();
        }

        return newData;
    }

    // Initial data - create array with current value repeated
    return Array.from({ length: Math.min(maxDataPoints, 5) }, (_, i) => ({
        time: Date.now() - (maxDataPoints - 1 - i) * 2000, // 2 second intervals
        cpu: currentStats.cpu,
        memory: currentStats.memory,
    }));
}