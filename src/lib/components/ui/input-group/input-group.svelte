<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		prefix?: string;
		suffix?: string;
	};

	let {
		ref = $bindable(null),
		class: className,
		prefix,
		suffix,
		children,
		...props
	}: Props = $props();
</script>

<div
	bind:this={ref}
	data-slot="input-group"
	role="group"
	class={cn(
		'group/input-group border-input focus-within:ring-ring/50 focus-within:border-ring has-[:invalid]:border-destructive dark:bg-input/30 flex h-8 items-center rounded-lg border bg-transparent transition-colors focus-within:ring-3 has-[:disabled]:opacity-50 has-[:focus-within]:ring-3 has-[:invalid]:ring-3',
		className
	)}
	{...props}
>
	{#if prefix}
		<span class="text-muted-foreground pointer-events-none flex items-center px-2.5">
			{prefix}
		</span>
	{/if}
	<div data-slot="input-group-control" class="flex-1">
		{@render children?.()}
	</div>
	{#if suffix}
		<span class="text-muted-foreground pointer-events-none flex items-center px-2.5">
			{suffix}
		</span>
	{/if}
</div>
