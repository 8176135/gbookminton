<script lang="ts">
	import type { PageProps } from './$types';
	import LocalDate from '$lib/components/LocalDate.svelte';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	let { data, form }: PageProps = $props();
	let ev = $derived(data.event);
	let isAdmin = $derived(data.isAdmin);
	let signups = $derived(data.signups);
	let userSignupStatus = $derived(data.userSignupStatus);

	let listed = $derived(
		signups
			? signups.filter((s) => s.signup.status === 'listed' || s.signup.status === 'locked')
			: []
	);
	let waitlist = $derived(
		signups
			? signups
					.filter((s) => s.signup.status === 'waitlist')
					.sort((a, b) => a.signup.createdAt.getTime() - b.signup.createdAt.getTime())
			: []
	);
	let withdrawn = $derived(signups ? signups.filter((s) => s.signup.status === 'withdrawn') : []);

	// Edit mode
	let editing = $state(false);
	let saving = $state(false);
	let timezone = $state('');
	let utcDate = $state('');
	let utcDeadline = $state('');
	let editPrivate = $state(false);

	onMount(() => {
		timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		editPrivate = ev.isPrivate;
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
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	};

	let localDate = $derived(
		typeof window !== 'undefined' ? toLocalInputValue(new Date(ev.date)) : ''
	);
	let localDeadline = $derived(
		typeof window !== 'undefined' ? toLocalInputValue(new Date(ev.deadline)) : ''
	);
</script>

<svelte:head>
	<title>{ev.title} | Gbookminton</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 p-4 text-white md:p-6">
	<div class="mx-auto max-w-5xl">
		<!-- Header -->
		<header class="mb-8">
			<a
				href={isAdmin ? '/admin' : '/dashboard'}
				class="mb-3 inline-flex items-center gap-1.5 text-sm text-indigo-400 transition hover:text-indigo-300"
			>
				← Back to {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
			</a>

			{#if isAdmin && editing}
				<!-- Edit form -->
				<form
					method="POST"
					action="?/editEvent"
					use:enhance={() => {
						saving = true;
						return async ({ update, result }) => {
							saving = false;
							if (result.type === 'success') editing = false;
							update({ reset: false });
						};
					}}
					class="space-y-5 rounded-2xl border border-indigo-500/30 bg-gray-900/60 p-6 backdrop-blur-xl"
				>
					<h2 class="text-xl font-bold text-indigo-300">Edit Event</h2>

					{#if timezone}
						<p class="text-xs text-gray-500">
							Dates in your timezone: <span class="font-semibold text-indigo-400">{timezone}</span>
						</p>
					{/if}

					<input type="hidden" name="date" value={utcDate || ev.date.toISOString()} />
					<input type="hidden" name="deadline" value={utcDeadline || ev.deadline.toISOString()} />
					<input type="hidden" name="isPrivate" value={String(editPrivate)} />

					<div>
						<label for="edit-title" class="mb-1.5 block text-sm font-medium text-gray-300"
							>Event Title</label
						>
						<input
							type="text"
							id="edit-title"
							name="title"
							required
							value={ev.title}
							class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="edit-date" class="mb-1.5 block text-sm font-medium text-gray-300"
								>Date &amp; Time</label
							>
							<input
								type="datetime-local"
								id="edit-date"
								name="date_local"
								required
								value={localDate}
								oninput={handleSync}
								class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
							/>
						</div>
						<div>
							<label for="edit-duration" class="mb-1.5 block text-sm font-medium text-gray-300"
								>Duration (minutes)</label
							>
							<input
								type="number"
								id="edit-duration"
								name="duration"
								required
								min="30"
								step="15"
								value={ev.duration}
								class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
							/>
						</div>
					</div>

					<div>
						<label for="edit-location" class="mb-1.5 block text-sm font-medium text-gray-300"
							>Location</label
						>
						<input
							type="text"
							id="edit-location"
							name="location"
							required
							value={ev.location}
							class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
						/>
					</div>

					<div>
						<label for="edit-description" class="mb-1.5 block text-sm font-medium text-gray-300"
							>Description</label
						>
						<textarea
							id="edit-description"
							name="description"
							required
							rows="3"
							class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
							>{ev.description}</textarea
						>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="edit-capacity" class="mb-1.5 block text-sm font-medium text-gray-300"
								>Player Capacity</label
							>
							<input
								type="number"
								id="edit-capacity"
								name="capacity"
								required
								min="2"
								value={ev.capacity}
								class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
							/>
						</div>
						<div>
							<label for="edit-cost" class="mb-1.5 block text-sm font-medium text-gray-300"
								>Cost (dollars)</label
							>
							<input
								type="number"
								id="edit-cost"
								name="cost"
								required
								min="0"
								step="0.5"
								value={(ev.cost / 100).toFixed(2)}
								class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
							/>
						</div>
					</div>

					<div>
						<label for="edit-deadline" class="mb-1.5 block text-sm font-medium text-gray-300"
							>Withdrawal Deadline</label
						>
						<input
							type="datetime-local"
							id="edit-deadline"
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
							<input type="checkbox" class="sr-only" bind:checked={editPrivate} />
							<div
								class="h-6 w-11 rounded-full transition-colors duration-200 {editPrivate
									? 'bg-indigo-600'
									: 'bg-gray-700'}"
							></div>
							<div
								class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 {editPrivate
									? 'translate-x-5'
									: 'translate-x-0'}"
							></div>
						</div>
						<span class="text-sm font-medium text-gray-300">
							Private event <span class="text-gray-500">(hide attendee names from non-admins)</span>
						</span>
					</label>

					<div class="flex gap-3 pt-2">
						<button
							type="submit"
							disabled={saving}
							class="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
						>
							{saving ? 'Saving...' : 'Save Changes'}
						</button>
						<button
							type="button"
							onclick={() => (editing = false)}
							class="rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-800"
						>
							Cancel
						</button>
					</div>
				</form>
			{:else}
				<!-- View mode header -->
				<div class="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h1 class="mb-1 text-3xl font-bold tracking-tight text-white">{ev.title}</h1>
						<p class="text-gray-400">
							<LocalDate date={ev.date} /> • {ev.location} • {ev.duration} mins
						</p>
						<div class="mt-2 flex flex-wrap items-center gap-3 text-sm">
							<span class="font-medium text-emerald-400">${(ev.cost / 100).toFixed(2)}</span>
							{#if ev.isPrivate && isAdmin}
								<span
									class="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-400"
								>
									🔒 Private
								</span>
							{/if}
							{#if ev.isLocked}
								<span
									class="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400"
								>
									Locked
								</span>
							{/if}
						</div>
						{#if ev.description}
							<p class="mt-3 max-w-2xl text-sm text-gray-400">{ev.description}</p>
						{/if}
					</div>

					{#if isAdmin}
						<button
							onclick={() => {
								editing = true;
								editPrivate = ev.isPrivate;
								utcDate = '';
								utcDeadline = '';
							}}
							class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
						>
							Edit Event
						</button>
					{/if}
				</div>
			{/if}

			{#if form?.error}
				<p
					class="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
				>
					{form.error}
				</p>
			{/if}
		</header>

		<!-- Deadline info bar -->
		<div
			class="mb-8 rounded-xl border border-gray-800 bg-gray-900/40 px-5 py-3 text-sm text-gray-400"
		>
			<span class="font-medium text-gray-300">Withdrawal deadline:</span>
			<LocalDate date={ev.deadline} />
		</div>

		<!-- Attendee panels -->
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
			<!-- Registered Players -->
			<div>
				<h2 class="mb-4 text-xl font-bold text-gray-200">
					Registered Players ({data.listedCount} / {ev.capacity})
				</h2>
				<div
					class="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-xl"
				>
					{#if !isAdmin && ev.isPrivate}
						<!-- Private event: only show count to non-admins -->
						<div class="flex flex-col items-center justify-center gap-1 p-8 text-center">
							<p class="text-3xl font-bold text-white">{data.listedCount}</p>
							<p class="text-sm text-gray-500">players registered</p>
							<p class="mt-2 text-xs text-gray-600">Attendee list is private for this event.</p>
						</div>
					{:else}
						<ul class="divide-y divide-gray-800">
							{#each listed as player}
								<li class="flex items-center justify-between p-4 transition hover:bg-gray-800/30">
									<div>
										<p class="font-medium text-white">{player.user.name}</p>
										{#if isAdmin}
											<p class="text-sm text-gray-400">{player.user.email}</p>
										{/if}
									</div>
									<span
										class="rounded-full px-2.5 py-1 text-xs font-semibold {player.signup.status ===
										'locked'
											? 'border border-red-500/20 bg-red-500/20 text-red-300'
											: 'border border-emerald-500/20 bg-emerald-500/20 text-emerald-300'}"
									>
										{player.signup.status}
									</span>
								</li>
							{/each}
							{#if listed.length === 0}
								<li class="p-6 text-center text-gray-500">No players registered yet.</li>
							{/if}
						</ul>
					{/if}
				</div>
			</div>

			<!-- Waitlist & Withdrawn -->
			<div class="space-y-8">
				<div>
					<h2 class="mb-4 text-xl font-bold text-gray-200">
						Waitlist ({data.waitlistCount})
					</h2>
					<div
						class="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-xl"
					>
						{#if !isAdmin && ev.isPrivate}
							<div class="flex flex-col items-center justify-center gap-1 p-8 text-center">
								<p class="text-3xl font-bold text-white">{data.waitlistCount}</p>
								<p class="text-sm text-gray-500">on waitlist</p>
							</div>
						{:else}
							<ul class="divide-y divide-gray-800">
								{#each waitlist as player, i}
									<li class="flex items-center justify-between p-4 transition hover:bg-gray-800/30">
										<div class="flex items-center gap-3">
											<span
												class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-gray-400"
												>{i + 1}</span
											>
											<div>
												<p class="font-medium text-white">{player.user.name}</p>
												{#if isAdmin}
													<p class="text-sm text-gray-400">{player.user.email}</p>
												{/if}
											</div>
										</div>
									</li>
								{/each}
								{#if waitlist.length === 0}
									<li class="p-6 text-center text-gray-500">Waitlist is empty.</li>
								{/if}
							</ul>
						{/if}
					</div>
				</div>

				<!-- Withdrawn (admin only) -->
				{#if isAdmin}
					<div>
						<h2 class="mb-4 text-xl font-bold text-gray-200">Withdrawn</h2>
						<div
							class="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-xl"
						>
							<ul class="divide-y divide-gray-800">
								{#each withdrawn as player}
									<li class="p-4 hover:bg-gray-800/30">
										<p class="font-medium text-gray-400 line-through">{player.user.name}</p>
									</li>
								{/each}
								{#if withdrawn.length === 0}
									<li class="p-6 text-center text-gray-500">No withdrawals.</li>
								{/if}
							</ul>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- User's own status (for non-admins) -->
		{#if !isAdmin && userSignupStatus}
			<div class="mt-8">
				<div class="rounded-2xl border border-gray-800 bg-gray-900/50 p-5">
					<p class="text-sm text-gray-400">
						<span class="font-medium text-white">Your status:</span>
						<span
							class="ml-2 rounded-full px-2.5 py-1 text-xs font-semibold
							{userSignupStatus === 'listed'
								? 'border border-emerald-500/20 bg-emerald-500/20 text-emerald-300'
								: ''}
							{userSignupStatus === 'waitlist'
								? 'border border-yellow-500/20 bg-yellow-500/20 text-yellow-300'
								: ''}
							{userSignupStatus === 'locked'
								? 'border border-indigo-500/20 bg-indigo-500/20 text-indigo-300'
								: ''}
							{userSignupStatus === 'withdrawn' ? 'border border-gray-500/20 bg-gray-500/20 text-gray-400' : ''}
							{userSignupStatus === 'removed' ? 'border border-red-500/20 bg-red-500/20 text-red-300' : ''}"
						>
							{userSignupStatus}
						</span>
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>
