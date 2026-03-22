<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

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

	let { mode, event, form, action = '?/default', onCancel }: Props = $props();

	let saving = $state(false);
	let timezone = $state('');
	let utcDate = $state('');
	let utcDeadline = $state('');
	let isPrivate = $state(event?.isPrivate ?? false);

	onMount(() => {
		timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		if (event) {
			isPrivate = event.isPrivate;
		}
	});

	const handleSync = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const date = new Date(target.value);
		if (!isNaN(date.getTime())) {
			if (target.name === 'date_local') {
				utcDate = date.toISOString();
			} else if (target.name === 'deadline_local') {
				utcDeadline = date.toISOString();
			}
		}
	};

	// Format date for datetime-local input
	const toLocalInputValue = (d: Date) => {
		const pad = (n: number) => String(n).padStart(2, '0');
		const date = new Date(d);
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	};

	let localDate = $derived(event ? toLocalInputValue(new Date(event.date)) : '');
	let localDeadline = $derived(event ? toLocalInputValue(new Date(event.deadline)) : '');
	let defaultCostCompany = $derived(event ? (event.costCompany / 100).toFixed(2) : '15.00');
	let defaultCostPlusOne = $derived(event ? (event.costPlusOne / 100).toFixed(2) : '20.00');
	let defaultDuration = $derived(event?.duration ?? 120);
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
		<p class="text-xs text-gray-500">
			Dates in your timezone: <span class="font-semibold text-indigo-400">{timezone}</span>
		</p>
	{/if}

	<input type="hidden" name="date" value={utcDate || (event ? event.date.toISOString() : '')} />
	<input
		type="hidden"
		name="deadline"
		value={utcDeadline || (event ? event.deadline.toISOString() : '')}
	/>
	<input type="hidden" name="isPrivate" value={String(isPrivate)} />

	<div>
		<label for="title" class="mb-1.5 block text-sm font-medium text-gray-300">Event Title</label>
		<input
			type="text"
			id="title"
			name="title"
			required
			value={event?.title ?? ''}
			class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
			placeholder="e.g. Saturday Morning Badminton"
		/>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="date_local" class="mb-1.5 block text-sm font-medium text-gray-300"
				>Date & Time</label
			>
			<input
				type="datetime-local"
				id="date_local"
				name="date_local"
				required
				value={localDate}
				oninput={handleSync}
				class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
			/>
		</div>
		<div>
			<label for="duration" class="mb-1.5 block text-sm font-medium text-gray-300"
				>Duration (minutes)</label
			>
			<input
				type="number"
				id="duration"
				name="duration"
				required
				min="30"
				step="15"
				value={defaultDuration}
				class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
			/>
		</div>
	</div>

	<div>
		<label for="location" class="mb-1.5 block text-sm font-medium text-gray-300">Location</label>
		<input
			type="text"
			id="location"
			name="location"
			required
			value={event?.location ?? ''}
			class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
			placeholder="e.g. Sports Hall A"
		/>
	</div>

	<div>
		<label for="description" class="mb-1.5 block text-sm font-medium text-gray-300"
			>Description</label
		>
		<textarea
			id="description"
			name="description"
			required
			rows="3"
			class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
			placeholder="Provide extra details...">{event?.description ?? ''}</textarea
		>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="capacity" class="mb-1.5 block text-sm font-medium text-gray-300"
				>Player Capacity</label
			>
			<input
				type="number"
				id="capacity"
				name="capacity"
				required
				min="2"
				value={event?.capacity ?? 10}
				class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
			/>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="costCompany" class="mb-1.5 block text-sm font-medium text-gray-300">
				<span class="inline-flex items-center gap-1">
					<span>Company Cost</span>
					<span class="rounded bg-blue-500/20 px-1.5 py-0.5 text-xs text-blue-400">Blue</span>
				</span>
			</label>
			<div class="relative">
				<span class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-500"
					>$</span
				>
				<input
					type="number"
					id="costCompany"
					name="costCompany"
					required
					min="0"
					step="0.5"
					value={defaultCostCompany}
					class="w-full rounded-xl border border-gray-700 bg-gray-900 py-3 pr-4 pl-8 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
				/>
			</div>
		</div>
		<div>
			<label for="costPlusOne" class="mb-1.5 block text-sm font-medium text-gray-300">
				<span class="inline-flex items-center gap-1">
					<span>PlusOne Cost</span>
					<span class="rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-400">Green</span
					>
				</span>
			</label>
			<div class="relative">
				<span class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-500"
					>$</span
				>
				<input
					type="number"
					id="costPlusOne"
					name="costPlusOne"
					required
					min="0"
					step="0.5"
					value={defaultCostPlusOne}
					class="w-full rounded-xl border border-gray-700 bg-gray-900 py-3 pr-4 pl-8 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
				/>
			</div>
		</div>
	</div>

	<div>
		<label for="deadline_local" class="mb-1.5 block text-sm font-medium text-gray-300"
			>Withdrawal Deadline</label
		>
		<input
			type="datetime-local"
			id="deadline_local"
			name="deadline_local"
			required
			value={localDeadline}
			oninput={handleSync}
			class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
		/>
	</div>

	<!-- Privacy toggle -->
	<label class="flex cursor-pointer items-center gap-3">
		<div class="relative">
			<input type="checkbox" class="sr-only" bind:checked={isPrivate} />
			<div
				class="h-6 w-11 rounded-full transition-colors duration-200 {isPrivate
					? 'bg-indigo-600'
					: 'bg-gray-700'}"
			></div>
			<div
				class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 {isPrivate
					? 'translate-x-5'
					: 'translate-x-0'}"
			></div>
		</div>
		<span class="text-sm font-medium text-gray-300">
			Private event <span class="text-gray-500">(hide attendee names from non-admins)</span>
		</span>
	</label>

	{#if form?.error}
		<p class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
			{form.error}
		</p>
	{/if}

	<div class="flex gap-3 pt-2">
		<button
			type="submit"
			disabled={saving}
			class="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
		>
			{saving
				? mode === 'create'
					? 'Creating...'
					: 'Saving...'
				: mode === 'create'
					? 'Create Event'
					: 'Save Changes'}
		</button>
		{#if mode === 'edit'}
			<button
				type="button"
				onclick={onCancel}
				class="rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-800"
			>
				Cancel
			</button>
		{/if}
	</div>
</form>
