<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import LocalDate from '$lib/components/LocalDate.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	let { data }: PageProps = $props();
	let user = $derived(data.user);
	let currentEvents = $derived(data.currentEvents);
	let upcomingEvents = $derived(data.upcomingEvents);
	let pastEvents = $derived(data.pastEvents);
	let isAdmin = $derived(data.isAdmin);
	let statusMap = $derived(data.signupStatusMap);
	let enrollmentCountMap = $derived(data.enrollmentCountMap);

	let loadingIds = $state<Record<string, boolean>>({});
	let showPastEvents = $state(false);

	function getStatusVariant(status: string | undefined) {
		switch (status) {
			case 'listed':
				return 'outline';
			case 'waitlist':
				return 'outline';
			case 'locked':
				return 'secondary';
			case 'removed':
				return 'destructive';
			default:
				return 'outline';
		}
	}

	function getStatusClass(status: string | undefined) {
		switch (status) {
			case 'listed':
				return 'border-emerald-500/30 text-emerald-400';
			case 'waitlist':
				return 'border-yellow-500/30 text-yellow-400';
			case 'locked':
				return '';
			case 'removed':
				return '';
			default:
				return '';
		}
	}
</script>

<svelte:head>
	<title>My Dashboard - Gbookminton</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 p-6 text-white">
	<div class="mx-auto max-w-5xl">
		<header class="mb-8 md:flex md:items-center md:justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-white">Welcome, {user.name}</h1>
				<p class="text-muted-foreground">View upcoming events and manage your bookings.</p>
			</div>
			<div class="mt-4 flex gap-4 md:mt-0">
				<div class="rounded-xl border border-gray-800 bg-gray-900/50 p-4 backdrop-blur-xl">
					<p class="text-xs font-semibold tracking-wider text-gray-500 uppercase">
						Account Balance
					</p>
					<p class="text-2xl font-bold text-emerald-400">${(user.balance / 100).toFixed(2)}</p>
				</div>
				<div class="rounded-xl border border-gray-800 bg-gray-900/50 p-4 backdrop-blur-xl">
					<p class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Account Type</p>
					{#if user.accountType === 'company'}
						<Badge variant="company">Company</Badge>
					{:else}
						<Badge variant="plusone">PlusOne</Badge>
					{/if}
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

		<!-- Currently Happening Events -->
		{#if currentEvents.length > 0}
			<section class="mb-8">
				<h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-gray-200">
					<span class="relative flex h-3 w-3">
						<span
							class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
						></span>
						<span class="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
					</span>
					Currently Happening
				</h2>

				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each currentEvents as ev}
						{@const enrolled = enrollmentCountMap[ev.id] || 0}
						{@const status = statusMap[ev.id]}
						{@const deadlinePassed = new Date(ev.deadline).getTime() < Date.now()}

						<div
							class="flex flex-col rounded-2xl border border-emerald-800/50 bg-emerald-900/20 p-6 backdrop-blur-xl transition hover:border-emerald-700"
						>
							<a
								href="/events/{ev.id}"
								class="mb-1 inline-block text-lg font-bold text-white transition hover:text-indigo-300"
								>{ev.title}</a
							>
							<p class="text-muted-foreground mb-4 text-sm">
								<LocalDate date={ev.date} /> • {ev.duration} mins
							</p>
							<div class="mb-6 grow space-y-2 text-sm text-gray-300">
								<p>
									<span class="text-muted-foreground font-medium">Location:</span>
									{ev.location}
								</p>
								<p>
									<span class="text-muted-foreground font-medium">Your Price:</span>
									<span
										class={user.accountType === 'company' ? 'text-blue-400' : 'text-emerald-400'}
									>
										${(
											(user.accountType === 'company' ? ev.costCompany : ev.costPlusOne) / 100
										).toFixed(2)}
									</span>
									<span class="text-muted-foreground">
										({user.accountType === 'company' ? 'Company' : 'PlusOne'})
									</span>
								</p>
								<p>
									<span class="text-muted-foreground font-medium">Spots:</span>
									<span class="text-emerald-400">{enrolled} / {ev.capacity}</span>
								</p>
							</div>

							<div class="mt-auto flex items-center justify-between border-t border-gray-800 pt-4">
								<Badge variant="outline" class="border-emerald-500/30 text-emerald-400"
									>Happening Now</Badge
								>
								<a
									href="/events/{ev.id}"
									class="text-sm font-medium text-indigo-400 hover:text-indigo-300"
								>
									View Details
								</a>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Upcoming Events -->
		<section class="mb-8">
			<h2 class="mb-4 text-xl font-bold text-gray-200">Upcoming Events</h2>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each upcomingEvents as ev}
					{@const enrolled = enrollmentCountMap[ev.id] || 0}
					{@const status = statusMap[ev.id]}
					{@const isFull = enrolled >= ev.capacity}
					{@const deadlinePassed = new Date(ev.deadline).getTime() < Date.now()}

					<div
						class="flex flex-col rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-xl transition hover:border-gray-700"
					>
						<a
							href="/events/{ev.id}"
							class="mb-1 inline-block text-lg font-bold text-white transition hover:text-indigo-300"
							>{ev.title}</a
						>
						<p class="text-muted-foreground mb-4 text-sm">
							<LocalDate date={ev.date} /> • {ev.duration} mins
						</p>
						<div class="mb-6 grow space-y-2 text-sm text-gray-300">
							<p><span class="text-muted-foreground font-medium">Location:</span> {ev.location}</p>
							<p>
								<span class="text-muted-foreground font-medium">Your Price:</span>
								<span class={user.accountType === 'company' ? 'text-blue-400' : 'text-emerald-400'}>
									${(
										(user.accountType === 'company' ? ev.costCompany : ev.costPlusOne) / 100
									).toFixed(2)}
								</span>
								<span class="text-muted-foreground">
									({user.accountType === 'company' ? 'Company' : 'PlusOne'})
								</span>
							</p>
							<p>
								<span class="text-muted-foreground font-medium">Spots:</span>
								<span class={isFull ? 'text-red-400' : 'text-emerald-400'}>
									{enrolled} / {ev.capacity}
								</span>
							</p>
							<p>
								<span class="text-muted-foreground font-medium">Deadline:</span>
								<span class={deadlinePassed ? 'text-red-400 line-through' : ''}>
									<LocalDate date={ev.deadline} />
								</span>
							</p>
						</div>

						<div class="mt-auto flex items-center justify-between border-t border-gray-800 pt-4">
							{#if status === 'locked'}
								<Badge variant="secondary" class={getStatusClass(status)}>Locked In</Badge>
							{:else if status === 'removed'}
								<Badge variant="destructive">Removed (No Funds)</Badge>
							{:else if status === 'listed' || status === 'waitlist'}
								<Badge variant={getStatusVariant(status)} class={getStatusClass(status)}>
									{status === 'listed' ? 'Enrolled' : 'Waitlisted'}
								</Badge>

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
									<Button
										type="submit"
										class="w-full"
										disabled={deadlinePassed || loadingIds[ev.id]}
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
									</Button>
								</form>
							{/if}
						</div>
					</div>
				{/each}
				{#if upcomingEvents.length === 0 && currentEvents.length === 0}
					<div
						class="col-span-full rounded-2xl border border-gray-800 bg-gray-900/50 p-12 text-center"
					>
						<p class="text-muted-foreground">No upcoming events are available right now.</p>
					</div>
				{/if}
			</div>
		</section>

		<!-- Admin-only Past Events (Collapsed) -->
		{#if isAdmin && pastEvents.length > 0}
			<section class="mt-8">
				<button
					onclick={() => (showPastEvents = !showPastEvents)}
					class="mb-4 flex w-full items-center justify-between rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-left transition hover:border-gray-700"
				>
					<span class="text-xl font-bold text-gray-200">Past Events (Admin)</span>
					<svg
						class="h-5 w-5 text-gray-400 transition-transform {showPastEvents ? 'rotate-180' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>

				{#if showPastEvents}
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{#each pastEvents as ev}
							{@const enrolled = enrollmentCountMap[ev.id] || 0}
							{@const status = statusMap[ev.id]}
							{@const isFull = enrolled >= ev.capacity}

							<div
								class="flex flex-col rounded-2xl border border-gray-800/50 bg-gray-900/30 p-6 opacity-75 backdrop-blur-xl transition hover:border-gray-700 hover:opacity-100"
							>
								<a
									href="/events/{ev.id}"
									class="mb-1 inline-block text-lg font-bold text-white transition hover:text-indigo-300"
									>{ev.title}</a
								>
								<p class="text-muted-foreground mb-4 text-sm">
									<LocalDate date={ev.date} /> • {ev.duration} mins
								</p>
								<div class="mb-6 grow space-y-2 text-sm text-gray-300">
									<p>
										<span class="text-muted-foreground font-medium">Location:</span>
										{ev.location}
									</p>
									<p>
										<span class="text-muted-foreground font-medium">Company:</span>
										<span class="text-blue-400">${(ev.costCompany / 100).toFixed(2)}</span>
									</p>
									<p>
										<span class="text-muted-foreground font-medium">PlusOne:</span>
										<span class="text-emerald-400">${(ev.costPlusOne / 100).toFixed(2)}</span>
									</p>
									<p>
										<span class="text-muted-foreground font-medium">Enrolled:</span>
										<span class="text-gray-300">{enrolled} / {ev.capacity}</span>
									</p>
								</div>

								<div class="mt-auto border-t border-gray-800 pt-4">
									<a
										href="/events/{ev.id}"
										class="text-sm font-medium text-indigo-400 hover:text-indigo-300"
									>
										View Details
									</a>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	</div>
</div>
