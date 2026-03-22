<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	let { data, form }: PageProps = $props();
	let domains = $derived(data.domains);

	let newDomain = $state('');
	let saving = $state(false);
	let removingId = $state<string | null>(null);

	function getDomainError(f: typeof form): string | undefined {
		if (f && 'domainError' in f) {
			return f.domainError as string;
		}
		return undefined;
	}

	let domainError = $derived(getDomainError(form));
</script>

<svelte:head>
	<title>Settings - Admin - Gbookminton</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 p-6 text-white">
	<div class="mx-auto max-w-3xl">
		<header class="mb-8">
			<div class="mb-6 flex items-center gap-4">
				<a
					href="/admin"
					class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 transition hover:bg-gray-700"
				>
					Back to Dashboard
				</a>
			</div>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-white">Settings</h1>
				<p class="text-muted-foreground text-sm">Configure system settings.</p>
			</div>
		</header>

		<!-- Company Email Domains Section -->
		<section class="mb-8">
			<h2 class="mb-4 text-xl font-bold text-gray-200">Company Email Domains</h2>
			<p class="text-muted-foreground mb-4 text-sm">
				Users with email addresses from these domains will automatically be classified as
				<strong class="text-blue-400">Company</strong> type. All other users are
				<strong class="text-emerald-400">PlusOne</strong> type.
			</p>

			{#if form?.error && !domainError}
				<div
					class="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-xl border px-4 py-3 text-sm"
				>
					{form.error}
				</div>
			{/if}

			<div
				class="mb-4 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-xl"
			>
				<table class="w-full text-left text-sm text-gray-400">
					<thead class="border-b border-gray-800 bg-gray-900/80 text-xs text-gray-500 uppercase">
						<tr>
							<th class="px-6 py-4 font-medium">Domain</th>
							<th class="px-6 py-4 font-medium">Added</th>
							<th class="px-6 py-4 text-right font-medium">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each domains as d}
							<tr class="transition hover:bg-gray-800/30">
								<td class="px-6 py-4 font-medium text-white">{d.domain}</td>
								<td class="px-6 py-4">{new Date(d.createdAt).toLocaleDateString()}</td>
								<td class="px-6 py-4 text-right">
									<form
										method="POST"
										action="?/removeDomain"
										use:enhance={() => {
											removingId = d.id;
											return async ({ update }) => {
												removingId = null;
												update();
											};
										}}
									>
										<input type="hidden" name="domainId" value={d.id} />
										<button
											type="submit"
											disabled={removingId === d.id}
											class="text-destructive hover:text-destructive/80 disabled:opacity-50"
										>
											{removingId === d.id ? 'Removing...' : 'Remove'}
										</button>
									</form>
								</td>
							</tr>
						{/each}
						{#if domains.length === 0}
							<tr>
								<td colspan="3" class="px-6 py-8 text-center text-gray-500">
									No domains configured. Add a domain below.
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>

			<!-- Add Domain Form -->
			<div class="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-xl">
				<h3 class="mb-4 text-lg font-semibold text-white">Add Company Domain</h3>
				<form
					method="POST"
					action="?/addDomain"
					use:enhance={() => {
						saving = true;
						return async ({ update }) => {
							saving = false;
							newDomain = '';
							update();
						};
					}}
				>
					<div class="flex gap-3">
						<div class="flex-1 space-y-1">
							<Input
								type="text"
								name="domain"
								bind:value={newDomain}
								placeholder="example.com"
								class={domainError ? 'border-destructive' : ''}
							/>
							{#if domainError}
								<p class="text-destructive text-xs">{domainError}</p>
							{/if}
						</div>
						<Button type="submit" disabled={saving || !newDomain.trim()}>
							{saving ? 'Adding...' : 'Add Domain'}
						</Button>
					</div>
				</form>
			</div>
		</section>
	</div>
</div>
