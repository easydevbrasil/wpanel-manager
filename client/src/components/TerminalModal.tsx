import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X, Terminal, RefreshCw } from "lucide-react";

interface TerminalModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    updateType: 'node' | 'python' | 'all';
}

export function TerminalModal({ open, onOpenChange, title, updateType }: TerminalModalProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState("");
    const [exitCode, setExitCode] = useState<number | null>(null);
    const outputRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Auto scroll to bottom when new output arrives
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    // Show toast notification when update completes
    useEffect(() => {
        if (exitCode !== null && !isRunning) {
            const success = exitCode === 0;
            const updateTypeDisplay = updateType === 'all' ? 'All packages' :
                updateType === 'node' ? 'Node.js' : 'Python';

            toast({
                title: success ? "Update Completed Successfully" : "Update Failed",
                description: success ?
                    `${updateTypeDisplay} updated successfully` :
                    `Failed to update ${updateTypeDisplay.toLowerCase()}. Check the terminal output for details.`,
                variant: success ? "default" : "destructive",
                duration: 5000,
            });
        }
    }, [exitCode, isRunning, updateType, toast]);

    const executeUpdate = async () => {
        setIsRunning(true);
        setOutput("");
        setExitCode(null);

        try {
            const response = await fetch('/api/system/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ type: updateType }),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setOutput(result.output || 'No output received');
            setExitCode(result.exitCode);

        } catch (error) {
            console.error('Error executing update:', error);
            setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
            setExitCode(1);
        } finally {
            setIsRunning(false);
        }
    };

    const handleClose = () => {
        if (!isRunning) {
            onOpenChange(false);
            setOutput("");
            setExitCode(null);
        }
    };

    const getStatusBadge = () => {
        if (isRunning) {
            return <Badge variant="secondary" className="animate-pulse">Running...</Badge>;
        }
        if (exitCode === null) {
            return <Badge variant="outline">Ready</Badge>;
        }
        return exitCode === 0
            ? <Badge variant="default" className="bg-green-600">Success</Badge>
            : <Badge variant="destructive">Failed</Badge>;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Terminal className="h-5 w-5" />
                            <DialogTitle>{title}</DialogTitle>
                            {getStatusBadge()}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            disabled={isRunning}
                            className="h-6 w-6 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex flex-col min-h-0">
                    {/* Terminal Output */}
                    <div
                        ref={outputRef}
                        className="flex-1 bg-black text-green-400 font-mono text-sm p-4 rounded border overflow-auto min-h-[300px] max-h-[400px]"
                        style={{ fontFamily: 'Monaco, "Cascadia Code", "Ubuntu Mono", monospace' }}
                    >
                        {output ? (
                            <pre className="whitespace-pre-wrap">{output}</pre>
                        ) : (
                            <div className="text-gray-500 italic">
                                Click "Start Update" to begin the update process...
                            </div>
                        )}
                        {isRunning && (
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-400">Processing...</span>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex-shrink-0 flex justify-between items-center pt-4">
                        <div className="flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Update Type: <code className="font-mono">{updateType}</code>
                            </span>
                            {(updateType === 'python' || updateType === 'all') && (
                                <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 px-2 py-1 rounded">
                                    Using --break-system-packages for Debian 12/Python 12+
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                disabled={isRunning}
                            >
                                Close
                            </Button>
                            <Button
                                onClick={executeUpdate}
                                disabled={isRunning}
                                className="flex items-center gap-2"
                            >
                                {isRunning ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Terminal className="h-4 w-4" />
                                        Start Update
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}