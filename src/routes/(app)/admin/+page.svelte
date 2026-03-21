<script lang="ts">
	import type { PageProps } from './$types';
	import LocalDate from '$lib/components/LocalDate.svelte';

	let { data }: PageProps = $props();
	let events = $derived(data.events);
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
					href="/admin/events/new"
					class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
				>
					Create New Event
				</a>
			</div>
		</header>

		<div class="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-xl">
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
								<a href="/events/{ev.id}" class="text-indigo-400 hover:text-indigo-300"
									>Manage</a
								>
							</td>
						</tr>
					{/each}
					{#if events.length === 0}
						<tr>
							<td colspan="6" class="px-6 py-8 text-center text-gray-500"
								>No events found. Create one.</td
							>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
