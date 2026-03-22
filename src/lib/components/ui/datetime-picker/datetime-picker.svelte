<script lang="ts">
	import { Calendar as CalendarIcon, Clock, X, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { CalendarDate } from '@internationalized/date';

	type Props = {
		value?: Date | null;
		onchange?: (date: Date | null) => void;
		class?: string;
		placeholder?: string;
	};

	let {
		value = $bindable(null),
		onchange,
		class: className = '',
		placeholder = 'Select date and time'
	}: Props = $props();

	let open = $state(false);
	let viewYear = $state(2024);
	let viewMonth = $state(1);
	let hours = $state(12);
	let minutes = $state(0);

	$effect(() => {
		if (value) {
			hours = value.getHours();
			minutes = value.getMinutes();
			viewYear = value.getFullYear();
			viewMonth = value.getMonth() + 1;
		}
	});

	function toggle() {
		open = !open;
		if (open) {
			if (value) {
				hours = value.getHours();
				minutes = value.getMinutes();
				viewYear = value.getFullYear();
				viewMonth = value.getMonth() + 1;
			} else {
				const now = new Date();
				viewYear = now.getFullYear();
				viewMonth = now.getMonth() + 1;
			}
		}
	}

	function selectDate(day: number) {
		const d = new Date(viewYear, viewMonth - 1, day, hours, minutes);
		value = d;
		onchange?.(d);
	}

	function prevMonth() {
		if (viewMonth === 1) {
			viewMonth = 12;
			viewYear--;
		} else {
			viewMonth--;
		}
	}

	function nextMonth() {
		if (viewMonth === 12) {
			viewMonth = 1;
			viewYear++;
		} else {
			viewMonth++;
		}
	}

	function confirm() {
		open = false;
	}

	function cancel() {
		open = false;
	}

	function formatDisplay(date: Date | null) {
		if (!date) return placeholder;
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	function getDaysInMonth(year: number, month: number) {
		return new Date(year, month, 0).getDate();
	}

	function getFirstDayOfMonth(year: number, month: number) {
		return new Date(year, month - 1, 1).getDay();
	}

	let days = $derived.by(() => {
		const daysInMonth = getDaysInMonth(viewYear, viewMonth);
		const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
		const daysArr: (number | null)[] = [];
		for (let i = 0; i < firstDay; i++) {
			daysArr.push(null);
		}
		for (let i = 1; i <= daysInMonth; i++) {
			daysArr.push(i);
		}
		return daysArr;
	});

	function isSelected(day: number | null) {
		if (!day || !value) return false;
		return (
			value.getDate() === day &&
			value.getMonth() === viewMonth - 1 &&
			value.getFullYear() === viewYear
		);
	}

	function isToday(day: number | null) {
		if (day === null) return false;
		const today = new Date();
		return (
			today.getDate() === day &&
			today.getMonth() === viewMonth - 1 &&
			today.getFullYear() === viewYear
		);
	}
</script>

<div class="relative {className}">
	<Button
		variant="outline"
		class={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}
		onclick={toggle}
	>
		<CalendarIcon class="mr-2 h-4 w-4" />
		{formatDisplay(value)}
	</Button>

	{#if open}
		<div class="border-border bg-card absolute z-50 mt-2 w-80 rounded-xl border p-3 shadow-lg">
			<div class="space-y-4">
				<!-- Month Navigation -->
				<div class="flex items-center justify-between">
					<Button variant="ghost" size="icon-xs" onclick={prevMonth}>
						<ChevronLeft class="h-4 w-4" />
					</Button>
					<span class="text-sm font-medium text-white">
						{months[viewMonth - 1]}
						{viewYear}
					</span>
					<Button variant="ghost" size="icon-xs" onclick={nextMonth}>
						<ChevronRight class="h-4 w-4" />
					</Button>
				</div>

				<!-- Week Days -->
				<div class="text-muted-foreground mb-2 grid grid-cols-7 gap-1 text-center text-xs">
					{#each weekDays as day}
						<div class="py-1">{day}</div>
					{/each}
				</div>

				<!-- Days -->
				<div class="grid grid-cols-7 gap-1">
					{#each days as day}
						<button
							type="button"
							onclick={() => day && selectDate(day)}
							class={cn(
								'h-8 w-8 rounded-lg text-sm transition-colors',
								day === null && 'invisible',
								day !== null && !isSelected(day) && 'hover:bg-muted hover:text-foreground',
								isSelected(day) && 'bg-indigo-600 text-white',
								isToday(day) && !isSelected(day) && 'border border-indigo-500/30'
							)}
						>
							{day ?? ''}
						</button>
					{/each}
				</div>

				<!-- Time Picker -->
				<div class="flex items-center gap-2">
					<div class="flex items-center gap-1">
						<Clock class="text-muted-foreground h-4 w-4" />
						<input
							type="number"
							min="0"
							max="23"
							bind:value={hours}
							class="border-input h-8 w-14 [appearance:textfield] rounded-lg border bg-transparent px-2 text-center text-sm text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
						/>
						<span class="text-white">:</span>
						<input
							type="number"
							min="0"
							max="59"
							step="5"
							bind:value={minutes}
							class="border-input h-8 w-14 [appearance:textfield] rounded-lg border bg-transparent px-2 text-center text-sm text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
						/>
					</div>
					<button
						type="button"
						onclick={cancel}
						class="text-muted-foreground hover:text-foreground ml-auto"
					>
						<X class="h-4 w-4" />
					</button>
				</div>

				<div class="flex justify-end gap-2">
					<Button variant="outline" size="sm" onclick={cancel}>Cancel</Button>
					<Button size="sm" onclick={confirm}>Confirm</Button>
				</div>
			</div>
		</div>
	{/if}
</div>

<svelte:window
	onclick={(e) => {
		if (open && !(e.target as Element).closest('.relative')) {
			open = false;
		}
	}}
/>
