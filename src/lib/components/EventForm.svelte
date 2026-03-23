<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Field } from '$lib/components/ui/field/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import NumberInput from './NumberInput.svelte';
	import { Calendar as CalendarIcon } from 'lucide-svelte';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { CalendarDate } from '@internationalized/date';

	interface Props {
		mode: 'create' | 'edit';
		event?: {
			id: string;
			title: string;
			date: Date;
			deadline: Date;
			location: string;
			duration: number;
			description: string;
			capacity: number;
			costCompany: number;
			costPlusOne: number;
			isPrivate: boolean;
		};
		form?: { error?: string } | null;
		action?: string;
		onCancel?: () => void;
	}

	let { mode, event, form, action = '', onCancel }: Props = $props();

	let saving = $state(false);
	let timezone = $state('');
	let isPrivate = $state(false);

	let eventDateValue = $state<CalendarDate | undefined>();
	let eventTimeValue = $state('09:00');

	let eventDeadlineValue = $state<CalendarDate | undefined>();
	let eventDeadlineTimeValue = $state('23:59');

	let eventDate = $derived(
		eventDateValue
			? new Date(
					eventDateValue.year,
					eventDateValue.month - 1,
					eventDateValue.day,
					parseInt(eventTimeValue.split(':')[0] || '0'),
					parseInt(eventTimeValue.split(':')[1] || '0')
				)
			: null
	);

	let eventDeadline = $derived(
		eventDeadlineValue
			? new Date(
					eventDeadlineValue.year,
					eventDeadlineValue.month - 1,
					eventDeadlineValue.day,
					parseInt(eventDeadlineTimeValue.split(':')[0] || '0'),
					parseInt(eventDeadlineTimeValue.split(':')[1] || '0')
				)
			: null
	);

	function formatDate(date: CalendarDate | undefined) {
		if (!date) return 'Select date';
		return new Date(date.year, date.month - 1, date.day).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	let costCompany = $state('');
	let costPlusOne = $state('');
	let duration = $state('');
	let title = $state('');
	let location = $state('');
	let description = $state('');
	let capacity = $state('');

	onMount(() => {
		timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		if (event) {
			const d = new Date(event.date);
			eventDateValue = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
			eventTimeValue = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

			const dl = new Date(event.deadline);
			eventDeadlineValue = new CalendarDate(dl.getFullYear(), dl.getMonth() + 1, dl.getDate());
			eventDeadlineTimeValue = `${dl.getHours().toString().padStart(2, '0')}:${dl.getMinutes().toString().padStart(2, '0')}`;

			isPrivate = event.isPrivate;
			costCompany = (event.costCompany / 100).toFixed(2);
			costPlusOne = (event.costPlusOne / 100).toFixed(2);
			duration = String(event.duration);
			title = event.title;
			location = event.location;
			description = event.description;
			capacity = String(event.capacity);
		} else {
			costCompany = '15.00';
			costPlusOne = '20.00';
			duration = '120';
			capacity = '10';
		}
	});
</script>

a
<form
	method="POST"
	{action}
	use:enhance={() => {
		saving = true;
		return async ({ update, result }) => {
			saving = false;
			if (result.type === 'success' && mode === 'edit') {
				onCancel?.();
			}
			update({ reset: false });
		};
	}}
	class="space-y-5 rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-xl {mode ===
	'edit'
		? 'border-indigo-500/30'
		: ''}"
