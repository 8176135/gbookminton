<script lang="ts">
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import { Minus, Plus } from 'lucide-svelte';

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type'> &
			({ type: 'file'; files?: FileList } | { type?: InputType; files?: undefined })
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		'data-slot': dataSlot = 'input',
		step,
		min,
		max,
		...restProps
	}: Props = $props();

	function increment() {
		const numValue = Number(value) || 0;
		const stepNum = Number(step) || 1;
		const maxNum = max !== undefined ? Number(max) : Infinity;
		if (numValue < maxNum) {
			value = String(numValue + stepNum);
		}
	}

	function decrement() {
		const numValue = Number(value) || 0;
		const stepNum = Number(step) || 1;
		const minNum = min !== undefined ? Number(min) : -Infinity;
		if (numValue > minNum) {
			value = String(numValue - stepNum);
		}
	}
</script>

{#if type === 'file'}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			'dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 file:text-foreground placeholder:text-muted-foreground h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm',
			className
		)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else if type === 'number'}
	<div
		class="border-input focus-within:ring-ring/50 focus-within:border-ring flex items-center rounded-lg border bg-transparent focus-within:ring-3 {className}"
	>
		<input
			bind:this={ref}
			data-slot="input-group-control"
			type="number"
			bind:value
			{step}
			{min}
			{max}
			class="placeholder:text-muted-foreground h-8 flex-1 [appearance:textfield] border-0 bg-transparent px-3 py-1 text-base text-white transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
			{...restProps}
		/>
		<div class="border-input flex h-full flex-col border-l">
			<button
				type="button"
				onclick={increment}
				class="text-muted-foreground hover:bg-muted hover:text-foreground flex flex-1 items-center justify-center px-2 transition-colors disabled:pointer-events-none disabled:opacity-50"
			>
				<Plus class="h-3 w-3" />
			</button>
			<button
				type="button"
				onclick={decrement}
				class="border-input text-muted-foreground hover:bg-muted hover:text-foreground flex flex-1 items-center justify-center border-t px-2 transition-colors disabled:pointer-events-none disabled:opacity-50"
			>
				<Minus class="h-3 w-3" />
			</button>
		</div>
	</div>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			'dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 file:text-foreground placeholder:text-muted-foreground h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm',
			className
		)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
