<script lang="ts">
	import type { PageProps } from './$types';
	import LocalDate from '$lib/components/LocalDate.svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	let { data }: PageProps = $props();
	let events = $derived(data.events);
	let showPast = $derived(data.showPast);
	let countMap = $derived(data.countMap);

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
			<div class="flex flex-wrap gap-3">
				<Button href="/admin/settings" variant="outline">Settings</Button>
				<Button href="/admin/users" variant="outline">Manage Users</Button>
				<Button href="/admin?showPast={showPast ? 'false' : 'true'}" variant="outline">
					{showPast ? 'Hide Past Events' : 'Show Past Events'}
				</Button>
				<Button href="/admin/events/new">Create New Event</Button>
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
							<th class="px-6 py-4 font-medium">Enrolled / Waitlist</th>
							<th class="px-6 py-4 font-medium">Pricing / Deadline</th>
							<th class="px-6 py-4 text-right font-medium">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each events as ev}
							{@const counts = countMap[ev.id] || { enrolled: 0, waitlisted: 0 }}
							<tr class="transition hover:bg-gray-800/30">
								<td class="px-6 py-4 font-medium text-white">{ev.title}</td>
								<td class="px-6 py-4">
									<LocalDate date={ev.date} />
									<span class="text-xs text-gray-500">({ev.duration} min)</span>
								</td>
								<td class="px-6 py-4">{ev.location}</td>
								<td class="px-6 py-4">
									<span class="font-medium">{counts.enrolled}</span> / {ev.capacity}
									{#if counts.waitlisted > 0}
										<span class="ml-2 text-yellow-400">({counts.waitlisted} waitlist)</span>
									{/if}
								</td>
								<td class="px-6 py-4">
									<div class="flex flex-col gap-0.5">
										<span class="text-blue-400">
											${(ev.costCompany / 100).toFixed(2)}
											<span class="text-xs text-gray-500">Company</span>
										</span>
										<span class="text-emerald-400">
											${(ev.costPlusOne / 100).toFixed(2)}
											<span class="text-xs text-gray-500">PlusOne</span>
										</span>
									</div>
									<div class="mt-1 text-xs text-red-400"><LocalDate date={ev.deadline} /></div>
								</td>
								<td class="px-6 py-4 text-right">
									<Button href="/events/{ev.id}" variant="ghost" size="sm">Manage</Button>
								</td>
							</tr>
						{/each}
						{#if events.length === 0}
							<tr>
								<td colspan="6" class="px-6 py-8 text-center text-gray-500">
									No upcoming events found. Create one.
								</td>
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
									<th class="px-6 py-4 font-medium">Enrolled / Waitlist</th>
									<th class="px-6 py-4 font-medium">Pricing / Deadline</th>
									<th class="px-6 py-4 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800">
								{#each currentEvents as ev}
									{@const counts = countMap[ev.id] || { enrolled: 0, waitlisted: 0 }}
									<tr class="transition hover:bg-gray-800/30">
										<td class="px-6 py-4 font-medium text-white">{ev.title}</td>
										<td class="px-6 py-4">
											<LocalDate date={ev.date} />
											<span class="text-xs text-gray-500">({ev.duration} min)</span>
										</td>
										<td class="px-6 py-4">{ev.location}</td>
										<td class="px-6 py-4">
											<span class="font-medium">{counts.enrolled}</span> / {ev.capacity}
											{#if counts.waitlisted > 0}
												<span class="ml-2 text-yellow-400">({counts.waitlisted} waitlist)</span>
											{/if}
										</td>
										<td class="px-6 py-4">
											<div class="flex flex-col gap-0.5">
												<span class="text-blue-400">
													${(ev.costCompany / 100).toFixed(2)}
													<span class="text-xs text-gray-500">Co</span>
												</span>
												<span class="text-emerald-400">
													${(ev.costPlusOne / 100).toFixed(2)}
													<span class="text-xs text-gray-500">P1</span>
												</span>
											</div>
											<div class="mt-1 text-xs text-red-400"><LocalDate date={ev.deadline} /></div>
										</td>
										<td class="px-6 py-4 text-right">
											<Button href="/events/{ev.id}" variant="ghost" size="sm">Manage</Button>
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
									<th class="px-6 py-4 font-medium">Enrolled / Waitlist</th>
									<th class="px-6 py-4 font-medium">Pricing</th>
									<th class="px-6 py-4 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800/50">
								{#each pastEvents as ev}
									{@const counts = countMap[ev.id] || { enrolled: 0, waitlisted: 0 }}
									<tr class="opacity-75 transition hover:bg-gray-800/20">
										<td class="px-6 py-4 font-medium text-gray-300">{ev.title}</td>
										<td class="px-6 py-4 text-gray-500">
											<LocalDate date={ev.date} />
											<span class="text-xs text-gray-600">({ev.duration} min)</span>
										</td>
										<td class="px-6 py-4 text-gray-500">{ev.location}</td>
										<td class="px-6 py-4 text-gray-500">
											{counts.enrolled} / {ev.capacity}
											{#if counts.waitlisted > 0}
												<span class="text-yellow-500">({counts.waitlisted} waitlist)</span>
											{/if}
										</td>
										<td class="px-6 py-4 text-gray-500">
											<div class="flex flex-col gap-0.5">
												<span class="text-blue-400">
													${(ev.costCompany / 100).toFixed(2)}
													<span class="text-xs text-gray-600">Co</span>
												</span>
												<span class="text-emerald-400">
													${(ev.costPlusOne / 100).toFixed(2)}
													<span class="text-xs text-gray-600">P1</span>
												</span>
											</div>
										</td>
										<td class="px-6 py-4 text-right">
											<Button href="/events/{ev.id}" variant="ghost" size="sm">View</Button>
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
