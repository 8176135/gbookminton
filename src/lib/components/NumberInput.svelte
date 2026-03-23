<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Minus, Plus } from 'lucide-svelte';

	interface Props {
		value?: number | string;
		min?: number;
		max?: number;
		step?: number;
		required?: boolean;
		id?: string;
		name?: string;
		class?: string;
	}

	let {
		value = $bindable(0),
		min = -Infinity,
		max = Infinity,
		step = 1,
		required = false,
		id,
		name,
		class: className = ''
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
	<InputGroup.Input type="number" {id} {name} {required} {step} {min} {max} bind:value />
	<InputGroup.Button type="button" variant="ghost" onclick={decrease}>
		<Minus class="h-4 w-4" />
	</InputGroup.Button>
	<InputGroup.Button type="button" variant="ghost" onclick={increase}>
		<Plus class="h-4 w-4" />
	</InputGroup.Button>
</InputGroup.Root>
