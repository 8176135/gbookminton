<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import LocalDate from '$lib/components/LocalDate.svelte';

	let { data }: PageProps = $props();
	let user = $derived(data.user);
	let events = $derived(data.events);
	let statusMap = $derived(data.signupStatusMap);
	let enrollmentCountMap = $derived(data.enrollmentCountMap);

	let loadingIds = $state<Record<string, boolean>>({});
</script>

<svelte:head>
	<title>My Dashboard - Gookminton</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 p-6 text-white">
	<div class="mx-auto max-w-5xl">
		<header class="mb-8 md:flex md:items-center md:justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-white">Welcome, {user.name}</h1>
				<p class="text-gray-400">View upcoming events and manage your bookings.</p>
			</div>
			<div class="mt-4 flex gap-4 md:mt-0">
				<div class="rounded-xl border border-gray-800 bg-gray-900/50 p-4 backdrop-blur-xl">
					<p class="text-xs font-semibold tracking-wider text-gray-500 uppercase">
						Account Balance
					</p>
					<p class="text-2xl font-bold text-emerald-400">${(user.balance / 100).toFixed(2)}</p>
				</div>
				<div
					class="flex flex-col justify-center rounded-xl border border-gray-800 bg-gray-900/50 p-4 backdrop-blur-xl"
				>
					<p class="text-xs font-semibold tracking-wider text-gray-500 uppercase">
						Deposit Ref Code
					</p>
					<p class="font-mono text-xl tracking-widest text-indigo-400 select-all">
						{user.shortCode}
					</p>
				</div>
			</div>
		</header>

		<h2 class="mb-4 text-xl font-bold text-gray-200">Upcoming Events</h2>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each events as ev}
				{@const enrolled = enrollmentCountMap[ev.id] || 0}
				{@const status = statusMap[ev.id]}
				{@const isFull = enrolled >= ev.capacity}
				{@const deadlinePassed = new Date(ev.deadline).getTime() < Date.now()}

				<div
					class="flex flex-col rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-xl transition hover:border-gray-700"
				>
					<h3 class="mb-1 text-lg font-bold text-white">{ev.title}</h3>
					<p class="mb-4 text-sm text-gray-400">
						<LocalDate date={ev.date} /> • {ev.duration} mins
					</p>

					<div class="mb-6 grow space-y-2 text-sm text-gray-300">
						<p><span class="font-medium text-gray-500">Location:</span> {ev.location}</p>
						<p>
							<span class="font-medium text-gray-500">Cost:</span> ${(ev.cost / 100).toFixed(2)}
						</p>
						<p>
							<span class="font-medium text-gray-500">Spots:</span>
							<span class={isFull ? 'text-red-400' : 'text-emerald-400'}
								>{enrolled} / {ev.capacity}</span
							>
						</p>
						<p>
							<span class="font-medium text-gray-500">Deadline:</span>
							<span class={deadlinePassed ? 'text-red-400 line-through' : ''}
								><LocalDate date={ev.deadline} /></span
							>
						</p>
					</div>

					<div class="mt-auto flex items-center justify-between border-t border-gray-800 pt-4">
						{#if status === 'locked'}
							<span
								class="rounded-full border border-indigo-500/20 bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300"
								>Locked In</span
							>
						{:else if status === 'removed'}
							<span
								class="rounded-full border border-red-500/20 bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300"
								>Removed (No Funds)</span
							>
						{:else if status === 'listed' || status === 'waitlist'}
							<span
								class="rounded-full px-3 py-1 text-xs font-semibold {status === 'listed'
									? 'border border-emerald-500/20 bg-emerald-500/20 text-emerald-300'
									: 'border border-yellow-500/20 bg-yellow-500/20 text-yellow-300'}"
							>
								{status === 'listed' ? 'Enrolled' : 'Waitlisted'}
							</span>

							<form
								method="POST"
								action="?/withdraw"
								use:enhance={() => {
									loadingIds[ev.id] = true;
									return async ({ update }) => {
										loadingIds[ev.id] = false;
										update({ reset: false });
									};
								}}
							>
								<input type="hidden" name="eventId" value={ev.id} />
								<button
									disabled={deadlinePassed || loadingIds[ev.id]}
									class="text-sm font-medium text-red-400 transition hover:text-red-300 disabled:opacity-50"
								>
									{loadingIds[ev.id] ? 'Wait...' : 'Withdraw'}
								</button>
							</form>
						{:else}
							<!-- Not enrolled yet -->
							<form
								method="POST"
								action="?/signup"
								class="w-full"
								use:enhance={() => {
									loadingIds[ev.id] = true;
									return async ({ update }) => {
										loadingIds[ev.id] = false;
										update({ reset: false });
									};
								}}
							>
								<input type="hidden" name="eventId" value={ev.id} />
								<button
									disabled={deadlinePassed || loadingIds[ev.id]}
									class="w-full rounded-xl {isFull
										? 'bg-yellow-600 hover:bg-yellow-500'
										: 'bg-indigo-600 hover:bg-indigo-500'} px-4 py-2 font-semibold text-white transition focus:ring-2 focus:outline-none disabled:opacity-50"
								>
									{#if loadingIds[ev.id]}
										Processing...
									{:else if deadlinePassed}
										Registration Closed
									{:else if isFull}
										Join Waitlist
									{:else}
										Sign Up
									{/if}
								</button>
							</form>
						{/if}
					</div>
				</div>
			{/each}
			{#if events.length === 0}
				<div
					class="col-span-full rounded-2xl border border-gray-800 bg-gray-900/50 p-12 text-center"
				>
					<p class="text-gray-400">No upcoming events are available right now.</p>
				</div>
			{/if}
		</div>
	</div>
</div>
