<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Minus, Plus } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		value?: number | string;
		min?: number;
		max?: number;
		step?: number;
		required?: boolean;
		id?: string;
		name?: string;
		class?: string;
		prefix?: Snippet;
	}

	let {
		value = $bindable(0),
		min = -Infinity,
		max = Infinity,
		step = 1,
		required = false,
		id,
		name,
		class: className = '',
		prefix
	}: Props = $props();

	function decrease() {
		let current = Number(value);
		if (isNaN(current)) current = 0;
		value = Math.max(min, current - step);
	}

	function increase() {
		let current = Number(value);
		if (isNaN(current)) current = 0;
		value = Math.min(max, current + step);
	}
</script>

<InputGroup.Root class={className}>
	{@render prefix?.()}
	<InputGroup.Input
		type="number"
		{id}
		{name}
		{required}
		{step}
		{min}
		{max}
		bind:value
		class="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
	/>
	<InputGroup.Button type="button" variant="ghost" onclick={decrease}>
		<Minus class="h-4 w-4" />
	</InputGroup.Button>
	<InputGroup.Button type="button" variant="ghost" onclick={increase}>
		<Plus class="h-4 w-4" />
	</InputGroup.Button>
</InputGroup.Root>
