import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithElementRef<T> = T & { ref?: Element | null };
export type WithoutChildren<T> = T & { children?: never };
export type WithoutChild<T> = T & { child?: never };
export type WithoutChildrenOrChild<T> = T & { children?: never; child?: never };
