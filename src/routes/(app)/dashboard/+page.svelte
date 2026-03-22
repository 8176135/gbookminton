<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import LocalDate from '$lib/components/LocalDate.svelte';

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
</script>

<svelte:head>
	<title>My Dashboard - Gbookminton</title>
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
				<div class="rounded-xl border border-gray-800 bg-gray-900/50 p-4 backdrop-blur-xl">
					<p class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Account Type</p>
					<p
						class="text-sm font-semibold {user.accountType === 'company'
							? 'text-blue-400'
							: 'text-emerald-400'}"
					>
						{user.accountType === 'company' ? 'Company' : 'PlusOne'}
					</p>
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
							<p class="mb-4 text-sm text-gray-400">
								<LocalDate date={ev.date} /> • {ev.duration} mins
							</p>
							<div class="mb-6 grow space-y-2 text-sm text-gray-300">
								<p><span class="font-medium text-gray-500">Location:</span> {ev.location}</p>
								<p>
									<span class="font-medium text-gray-500">Your Price:</span>
									<span
										class={user.accountType === 'company' ? 'text-blue-400' : 'text-emerald-400'}
									>
										${(
											(user.accountType === 'company' ? ev.costCompany : ev.costPlusOne) / 100
										).toFixed(2)}
									</span>
									<span class="text-gray-500">
										({user.accountType === 'company' ? 'Company' : 'PlusOne'})
									</span>
								</p>
								<p>
									<span class="font-medium text-gray-500">Spots:</span>
									<span class="text-emerald-400">{enrolled} / {ev.capacity}</span>
								</p>
							</div>

							<div class="mt-auto flex items-center justify-between border-t border-gray-800 pt-4">
								<span
									class="rounded-full border border-emerald-500/20 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300"
								>
									Happening Now
								</span>
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
						<p class="mb-4 text-sm text-gray-400">
							<LocalDate date={ev.date} /> • {ev.duration} mins
						</p>
						<div class="mb-6 grow space-y-2 text-sm text-gray-300">
							<p><span class="font-medium text-gray-500">Location:</span> {ev.location}</p>
							<p>
								<span class="font-medium text-gray-500">Your Price:</span>
								<span class={user.accountType === 'company' ? 'text-blue-400' : 'text-emerald-400'}>
									${(
										(user.accountType === 'company' ? ev.costCompany : ev.costPlusOne) / 100
									).toFixed(2)}
								</span>
								<span class="text-gray-500">
									({user.accountType === 'company' ? 'Company' : 'PlusOne'})
								</span>
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
								>
									Locked In
								</span>
							{:else if status === 'removed'}
								<span
									class="rounded-full border border-red-500/20 bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300"
								>
									Removed (No Funds)
								</span>
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
				{#if upcomingEvents.length === 0 && currentEvents.length === 0}
					<div
						class="col-span-full rounded-2xl border border-gray-800 bg-gray-900/50 p-12 text-center"
					>
						<p class="text-gray-400">No upcoming events are available right now.</p>
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
									class="mb-1 inline-block text-lg font-bold text-gray-300 transition hover:text-indigo-300"
									>{ev.title}</a
								>
								<p class="mb-4 text-sm text-gray-500">
									<LocalDate date={ev.date} /> • {ev.duration} mins
								</p>
								<div class="mb-6 grow space-y-2 text-sm text-gray-400">
									<p><span class="font-medium text-gray-500">Location:</span> {ev.location}</p>
									<p>
										<span class="font-medium text-gray-500">Cost:</span>
										<span>
											<span class="mx-1 text-blue-400">${(ev.costCompany / 100).toFixed(2)}</span>
											<span class="text-gray-500">/</span>
											<span class="mx-1 text-emerald-400">${(ev.costPlusOne / 100).toFixed(2)}</span
											>
										</span>
									</p>
									<p>
										<span class="font-medium text-gray-500">Spots:</span>
										<span class="text-gray-400">{enrolled} / {ev.capacity}</span>
									</p>
								</div>

								<div class="mt-auto border-t border-gray-800 pt-4">
									{#if status === 'locked'}
										<span
											class="rounded-full border border-indigo-500/20 bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300"
										>
											Locked In
										</span>
									{:else if status === 'removed'}
										<span
											class="rounded-full border border-red-500/20 bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300"
										>
											Removed
										</span>
									{:else if status === 'listed' || status === 'waitlist'}
										<span
											class="rounded-full px-3 py-1 text-xs font-semibold {status === 'listed'
												? 'border border-emerald-500/20 bg-emerald-500/20 text-emerald-300'
												: 'border border-yellow-500/20 bg-yellow-500/20 text-yellow-300'}"
										>
											{status === 'listed' ? 'Attended' : 'Waitlisted'}
										</span>
									{:else}
										<span class="text-sm text-gray-500">Not Registered</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	</div>
</div>
