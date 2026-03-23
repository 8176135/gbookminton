<script lang="ts">
	import { Switch as SwitchPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	type Props = {
		checked?: boolean;
		disabled?: boolean;
		class?: string;
		onCheckedChange?: (checked: boolean) => void;
	};

	let {
		checked = $bindable(false),
		disabled = false,
		class: className,
		onCheckedChange
	}: Props = $props();
</script>

<SwitchPrimitive.Root
	{disabled}
	bind:checked
	onCheckedChange={(value) => {
		checked = value;
		onCheckedChange?.(value);
	}}
	class={cn(
		'peer focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-gray-600',
		className
	)}
>
	<SwitchPrimitive.Thumb
		class={cn(
			'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
		)}
	/>
</SwitchPrimitive.Root>
