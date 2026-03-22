<script lang="ts">
	import type { PageProps } from './$types';
	import LocalDate from '$lib/components/LocalDate.svelte';

	let { data }: PageProps = $props();
	let events = $derived(data.events);
	let showPast = $derived(data.showPast);

	const now = new Date();

	function isPastEvent(ev: { date: string; duration: number }): boolean {
		const endTime = new Date(new Date(ev.date).getTime() + ev.duration * 60 * 1000);
		return endTime < now;
	}

	// Separate current/past for display when showPast is true
	let currentEvents = $derived(showPast ? events.filter((ev: any) => !isPastEvent(ev)) : events);
	let pastEvents = $derived(showPast ? events.filter((ev: any) => isPastEvent(ev)) : []);
</script>

<svelte:head>
	<title>Admin Dashboard - Gbookminton</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 p-6 text-white">
	<div class="mx-auto max-w-7xl">
		<header class="mb-8 flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-white">Admin Dashboard</h1>
				<p class="text-sm text-gray-400">Manage events, bookings, and users.</p>
			</div>
			<div class="flex gap-4">
				<a
					href="/admin?showPast={showPast ? 'false' : 'true'}"
					class="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-gray-700"
				>
					{showPast ? 'Hide Past Events' : 'Show Past Events'}
				</a>
				<a
					href="/admin/events/new"
					class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
				>
					Create New Event
				</a>
			</div>
		</header>

		{#if !showPast}
			<!-- Simple view when hiding past events -->
			<div
				class="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-xl"
			>
				<table class="w-full text-left text-sm text-gray-400">
					<thead class="border-b border-gray-800 bg-gray-900/80 text-xs text-gray-500 uppercase">
						<tr>
							<th class="px-6 py-4 font-medium">Event Title</th>
							<th class="px-6 py-4 font-medium">Date & Time</th>
							<th class="px-6 py-4 font-medium">Location</th>
							<th class="px-6 py-4 font-medium">Capacity</th>
							<th class="px-6 py-4 font-medium">Cost / Deadline</th>
							<th class="px-6 py-4 text-right font-medium">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each events as ev}
							<tr class="transition hover:bg-gray-800/30">
								<td class="px-6 py-4 font-medium text-white">{ev.title}</td>
								<td class="px-6 py-4"
									><LocalDate date={ev.date} />
									<span class="text-xs text-gray-500">({ev.duration} min)</span></td
								>
								<td class="px-6 py-4">{ev.location}</td>
								<td class="px-6 py-4">{ev.capacity}</td>
								<td class="px-6 py-4">
									<div class="font-medium text-emerald-400">${(ev.cost / 100).toFixed(2)}</div>
									<div class="text-xs text-red-400"><LocalDate date={ev.deadline} /></div>
								</td>
								<td class="px-6 py-4 text-right">
									<a href="/events/{ev.id}" class="text-indigo-400 hover:text-indigo-300">Manage</a>
								</td>
							</tr>
						{/each}
						{#if events.length === 0}
							<tr>
								<td colspan="6" class="px-6 py-8 text-center text-gray-500"
									>No upcoming events found. Create one.</td
								>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		{:else}
			<!-- Split view when showing past events -->
			<!-- Upcoming/Current Events -->
			{#if currentEvents.length > 0}
				<section class="mb-8">
					<h2 class="mb-4 text-xl font-bold text-gray-200">Upcoming & Current Events</h2>
					<div
						class="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-xl"
					>
						<table class="w-full text-left text-sm text-gray-400">
							<thead
								class="border-b border-gray-800 bg-gray-900/80 text-xs text-gray-500 uppercase"
							>
								<tr>
									<th class="px-6 py-4 font-medium">Event Title</th>
									<th class="px-6 py-4 font-medium">Date & Time</th>
									<th class="px-6 py-4 font-medium">Location</th>
									<th class="px-6 py-4 font-medium">Capacity</th>
									<th class="px-6 py-4 font-medium">Cost / Deadline</th>
									<th class="px-6 py-4 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800">
								{#each currentEvents as ev}
									<tr class="transition hover:bg-gray-800/30">
										<td class="px-6 py-4 font-medium text-white">{ev.title}</td>
										<td class="px-6 py-4"
											><LocalDate date={ev.date} />
											<span class="text-xs text-gray-500">({ev.duration} min)</span></td
										>
										<td class="px-6 py-4">{ev.location}</td>
										<td class="px-6 py-4">{ev.capacity}</td>
										<td class="px-6 py-4">
											<div class="font-medium text-emerald-400">${(ev.cost / 100).toFixed(2)}</div>
											<div class="text-xs text-red-400"><LocalDate date={ev.deadline} /></div>
										</td>
										<td class="px-6 py-4 text-right">
											<a href="/events/{ev.id}" class="text-indigo-400 hover:text-indigo-300"
												>Manage</a
											>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</section>
			{/if}

			<!-- Past Events -->
			{#if pastEvents.length > 0}
				<section>
					<h2 class="mb-4 text-xl font-bold text-gray-200">Past Events</h2>
					<div
						class="overflow-hidden rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-xl"
					>
						<table class="w-full text-left text-sm text-gray-400">
							<thead
								class="border-b border-gray-800/50 bg-gray-900/50 text-xs text-gray-500 uppercase"
							>
								<tr>
									<th class="px-6 py-4 font-medium">Event Title</th>
									<th class="px-6 py-4 font-medium">Date & Time</th>
									<th class="px-6 py-4 font-medium">Location</th>
									<th class="px-6 py-4 font-medium">Capacity</th>
									<th class="px-6 py-4 font-medium">Cost / Deadline</th>
									<th class="px-6 py-4 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800/50">
								{#each pastEvents as ev}
									<tr class="opacity-75 transition hover:bg-gray-800/20">
										<td class="px-6 py-4 font-medium text-gray-300">{ev.title}</td>
										<td class="px-6 py-4 text-gray-500"
											><LocalDate date={ev.date} />
											<span class="text-xs text-gray-600">({ev.duration} min)</span></td
										>
										<td class="px-6 py-4 text-gray-500">{ev.location}</td>
										<td class="px-6 py-4 text-gray-500">{ev.capacity}</td>
										<td class="px-6 py-4 text-gray-500">
											<div>${(ev.cost / 100).toFixed(2)}</div>
											<div class="text-xs"><LocalDate date={ev.deadline} /></div>
										</td>
										<td class="px-6 py-4 text-right">
											<a href="/events/{ev.id}" class="text-indigo-400/70 hover:text-indigo-300"
												>View</a
											>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</section>
			{/if}

			{#if currentEvents.length === 0 && pastEvents.length === 0}
				<div class="rounded-2xl border border-gray-800 bg-gray-900/50 p-12 text-center">
					<p class="text-gray-400">No events found. Create one.</p>
				</div>
			{/if}
		{/if}
	</div>
</div>
