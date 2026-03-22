<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';
	import LocalDate from '$lib/components/LocalDate.svelte';

	interface Props {
		data: { user: any; pastEvents: any[] };
	}

	let { data }: Props = $props();
	let pastEvents = $derived(data.pastEvents);
	let name = $state('');

	$effect(() => {
		if (data.user?.name) {
			name = data.user.name;
		}
	});

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	let nameLoading = $state(false);
	let nameError = $state('');
	let nameSuccess = $state('');

	let passwordLoading = $state(false);
	let passwordError = $state('');
	let passwordSuccess = $state('');

	const handleUpdateName = async (e: Event) => {
		e.preventDefault();
		nameLoading = true;
		nameError = '';
		nameSuccess = '';
		try {
			const { error } = await authClient.updateUser({
				name: name
			});

			if (error) {
				nameError = error.message ?? 'Failed to update name.';
			} else {
				nameSuccess = 'Name updated successfully.';
				await invalidateAll();
			}
		} catch (err) {
			nameError = 'An unexpected error occurred.';
		} finally {
			nameLoading = false;
		}
	};

	const handleChangePassword = async (e: Event) => {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			passwordError = 'New passwords do not match.';
			return;
		}

		passwordLoading = true;
		passwordError = '';
		passwordSuccess = '';
		try {
			const { error } = await authClient.changePassword({
				currentPassword,
				newPassword
			});

			if (error) {
				passwordError = error.message ?? 'Failed to change password.';
			} else {
				passwordSuccess = 'Password changed successfully.';
				currentPassword = '';
				newPassword = '';
				confirmPassword = '';
			}
		} catch (err) {
			passwordError = 'An unexpected error occurred.';
		} finally {
			passwordLoading = false;
		}
	};
</script>

<svelte:head>
	<title>Account Settings - Gbookminton</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
	<div class="mb-10">
		<h1 class="font-outfit text-4xl font-bold tracking-tight text-white">Account Settings</h1>
		<p class="mt-2 text-gray-400">Manage your profile and security settings.</p>
	</div>

	<div class="grid gap-8 lg:grid-cols-2">
		<!-- Profile Information -->
		<div class="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl">
			<h2 class="font-outfit mb-6 text-xl font-semibold text-white">Profile Information</h2>

			{#if nameError}
				<div
					class="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
				>
					{nameError}
				</div>
			{/if}

			{#if nameSuccess}
				<div
					class="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400"
				>
					{nameSuccess}
				</div>
			{/if}

			<form onsubmit={handleUpdateName} class="space-y-5">
				<div>
					<label
						for="email-display"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
						>Email Address (Locked)</label
					>
					<input
						type="email"
						id="email-display"
						value={data.user?.email}
						disabled
						class="w-full rounded-2xl border border-white/5 bg-white/2 px-4 py-3.5 text-gray-500 transition focus:outline-none"
					/>
				</div>

				<div>
					<label
						for="name"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
						>Display Name</label
					>
					<input
						type="text"
						id="name"
						bind:value={name}
						required
						class="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 text-white transition placeholder:text-gray-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
						placeholder="Your name"
					/>
				</div>

				<button
					type="submit"
					disabled={nameLoading}
					class="font-outfit w-full rounded-2xl bg-indigo-600 px-4 py-3.5 font-bold text-white transition hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50"
				>
					{nameLoading ? 'Saving...' : 'Update Name'}
				</button>
			</form>
		</div>

		<!-- Change Password -->
		<div class="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl">
			<h2 class="font-outfit mb-6 text-xl font-semibold text-white">Security</h2>

			{#if passwordError}
				<div
					class="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
				>
					{passwordError}
				</div>
			{/if}

			{#if passwordSuccess}
				<div
					class="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400"
				>
					{passwordSuccess}
				</div>
			{/if}

			<form onsubmit={handleChangePassword} class="space-y-5">
				<div>
					<label
						for="current-password"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
						>Current Password</label
					>
					<input
						type="password"
						id="current-password"
						bind:value={currentPassword}
						required
						class="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 text-white transition placeholder:text-gray-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
						placeholder="••••••••"
					/>
				</div>

				<div>
					<label
						for="new-password"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
						>New Password</label
					>
					<input
						type="password"
						id="new-password"
						bind:value={newPassword}
						required
						class="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 text-white transition placeholder:text-gray-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
						placeholder="••••••••"
					/>
				</div>

				<div>
					<label
						for="confirm-password"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
						>Confirm New Password</label
					>
					<input
						type="password"
						id="confirm-password"
						bind:value={confirmPassword}
						required
						class="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 text-white transition placeholder:text-gray-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
						placeholder="••••••••"
					/>
				</div>

				<button
					type="submit"
					disabled={passwordLoading}
					class="font-outfit w-full rounded-2xl bg-white/10 px-4 py-3.5 font-bold text-white transition hover:bg-white/20 active:scale-[0.98] disabled:opacity-50"
				>
					{passwordLoading ? 'Updating...' : 'Change Password'}
				</button>
			</form>
		</div>
	</div>

	<!-- Past Events Section -->
	{#if pastEvents.length > 0}
		<div class="mt-12">
			<h2 class="font-outfit mb-6 text-2xl font-bold tracking-tight text-white">Past Events</h2>
			<div class="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl">
				<table class="w-full text-left text-sm text-gray-400">
					<thead class="border-b border-white/10 bg-white/5 text-xs text-gray-500 uppercase">
						<tr>
							<th class="px-6 py-4 font-medium">Event</th>
							<th class="px-6 py-4 font-medium">Date</th>
							<th class="px-6 py-4 font-medium">Location</th>
							<th class="px-6 py-4 font-medium">Duration</th>
							<th class="px-6 py-4 font-medium">Status</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/5">
						{#each pastEvents as ev}
							<tr class="transition hover:bg-white/5">
								<td class="px-6 py-4">
									<a href="/events/{ev.id}" class="font-medium text-white hover:text-indigo-300">
										{ev.title}
									</a>
								</td>
								<td class="px-6 py-4 text-gray-400">
									<LocalDate date={ev.date} />
								</td>
								<td class="px-6 py-4 text-gray-400">{ev.location}</td>
								<td class="px-6 py-4 text-gray-400">{ev.duration} mins</td>
								<td class="px-6 py-4">
									{#if ev.signupStatus === 'locked'}
										<span
											class="rounded-full border border-indigo-500/20 bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300"
										>
											Attended
										</span>
									{:else if ev.signupStatus === 'removed'}
										<span
											class="rounded-full border border-red-500/20 bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300"
										>
											Removed
										</span>
									{:else if ev.signupStatus === 'withdrawn'}
										<span
											class="rounded-full border border-gray-500/20 bg-gray-500/20 px-3 py-1 text-xs font-semibold text-gray-400"
										>
											Withdrawn
										</span>
									{:else if ev.signupStatus === 'listed'}
										<span
											class="rounded-full border border-emerald-500/20 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300"
										>
											Attended
										</span>
									{:else}
										<span
											class="rounded-full border border-yellow-500/20 bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-300"
										>
											Waitlisted
										</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
