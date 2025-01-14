import * as cron from 'node-cron';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { storage as dbStorage } from './storage';

const execAsync = promisify(exec);

export interface ScheduledTask {
    id: string;
    name: string;
    description: string;
    schedule: string;
    command: string;
    type: 'user' | 'system';
    category: string;
    status: 'active' | 'inactive' | 'running' | 'error';
    lastRun?: string;
    nextRun?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TaskExecutionResult {
    success: boolean;
    output: string;
    error?: string;
    executedAt: string;
    duration: number;
}

export class TaskScheduler {
    private scheduledJobs = new Map<string, cron.ScheduledTask>();
    private runningTasks = new Set<string>();

    constructor() {
        console.log('Task Scheduler initialized');
        this.loadAndScheduleAllTasks();
    }

    async loadAndScheduleAllTasks() {
        try {
            const tasks = await dbStorage.getScheduledTasks();
            console.log(`Loading ${tasks.length} scheduled tasks...`);

            for (const task of tasks) {
                if (task.status === 'active' && this.isValidCronExpression(task.schedule)) {
                    this.scheduleTask(task);
                }
            }

            console.log(`Scheduled ${this.scheduledJobs.size} active tasks`);
        } catch (error) {
            console.error('Error loading scheduled tasks:', error);
        }
    }

    scheduleTask(task: ScheduledTask) {
        try {
            // Remove existing job if it exists
            this.removeTask(task.id);

            if (!this.isValidCronExpression(task.schedule)) {
                console.error(`Invalid cron expression for task ${task.id}: ${task.schedule}`);
                return;
            }

            const job = cron.schedule(task.schedule, async () => {
                await this.executeTask(task);
            }, {
                // scheduled: false, // Don't start immediately
                timezone: process.env.TZ || 'America/Sao_Paulo'
            });

            this.scheduledJobs.set(task.id, job);
            job.start();

            console.log(`Scheduled task "${task.name}" (${task.id}) with cron: ${task.schedule}`);
        } catch (error) {
            console.error(`Error scheduling task ${task.id}:`, error);
        }
    }

    removeTask(taskId: string) {
        const job = this.scheduledJobs.get(taskId);
        if (job) {
            job.destroy();
            this.scheduledJobs.delete(taskId);
            console.log(`Removed scheduled task: ${taskId}`);
        }
    }

    updateTask(task: ScheduledTask) {
        // Remove and reschedule if active
        this.removeTask(task.id);
        if (task.status === 'active') {
            this.scheduleTask(task);
        }
    }

    async executeTask(task: ScheduledTask): Promise<TaskExecutionResult> {
        const startTime = Date.now();
        const executedAt = new Date().toISOString();

        // Prevent concurrent execution of the same task
        if (this.runningTasks.has(task.id)) {
            console.log(`Task ${task.id} is already running, skipping...`);
            return {
                success: false,
                output: '',
                error: 'Task already running',
                executedAt,
                duration: 0
            };
        }

        this.runningTasks.add(task.id);

        try {
            // Update task status to running
            await dbStorage.updateScheduledTask(parseInt(task.id), {
                status: 'running',
                lastRun: new Date(executedAt)
            });

            console.log(`Executing task "${task.name}" (${task.id}): ${task.command}`);

            let result: TaskExecutionResult;

            // Execute the command based on task category
            if (task.category === 'backup' && task.command.includes('proton')) {
                result = await this.executeBackupCommand(task);
            } else {
                result = await this.executeShellCommand(task.command);
            }

            const duration = Date.now() - startTime;
            result.duration = duration;
            result.executedAt = executedAt;

            // Log execution to database
            try {
                await dbStorage.createTaskExecutionLog({
                    taskId: parseInt(task.id),
                    status: result.success ? 'success' : 'error',
                    output: result.output,
                    error: result.error || null,
                    executedAt: new Date(executedAt),
                    duration
                });
            } catch (logError) {
                console.error('Error logging task execution:', logError);
            }

            // Update task status back to active
            await dbStorage.updateScheduledTask(parseInt(task.id), {
                status: 'active',
                lastRun: new Date(executedAt)
            });

            console.log(`Task "${task.name}" completed in ${duration}ms`);
            return result;

        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`Task "${task.name}" failed:`, error);

            const result: TaskExecutionResult = {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : String(error),
                executedAt,
                duration
            };

            // Update task status to error
            await dbStorage.updateScheduledTask(parseInt(task.id), {
                status: 'error',
                lastRun: new Date(executedAt)
            });

            // Log failed execution
            try {
                await dbStorage.createTaskExecutionLog({
                    taskId: parseInt(task.id),
                    status: 'error',
                    output: '',
                    error: result.error || 'Unknown error',
                    executedAt: new Date(executedAt),
                    duration
                });
            } catch (logError) {
                console.error('Error logging failed task execution:', logError);
            }

            return result;
        } finally {
            this.runningTasks.delete(task.id);
        }
    }