>
	<h2 class="text-xl font-bold text-white">
		{mode === 'create' ? 'Create New Event' : 'Edit Event'}
	</h2>

	{#if timezone}
		<p class="text-muted-foreground text-xs">
			Dates in your timezone: <span class="font-semibold text-indigo-400">{timezone}</span>
		</p>
	{/if}

	<input type="hidden" name="date" value={eventDate?.toISOString() ?? ''} />
	<input type="hidden" name="deadline" value={eventDeadline?.toISOString() ?? ''} />
	<input type="hidden" name="isPrivate" value={String(isPrivate)} />

	<Field>
		<Label for="title">Event Title</Label>
		<Input
			type="text"
			id="title"
			name="title"
			required
			bind:value={title}
			placeholder="e.g. Saturday Morning Badminton"
		/>
	</Field>

	<div class="grid grid-cols-2 gap-4">
		<Field>
			<Label>Date & Time</Label>
			<div class="flex items-center gap-2">
				<Popover.Root>
					<Popover.Trigger
						class={cn(
							buttonVariants({
								variant: 'outline',
								className: 'bg-background w-[200px] justify-start text-left font-normal'
							}),
							!eventDateValue && 'text-muted-foreground'
						)}
					>
						<CalendarIcon class="mr-2 h-4 w-4" />
						{formatDate(eventDateValue)}
					</Popover.Trigger>
					<Popover.Content class="w-auto p-0" align="start">
						<Calendar type="single" bind:value={eventDateValue} />
					</Popover.Content>
				</Popover.Root>
				<Input type="time" bind:value={eventTimeValue} required class="w-auto flex-1" />
			</div>
		</Field>
		<Field>
			<Label for="duration">Duration (minutes)</Label>
			<NumberInput id="duration" name="duration" required step={15} bind:value={duration} />
		</Field>
	</div>

	<Field>
		<Label for="location">Location</Label>
		<Input
			type="text"
			id="location"
			name="location"
			required
			bind:value={location}
			placeholder="e.g. Sports Hall A"
		/>
	</Field>

	<Field>
		<Label for="description">Description</Label>
		<Textarea
			id="description"
			name="description"
			required
			bind:value={description}
			placeholder="Provide extra details..."
		></Textarea>
	</Field>

	<Field>
		<Label for="capacity">Player Capacity</Label>
		<NumberInput id="capacity" name="capacity" required step={1} bind:value={capacity} />
	</Field>

	<div class="grid grid-cols-2 gap-4">
		<Field>
			<Label for="costCompany">
				<span class="inline-flex items-center gap-2">
					Company Cost
					<Badge variant="company">Company</Badge>
				</span>
			</Label>
			<InputGroup.Root>
				<InputGroup.Text class="text-muted-foreground">$</InputGroup.Text>
				<InputGroup.Input
					type="number"
					id="costCompany"
					name="costCompany"
					required
					step="0.5"
					bind:value={costCompany}
				/>
			</InputGroup.Root>
		</Field>
		<Field>
			<Label for="costPlusOne">
				<span class="inline-flex items-center gap-2">
					PlusOne Cost
					<Badge variant="plusone">PlusOne</Badge>
				</span>
			</Label>
			<InputGroup.Root>
				<InputGroup.Text class="text-muted-foreground">$</InputGroup.Text>
				<InputGroup.Input
					type="number"
					id="costPlusOne"
					name="costPlusOne"
					required
					step="0.5"
					bind:value={costPlusOne}
				/>
			</InputGroup.Root>
		</Field>
	</div>

	<Field>
		<Label>Withdrawal Deadline</Label>
		<div class="flex items-center gap-2">
			<Popover.Root>
				<Popover.Trigger
					class={cn(
						buttonVariants({
							variant: 'outline',
							className: 'bg-background w-[200px] justify-start text-left font-normal'
						}),
						!eventDeadlineValue && 'text-muted-foreground'
					)}
				>
					<CalendarIcon class="mr-2 h-4 w-4" />
					{formatDate(eventDeadlineValue)}
				</Popover.Trigger>
				<Popover.Content class="w-auto p-0" align="start">
					<Calendar type="single" bind:value={eventDeadlineValue} />
				</Popover.Content>
			</Popover.Root>
			<Input type="time" bind:value={eventDeadlineTimeValue} required class="w-auto" />
		</div>
	</Field>

	<!-- Privacy toggle -->
	<Field>
		<div class="flex items-center gap-3">
			<Switch bind:checked={isPrivate} />
			<Label class="cursor-pointer">
				Private event <span class="text-muted-foreground"
					>(hide attendee names from non-admins)</span
				>
			</Label>
		</div>
	</Field>

	{#if form?.error}
		<p
			class="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm"
		>
			{form.error}
		</p>
	{/if}

	<div class="flex gap-3 pt-2">
		<Button type="submit" disabled={saving} class="flex-1">
			{saving
				? mode === 'create'
					? 'Creating...'
					: 'Saving...'
				: mode === 'create'
					? 'Create Event'
					: 'Save Changes'}
		</Button>
		{#if mode === 'edit'}
			<Button type="button" variant="outline" onclick={onCancel}>Cancel</Button>
		{/if}
	</div>
</form>
