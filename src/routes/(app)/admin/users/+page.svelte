<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';

	let { data, form }: PageProps = $props();
	let users = $derived(data.users);

	let editingUser = $state<string | null>(null);
	let selectedType = $state<string>('');
	let saving = $state(false);

	function startEdit(userId: string, currentType: string) {
		editingUser = userId;
		selectedType = currentType;
	}

	function cancelEdit() {
		editingUser = null;
		selectedType = '';
	}
</script>

<svelte:head>
	<title>Manage Users - Admin - Gbookminton</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 p-6 text-white">
	<div class="mx-auto max-w-7xl">
		<header class="mb-8">
			<div class="mb-6 flex items-center gap-4">
				<Button href="/admin" variant="outline">Back to Dashboard</Button>
			</div>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-white">Manage Users</h1>
				<p class="text-muted-foreground text-sm">View and manage user accounts and types.</p>
			</div>
		</header>

		{#if form?.error}
			<div
				class="border-destructive/30 bg-destructive/10 text-destructive mb-6 rounded-xl border px-4 py-3 text-sm"
			>
				{form.error}
			</div>
		{/if}

		{#if form?.success}
			<div
				class="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400"
			>
				Account type updated successfully.
			</div>
		{/if}

		<div class="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-xl">
			<table class="w-full text-left text-sm text-gray-400">
				<thead class="border-b border-gray-800 bg-gray-900/80 text-xs text-gray-500 uppercase">
					<tr>
						<th class="px-6 py-4 font-medium">Name</th>
						<th class="px-6 py-4 font-medium">Email</th>
						<th class="px-6 py-4 font-medium">Account Type</th>
						<th class="px-6 py-4 font-medium">Balance</th>
						<th class="px-6 py-4 font-medium">Created</th>
						<th class="px-6 py-4 text-right font-medium">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-800">
					{#each users as u}
						<tr class="transition hover:bg-gray-800/30">
							<td class="px-6 py-4 font-medium text-white">{u.name}</td>
							<td class="px-6 py-4">{u.email}</td>
							<td class="px-6 py-4">
								{#if editingUser === u.id}
									<form
										method="POST"
										action="?/updateAccountType"
										use:enhance={() => {
											saving = true;
											return async ({ update }) => {
												saving = false;
												cancelEdit();
												update();
											};
										}}
									>
										<input type="hidden" name="userId" value={u.id} />
										<div class="flex items-center gap-2">
											<select
												name="accountTypeSelect"
												bind:value={selectedType}
												class="border-input flex h-8 w-32 items-center justify-between gap-1.5 rounded-lg border bg-transparent py-2 pr-2 pl-2.5 text-sm"
											>
												<option value="plusone">PlusOne</option>
												<option value="company">Company</option>
											</select>
											<input type="hidden" name="accountType" value={selectedType} />
											<Button type="submit" size="sm" disabled={saving}>
												{saving ? 'Saving...' : 'Save'}
											</Button>
											<Button type="button" variant="outline" size="sm" onclick={cancelEdit}>
												Cancel
											</Button>
										</div>
									</form>
								{:else if u.accountType === 'company'}
									<Badge variant="company">Company</Badge>
								{:else}
									<Badge variant="plusone">PlusOne</Badge>
								{/if}
							</td>
							<td class="px-6 py-4">
								<span class="text-emerald-400">${(u.balance / 100).toFixed(2)}</span>
							</td>
							<td class="px-6 py-4">
								{new Date(u.createdAt).toLocaleDateString()}
							</td>
							<td class="px-6 py-4 text-right">
								{#if editingUser !== u.id}
									<button
										onclick={() => startEdit(u.id, u.accountType)}
										class="text-indigo-400 hover:text-indigo-300"
									>
										Edit Type
									</button>
								{/if}
							</td>
						</tr>
					{/each}
					{#if users.length === 0}
						<tr>
							<td colspan="6" class="px-6 py-8 text-center text-gray-500">No users found.</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
