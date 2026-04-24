<script lang="ts">
	import type { PageProps } from './$types';
	import LocalDate from '$lib/components/LocalDate.svelte';
	import EventForm from '$lib/components/EventForm.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

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

	let editing = $state(false);

	function getStatusVariant(status: string) {
		switch (status) {
			case 'listed':
				return 'outline';
			case 'waitlist':
				return 'outline';
			case 'locked':
				return 'secondary';
			case 'withdrawn':
				return 'outline';
			case 'removed':
				return 'destructive';
			default:
				return 'outline';
		}
	}

	function getStatusClass(status: string) {
		switch (status) {
			case 'listed':
				return 'border-emerald-500/30 text-emerald-400';
			case 'waitlist':
				return 'border-yellow-500/30 text-yellow-400';
			case 'locked':
				return '';
			case 'withdrawn':
				return 'border-gray-500/30 text-gray-400';
			case 'removed':
				return '';
			default:
				return '';
		}
	}
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
				<EventForm
					mode="edit"
					event={{
						id: ev.id,
						title: ev.title,
						date: ev.date,
						deadline: ev.deadline,
						location: ev.location,
						duration: ev.duration,
						description: ev.description,
						capacity: ev.capacity,
						costCompany: ev.costCompany,
						costPlusOne: ev.costPlusOne,
						isPrivate: ev.isPrivate
					}}
					{form}
					adminSettings={data.adminSettings}
					action="?/editEvent"
					onCancel={() => (editing = false)}
				/>
			{:else}
				<!-- View mode header -->
				<div class="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h1 class="mb-1 text-3xl font-bold tracking-tight text-white">{ev.title}</h1>
						<p class="text-muted-foreground">
							<LocalDate date={ev.date} /> • {ev.location} • {ev.duration} mins
						</p>
						<!-- Pricing -->
						<div class="mt-2 flex flex-wrap items-center gap-4 text-sm">
							<div class="flex items-center gap-2">
								<span class="text-muted-foreground">Company:</span>
								<span class="font-medium text-blue-400">${(ev.costCompany / 100).toFixed(2)}</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-muted-foreground">PlusOne:</span>
								<span class="font-medium text-emerald-400"
									>${(ev.costPlusOne / 100).toFixed(2)}</span
								>
							</div>
						</div>
						{#if ev.isPrivate && isAdmin}
							<div class="mt-2">
								<Badge variant="outline" class="border-yellow-500/30 text-yellow-400"
									>🔒 Private</Badge
								>
							</div>
						{/if}
						{#if ev.isLocked}
							<div class="mt-2">
								<Badge variant="destructive">Locked</Badge>
							</div>
						{/if}
						{#if ev.description}
							<p class="text-muted-foreground mt-3 max-w-2xl text-sm">{ev.description}</p>
						{/if}
					</div>
					{#if isAdmin}
						<Button onclick={() => (editing = true)}>Edit Event</Button>
					{/if}
				</div>
			{/if}
		</header>

		<!-- Deadline info bar -->
		<div
			class="text-muted-foreground mb-8 rounded-xl border border-gray-800 bg-gray-900/40 px-5 py-3 text-sm"
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
							<p class="text-muted-foreground text-sm">players registered</p>
							<p class="mt-2 text-xs text-gray-600">Attendee list is private for this event.</p>
						</div>
					{:else}
						<ul class="divide-y divide-gray-800">
							{#each listed as player}
								<li class="flex items-center justify-between p-4 transition hover:bg-gray-800/30">
									<div>
										<p class="font-medium text-white">{player.user.name}</p>
										{#if isAdmin}
											<p class="text-muted-foreground text-sm">{player.user.email}</p>
										{/if}
									</div>
								</li>
							{/each}
							{#if listed.length === 0}
								<li class="text-muted-foreground p-6 text-center">No players registered yet.</li>
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
								<p class="text-muted-foreground text-sm">on waitlist</p>
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
													<p class="text-muted-foreground text-sm">{player.user.email}</p>
												{/if}
											</div>
										</div>
									</li>
								{/each}
								{#if waitlist.length === 0}
									<li class="text-muted-foreground p-6 text-center">Waitlist is empty.</li>
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
									<li class="text-muted-foreground p-6 text-center">No withdrawals.</li>
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
					<p class="text-muted-foreground text-sm">
						<span class="font-medium text-white">Your status:</span>
						<Badge
							variant={getStatusVariant(userSignupStatus)}
							class="ml-2 {getStatusClass(userSignupStatus)}"
						>
							{userSignupStatus}
						</Badge>
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>
