<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let ev = $derived(data.event);
	let signups = $derived(data.signups);

	let listed = $derived(
		signups.filter((s) => s.signup.status === 'listed' || s.signup.status === 'locked')
	);
	let waitlist = $derived(
		signups
			.filter((s) => s.signup.status === 'waitlist')
			.sort((a, b) => a.signup.createdAt.getTime() - b.signup.createdAt.getTime())
	);
	let withdrawn = $derived(signups.filter((s) => s.signup.status === 'withdrawn'));
</script>

<svelte:head>
	<title>{ev.title} - Admin Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 p-6 text-white">
	<div class="mx-auto max-w-5xl">
		<header class="mb-8">
			<a href="/admin" class="mb-2 inline-block text-sm text-indigo-400 hover:text-indigo-300"
				>← Back to Dashboard</a
			>
			<h1 class="text-3xl font-bold tracking-tight text-white">{ev.title}</h1>
			<p class="text-gray-400">
				{new Date(ev.date).toLocaleString()} • {ev.location} • {ev.duration} mins
			</p>
			<div class="mt-2 text-sm font-medium text-emerald-400">
				Cost: ${(ev.cost / 100).toFixed(2)}
			</div>
		</header>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
			<div>
				<h2 class="mb-4 text-xl font-bold text-gray-200">
					Registered Players ({listed.length} / {ev.capacity})
				</h2>
				<div
					class="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-xl"
				>
					<ul class="divide-y divide-gray-800">
						{#each listed as player}
							<li class="flex items-center justify-between p-4 transition hover:bg-gray-800/30">
								<div>
									<p class="font-medium text-white">{player.user.name}</p>
									<p class="text-sm text-gray-400">{player.user.email}</p>
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
				</div>
			</div>

			<div>
				<h2 class="mb-4 text-xl font-bold text-gray-200">Waitlist</h2>
				<div
					class="mb-8 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-xl"
				>
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
										<p class="text-sm text-gray-400">{player.user.email}</p>
									</div>
								</div>
							</li>
						{/each}
						{#if waitlist.length === 0}
							<li class="p-6 text-center text-gray-500">Waitlist is empty.</li>
						{/if}
					</ul>
				</div>

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
		</div>
	</div>
</div>
