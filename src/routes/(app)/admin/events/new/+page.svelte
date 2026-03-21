<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	let loading = $state(false);
	let timezone = $state('');
	let utcDate = $state('');
	let utcDeadline = $state('');
	let isPrivate = $state(false);

	onMount(() => {
		timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
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
</script>

<svelte:head>
	<title>Create Event - Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 p-6 text-white">
	<div class="mx-auto max-w-2xl">
		<header class="mb-8">
			<a href="/admin" class="mb-2 inline-block text-sm text-indigo-400 hover:text-indigo-300"
				>← Back to Dashboard</a
			>
			<h1 class="text-3xl font-bold tracking-tight text-white">Create New Event</h1>
			{#if timezone}
				<p class="mt-2 text-sm text-gray-500">
					Detecting time and deadline in your timezone: <span class="font-semibold text-indigo-400"
						>{timezone}</span
					>
				</p>
			{/if}
		</header>

		<div class="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 shadow-2xl backdrop-blur-xl">
			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						update();
					};
				}}
				class="space-y-5"
			>
				<input type="hidden" name="timezone" value={timezone} />
				<input type="hidden" name="date" value={utcDate} />
				<input type="hidden" name="deadline" value={utcDeadline} />

				<div>
					<label for="title" class="mb-1.5 block text-sm font-medium text-gray-300"
						>Event Title</label
					>
					<input
						type="text"
						id="title"
						name="title"
						required
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
							value="120"
							class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
						/>
					</div>
				</div>

				<div>
					<label for="location" class="mb-1.5 block text-sm font-medium text-gray-300"
						>Location</label
					>
					<input
						type="text"
						id="location"
						name="location"
						required
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
						placeholder="Provide extra details..."
					></textarea>
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
							value="10"
							class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
						/>
					</div>
					<div>
						<label for="cost" class="mb-1.5 block text-sm font-medium text-gray-300"
							>Cost (in dollars)</label
						>
						<input
							type="number"
							id="cost"
							name="cost"
							required
							min="0"
							step="0.5"
							value="15"
							class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
						/>
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
						oninput={handleSync}
						class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
					/>
				</div>

				<!-- Privacy toggle -->
				<input type="hidden" name="isPrivate" value={String(isPrivate)} />
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
						Private event
						<span class="text-gray-500">(hide attendee names from non-admins)</span>
					</span>
				</label>

				<button
					type="submit"
					disabled={loading || !utcDate || !utcDeadline}
					class="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none disabled:opacity-50"
				>
					{loading ? 'Creating...' : 'Create Event'}
				</button>
			</form>
		</div>
	</div>
</div>
