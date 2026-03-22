<script lang="ts">
	import type { PageProps } from './$types';
	import LocalDate from '$lib/components/LocalDate.svelte';
	import EventForm from '$lib/components/EventForm.svelte';

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
						cost: ev.cost,
						isPrivate: ev.isPrivate
					}}
					form={form}
					action="?/editEvent"
					onCancel={() => (editing = false)}
				/>
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
							onclick={() => (editing = true)}
							class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
						>
							Edit Event
						</button>
					{/if}
				</div>
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
										class="rounded-full px-2.5 py-1 text-xs font-semibold {player.signup
											.status === 'locked'
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
							{userSignupStatus === 'withdrawn'
								? 'border border-gray-500/20 bg-gray-500/20 text-gray-400'
								: ''}
							{userSignupStatus === 'removed'
								? 'border border-red-500/20 bg-red-500/20 text-red-300'
								: ''}"
						>
							{userSignupStatus}
						</span>
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>
