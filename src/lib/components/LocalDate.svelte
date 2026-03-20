<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		date: Date | string | number;
		showTime?: boolean;
	}

	let { date, showTime = true }: Props = $props();
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});

	let displayedDate = $derived.by(() => {
		const d = new Date(date);
		if (showTime) {
			return d.toLocaleString();
		}
		return d.toLocaleDateString();
	});
</script>

<span class={mounted ? '' : 'animate-pulse text-gray-500 select-none'} aria-hidden={!mounted}>
	{displayedDate}
</span>
