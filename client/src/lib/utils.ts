import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting utilities for Brazilian Real
export function formatBRL(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

export function parseBRLToNumber(brlString: string): number {
  if (!brlString) return 0;
  
  // Remove currency symbol and normalize
  const cleaned = brlString
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Format input as user types (120 -> 1,20, 50 -> 0,50)
export function formatBRLInput(value: string): string {
  // Remove all non-numeric characters
  const numericOnly = value.replace(/\D/g, '');
  
  if (!numericOnly) return '';
  
  // Convert to number and divide by 100 to get cents
  const numValue = parseInt(numericOnly) / 100;
  
  return formatBRL(numValue);
}

// Parse formatted input back to cents value for storage
export function parseBRLInputToCents(formattedValue: string): string {
  const numValue = parseBRLToNumber(formattedValue);
  return (numValue * 100).toString();
}

// Parse cents value to formatted display
export function formatCentsToDisplay(centsValue: string): string {
  const numValue = parseFloat(centsValue) / 100;
  return formatBRL(numValue);
}