    private async executeShellCommand(command: string): Promise<TaskExecutionResult> {
        try {
            const { stdout, stderr } = await execAsync(command, {
                timeout: 300000, // 5 minutes timeout
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer
            });

            return {
                success: !stderr,
                output: stdout + (stderr || ''),
                error: stderr || undefined,
                executedAt: new Date().toISOString(),
                duration: 0 // Will be set by caller
            };
        } catch (error: any) {
            return {
                success: false,
                output: error.stdout || '',
                error: error.stderr || error.message,
                executedAt: new Date().toISOString(),
                duration: 0
            };
        }
    }

    private async executeBackupCommand(task: ScheduledTask): Promise<TaskExecutionResult> {
        try {
            // Special handling for Proton Drive backups
            const command = task.command;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

            // Replace variables in the command
            const processedCommand = command
                .replace(/\$\{timestamp\}/g, timestamp)
                .replace(/\$\{date\}/g, new Date().toISOString().split('T')[0]);

            console.log(`Executing backup command: ${processedCommand}`);

            const { stdout, stderr } = await execAsync(processedCommand, {
                timeout: 1800000, // 30 minutes timeout for backups
                maxBuffer: 1024 * 1024 * 50, // 50MB buffer
                env: {
                    ...process.env,
                    RCLONE_CONFIG: process.env.RCLONE_CONFIG || '/docker/config/rclone.conf'
                }
            });

            return {
                success: !stderr || stderr.includes('INFO'),
                output: stdout + (stderr || ''),
                error: stderr && !stderr.includes('INFO') ? stderr : undefined,
                executedAt: new Date().toISOString(),
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                output: error.stdout || '',
                error: error.stderr || error.message,
                executedAt: new Date().toISOString(),
                duration: 0
            };
        }
    }

    private isValidCronExpression(expression: string): boolean {
        try {
            return cron.validate(expression);
        } catch {
            return false;
        }
    }

    getScheduledTasksCount(): number {
        return this.scheduledJobs.size;
    }

    getRunningTasksCount(): number {
        return this.runningTasks.size;
    }

    getTaskStatus(taskId: string): 'scheduled' | 'running' | 'not-scheduled' {
        if (this.runningTasks.has(taskId)) return 'running';
        if (this.scheduledJobs.has(taskId)) return 'scheduled';
        return 'not-scheduled';
    }

    async getAllTaskLogs(taskId?: number, limit = 50) {
        try {
            if (taskId) {
                return await dbStorage.getTaskExecutionLogs(taskId, limit);
            } else {
                return await dbStorage.getAllTaskExecutionLogs(limit);
            }
        } catch (error) {
            console.error('Error getting task logs:', error);
            return [];
        }
    }

    destroy() {
        // Clean up all scheduled jobs
        for (const [taskId, job] of this.scheduledJobs) {
            job.destroy();
        }
        this.scheduledJobs.clear();
        this.runningTasks.clear();
        console.log('Task Scheduler destroyed');
    }
}

// Global task scheduler instance
export let taskScheduler: TaskScheduler | null = null;

export function initializeTaskScheduler() {
    if (!taskScheduler) {
        taskScheduler = new TaskScheduler();
    }
    return taskScheduler;
}

export function getTaskScheduler(): TaskScheduler | null {
    return taskScheduler;
}