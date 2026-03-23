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
	import { DateTimePicker } from '$lib/components/ui/datetime-picker/index.js';

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
	let eventDate = $state<Date | null>(null);
	let eventDeadline = $state<Date | null>(null);
	let isPrivate = $state(false);

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
			eventDate = new Date(event.date);
			eventDeadline = new Date(event.deadline);
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

	function handleDateChange(date: Date | null) {
		eventDate = date;
	}

	function handleDeadlineChange(date: Date | null) {
		eventDeadline = date;
	}
</script>

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
			<DateTimePicker value={eventDate} onchange={handleDateChange} />
		</Field>
		<Field>
			<Label for="duration">Duration (minutes)</Label>
			<Input type="number" id="duration" name="duration" required step="15" bind:value={duration} />
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
		<Input type="number" id="capacity" name="capacity" required bind:value={capacity} />
	</Field>

	<div class="grid grid-cols-2 gap-4">
		<Field>
			<Label for="costCompany">
				<span class="inline-flex items-center gap-2">
					Company Cost
					<Badge variant="company">Company</Badge>
				</span>
			</Label>
			<div class="flex items-center gap-1">
				<span class="text-muted-foreground">$</span>
				<Input
					type="number"
					id="costCompany"
					name="costCompany"
					required
					step="0.5"
					bind:value={costCompany}
					class="flex-1"
				/>
			</div>
		</Field>
		<Field>
			<Label for="costPlusOne">
				<span class="inline-flex items-center gap-2">
					PlusOne Cost
					<Badge variant="plusone">PlusOne</Badge>
				</span>
			</Label>
			<div class="flex items-center gap-1">
				<span class="text-muted-foreground">$</span>
				<Input
					type="number"
					id="costPlusOne"
					name="costPlusOne"
					required
					step="0.5"
					bind:value={costPlusOne}
					class="flex-1"
				/>
			</div>
		</Field>
	</div>

	<Field>
		<Label>Withdrawal Deadline</Label>
		<DateTimePicker value={eventDeadline} onchange={handleDeadlineChange} />
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
