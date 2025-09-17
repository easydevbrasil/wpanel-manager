import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Edit,
    Trash2,
    Calendar,
    CreditCard,
    FileText,
    DollarSign,
    Bell,
    Zap
} from "lucide-react";

interface Expense {
    id: string;
    description: string;
    amount: number;
    amountConverted?: number; // Valor sempre em BRL
    currency?: string;
    originalAmount?: number;
    category: string;
    subcategory?: string;
    date: string;
    dueDate?: string;
    scheduledDate?: string;
    notes?: string;
    paymentMethod: string;
    providerId?: number;
    providerName?: string;
    recurring: boolean;
    recurringPeriod?: string;
    reminderEnabled: boolean;
    reminderDaysBefore?: number;
    status: "pending" | "paid" | "overdue";
    createdAt: string;
    updatedAt: string;
}

interface ExpenseCardProps {
    expense: Expense;
    onEdit: (expense: Expense) => void;
    onDelete: (id: string, description: string) => void;
    getCategoryIcon: (category: string) => React.ReactNode;
    getPaymentMethodColor: (method: string) => string;
    getPaymentMethodName: (method: string) => string;
    formatCurrency: (value: number) => string;
    isDeleting?: boolean;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
    expense,
    onEdit,
    onDelete,
    getCategoryIcon,
    getPaymentMethodColor,
    getPaymentMethodName,
    formatCurrency,
    isDeleting = false
}) => {
    const currency = (expense as any).currency || 'BRL';
    const isInternationalCurrency = currency !== 'BRL';

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800 border-green-200';
            case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'paid': return 'Pago';
            case 'overdue': return 'Vencido';
            default: return 'Pendente';
        }
    };

    return (
        <Card className="h-full hover:shadow-md transition-shadow duration-200 border-l-4 border-l-blue-500 flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                        <div className="flex items-center gap-1">
                            {getCategoryIcon(expense.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base leading-tight mb-1 truncate">
                                {expense.description}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(expense.date), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(expense)}
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(expense.id, expense.description)}
                            disabled={isDeleting}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                    {/* Amount Section */}
                    <div className="flex items-center justify-between p-2 bg-accent/20 rounded-lg border">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium">Valor</span>
                        </div>
                        <div className="text-right">
                            {isInternationalCurrency ? (
                                <div>
                                    <div className="text-base font-bold">
                                        {formatCurrency(parseFloat(expense.amountConverted || expense.amount))}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        Original: {currency} {parseFloat(expense.originalAmount || expense.amount).toFixed(2)}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-base font-bold">
                                    {formatCurrency(parseFloat(expense.amount))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Category & Payment Info */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Categoria
                            </div>
                            <Badge variant="outline" className="w-fit text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                <span>{expense.category}</span>
                            </Badge>
                        </div>

                        <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Pagamento
                            </div>
                            <Badge className={`${getPaymentMethodColor(expense.paymentMethod)} text-xs`}>
                                <CreditCard className="h-3 w-3 mr-1" />
                                <span>{getPaymentMethodName(expense.paymentMethod)}</span>
                            </Badge>
                        </div>
                    </div>

                    {/* Status & Additional Info */}
                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                            <Badge className={`border text-xs ${getStatusColor(expense.status)}`}>
                                {getStatusText(expense.status)}
                            </Badge>

                            {expense.recurring && (
                                <Badge variant="secondary" className="text-xs">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Rec
                                </Badge>
                            )}

                            {expense.reminderEnabled && (
                                <Badge variant="outline" className="text-xs">
                                    <Bell className="h-3 w-3 mr-1" />
                                    Lem
                                </Badge>
                            )}
                        </div>

                        {expense.dueDate && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                <Calendar className="h-3 w-3" />
                                <span className="truncate">{format(new Date(expense.dueDate), "dd/MM")}</span>
                            </div>
                        )}
                    </div>

                    {/* Notes - mais compacto */}
                    {expense.notes && (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-start gap-1">
                                <FileText className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs font-medium text-blue-800 mb-1">Obs</div>
                                    <div className="text-xs text-blue-700 line-clamp-2">{expense.notes}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ExpenseCard;