<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import LocalDate from '$lib/components/LocalDate.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let user = $derived(data.user);
	let pastEvents = $derived(data.pastEvents);

	// Form state - intentionally initialized once with user data
	// These are controlled inputs for the form, not reactive displays
	let name = $state('');
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let email = $state('');

	let adminDeadlineDays = $state(2);
	let adminDeadlineTime = $state('17:00');

	// Sync form state when user data loads
	$effect(() => {
		if (data.user) {
			name = data.user.name ?? '';
			email = data.user.email ?? '';
			adminDeadlineDays = data.user.adminDeadlineDays ?? 2;
			adminDeadlineTime = data.user.adminDeadlineTime ?? '17:00';
		}
	});

	let nameLoading = $state(false);
	let nameError = $state('');
	let nameSuccess = $state('');

	let passwordLoading = $state(false);
	let passwordError = $state('');
	let passwordSuccess = $state('');

	let emailLoading = $state(false);
	let emailError = $state('');
	let emailSuccess = $state('');

	let adminLoading = $state(false);
	let adminError = $state('');
	let adminSuccess = $state('');

	let plusOneName = $state('');
	let plusOneEmail = $state('');
	let plusOnePassword = $state('');
	let inviteLoading = $state(false);
	let inviteError = $state('');
	let inviteSuccess = $state('');

	// Handle form action results
	$effect(() => {
		if (form?.success && form?.message) {
			emailSuccess = form.message;
			emailError = '';
			email = data.user?.email || '';
		} else if (form?.error) {
			emailError = form.error;
			emailSuccess = '';
		} else if (form?.adminSettingsSuccess && form?.message) {
			adminSuccess = form.message;
			adminError = '';
		}
	});
	const handleUpdateName = async (e: Event) => {
		e.preventDefault();
		nameLoading = true;
		nameError = '';
		nameSuccess = '';
		try {
			const { error } = await authClient.updateUser({
				name: name.trim()
			});

			if (error) {
				nameError = error.message ?? 'Failed to update name.';
			} else {
				nameSuccess = 'Name updated successfully.';
				await invalidateAll();
			}
		} catch {
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
		} catch {
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

			<!-- Account Type Badge -->
			<div
				class="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
			>
				<div>
					<p class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Account Type</p>
					<p class="mt-1 text-sm text-gray-400">Determines your event pricing</p>
				</div>
				<span
					class="inline-flex rounded-full px-3 py-1 text-sm font-semibold {user?.accountType ===
					'company'
						? 'border border-blue-500/30 bg-blue-500/20 text-blue-400'
						: 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400'}"
				>
					{user?.accountType === 'company' ? 'Company' : 'PlusOne'}
				</span>
			</div>

			{#if nameError}
				<div
					class="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
				>
					{nameError}
				</div>
			{/if}

			{#if nameSuccess}
				<div
					class="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400"
				>
					{nameSuccess}
				</div>
			{/if}

			<form onsubmit={handleUpdateName} class="mb-6 space-y-5">
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

			<!-- Email Update Section -->
			<hr class="border-white/10" />
			<div class="mt-6">
				<h3 class="mb-4 text-lg font-semibold text-white">Change Email</h3>

				{#if emailError}
					<div
						class="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
					>
						{emailError}
					</div>
				{/if}

				{#if emailSuccess}
					<div
						class="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400"
					>
						{emailSuccess}
					</div>
				{/if}

				<form
					method="POST"
					action="?/updateEmail"
					use:enhance={() => {
						emailLoading = true;
						return async ({ update }) => {
							emailLoading = false;
							update();
						};
					}}
					class="space-y-4"
				>
					<div>
						<label
							for="email"
							class="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
							>New Email Address</label
						>
						<input
							type="email"
							id="email"
							name="email"
							bind:value={email}
							required
							class="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 text-white transition placeholder:text-gray-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
							placeholder="new@example.com"
						/>
					</div>

					<p class="text-xs text-gray-500">
						Changing your email will automatically update your account type if the new email domain
						matches a company domain.
					</p>

					<button
						type="submit"
						disabled={emailLoading}
						class="font-outfit w-full rounded-2xl bg-white/10 px-4 py-3.5 font-bold text-white transition hover:bg-white/20 active:scale-[0.98] disabled:opacity-50"
					>
						{emailLoading ? 'Updating...' : 'Update Email'}
					</button>
				</form>
			</div>
		</div>

		<!-- Account Info & Security -->
		<div class="space-y-8">
			<!-- Shortcode Display -->
			<div class="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl">
				<h2 class="font-outfit mb-4 text-xl font-semibold text-white">Your Code</h2>
				<p class="mb-4 text-sm text-gray-400">
					Put this code in the reference of your bank payment.
				</p>
				<div class="rounded-2xl border border-white/10 bg-black/20 px-6 py-4 text-center">
					<span class="font-mono text-3xl font-bold tracking-widest text-indigo-400">
						{user?.shortCode || '------'}
					</span>
				</div>
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
	</div>

	<!-- Invited Plus-Ones Section -->
	{#if user?.accountType === 'company' || user?.role === 'admin'}
		<div
			class="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl"
		>
			<div
				class="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center"
			>
				<div>
					<h2 class="font-outfit text-2xl font-bold text-white">Guest / Plus-One Invites</h2>
					<p class="mt-1 text-sm text-gray-400">
						Invite and manage guest accounts linked to your billing.
					</p>
				</div>
				<div
					class="flex items-center gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-indigo-300"
				>
					<span class="text-sm font-semibold">Invites Used:</span>
					<span class="font-mono text-lg font-bold">
						{user?.role === 'admin' ? '∞' : `${data.invitedCount} / ${user?.allowedPlusOnes}`}
					</span>
				</div>
			</div>

			<div class="grid gap-8 lg:grid-cols-2">
				<!-- List of Plus-Ones -->
				<div class="space-y-4">
					<h3 class="font-outfit text-lg font-semibold text-white">Your Invited Plus-Ones</h3>

					{#if data.invitedPlusOnes.length === 0}
						<div
							class="rounded-2xl border border-dashed border-white/10 p-8 text-center text-gray-500"
						>
							<p>You haven't invited any plus-ones yet.</p>
							<p class="mt-1 text-xs">Fill out the form to create a plus-one account.</p>
						</div>
					{:else}
						<div class="space-y-3">
							{#each data.invitedPlusOnes as guest (guest.id)}
								<div
									class="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition hover:border-white/10 hover:bg-white/10"
								>
									<div>
										<h4 class="font-semibold text-white">{guest.name}</h4>
										<p class="text-xs text-gray-400">{guest.email}</p>
										<p class="mt-1 text-[10px] text-gray-500">
											Joined <LocalDate date={guest.createdAt} />
										</p>
									</div>
									<div class="text-right">
										<p class="text-xs text-gray-400">Balance</p>
										<p
											class="text-sm font-bold {guest.balance < 0
												? 'text-rose-400'
												: 'text-emerald-400'}"
										>
											${(guest.balance / 100).toFixed(2)}
										</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Invite Form -->
				<div>
					<h3 class="font-outfit mb-4 text-lg font-semibold text-white">Invite a New Guest</h3>

					{#if user?.role !== 'admin' && data.invitedCount >= (user?.allowedPlusOnes ?? 1)}
						<div
							class="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6 text-sm text-yellow-400"
						>
							<h4 class="mb-1 font-semibold">Invite Limit Reached</h4>
							<p>
								You have used all of your allowed guest invitations. If you need to add more guests,
								please contact an administrator to request a higher limit.
							</p>
						</div>
					{:else}
						{#if inviteError}
							<div
								class="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400"
							>
								{inviteError}
							</div>
						{/if}

						{#if inviteSuccess}
							<div
								class="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400"
							>
								{inviteSuccess}
							</div>
						{/if}

						<form
							method="POST"
							action="?/invitePlusOne"
							use:enhance={() => {
								inviteLoading = true;
								inviteError = '';
								inviteSuccess = '';
								return async ({ result, update }) => {
									inviteLoading = false;
									if (result.type === 'failure' && result.data) {
										const data = result.data as { error?: string; message?: string };
										if (data.error) inviteError = data.error;
									} else if (result.type === 'success' && result.data) {
										const data = result.data as { error?: string; message?: string };
										if (data.message) {
											inviteSuccess = data.message;
											plusOneName = '';
											plusOneEmail = '';
											plusOnePassword = '';
											await invalidateAll();
										}
									}
									update();
								};
							}}
							class="space-y-4"
						>
							<div>
								<label
									for="invite-name"
									class="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
									>Guest's Name</label
								>
								<input
									type="text"
									id="invite-name"
									name="name"
									bind:value={plusOneName}
									required
									placeholder="e.g. John Doe"
									class="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 text-white transition placeholder:text-gray-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
								/>
							</div>

							<div>
								<label
									for="invite-email"
									class="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
									>Guest's Email</label
								>
								<input
									type="email"
									id="invite-email"
									name="email"
									bind:value={plusOneEmail}
									required
									placeholder="e.g. guest@example.com"
									class="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 text-white transition placeholder:text-gray-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
								/>
							</div>

							<div>
								<label
									for="invite-password"
									class="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
									>Set Password</label
								>
								<input
									type="password"
									id="invite-password"
									name="password"
									bind:value={plusOnePassword}
									required
									placeholder="At least 8 characters"
									class="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 text-white transition placeholder:text-gray-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
								/>
							</div>

							<button
								type="submit"
								disabled={inviteLoading}
								class="font-outfit w-full rounded-2xl bg-indigo-600 px-4 py-3.5 font-bold text-white transition hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50"
							>
								{inviteLoading ? 'Creating Guest...' : 'Create & Invite Guest'}
							</button>
						</form>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Admin Preferences Section -->
	{#if user?.role === 'admin'}
		<div
			class="mt-8 rounded-3xl border border-indigo-500/30 bg-indigo-900/10 p-8 shadow-2xl backdrop-blur-2xl"
		>
			<h2 class="font-outfit mb-2 text-xl font-semibold text-white">Admin Preferences</h2>
			<p class="mb-6 text-sm text-gray-400">
				Settings that apply when you create or manage events.
			</p>

			{#if adminError}
				<div
					class="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
				>
					{adminError}
				</div>
			{/if}

			{#if adminSuccess}
				<div
					class="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400"
				>
					{adminSuccess}
				</div>
			{/if}

			<form
				method="POST"
				action="?/updateAdminSettings"
				use:enhance={() => {
					adminLoading = true;
					adminError = '';
					adminSuccess = '';
					return async ({ update, result }) => {
						adminLoading = false;
						if (result.type === 'failure' && result.data) {
							const data = result.data as { error?: string };
							if (data.error) adminError = data.error;
						}
						update();
					};
				}}
				class="grid gap-6 md:grid-cols-2"
			>
				<div>
					<label
						for="adminDeadlineDays"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
						>Autoset Deadline (Days Before Event)</label
					>
					<input
						type="number"
						id="adminDeadlineDays"
						name="adminDeadlineDays"
						bind:value={adminDeadlineDays}
						required
						class="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 text-white transition focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
					/>
				</div>

				<div>
					<label
						for="adminDeadlineTime"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
						>Autoset Deadline Time</label
					>
					<input
						type="time"
						id="adminDeadlineTime"
						name="adminDeadlineTime"
						bind:value={adminDeadlineTime}
						required
						class="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 text-white transition focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
					/>
				</div>

				<div class="md:col-span-2">
					<button
						type="submit"
						disabled={adminLoading}
						class="font-outfit w-full rounded-2xl bg-indigo-600 px-4 py-3.5 font-bold text-white transition hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50"
					>
						{adminLoading ? 'Saving...' : 'Save Preferences'}
					</button>
				</div>
			</form>
		</div>
	{/if}

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
						{#each pastEvents as ev (ev.id)}
							<tr class="transition hover:bg-white/5">
								<td class="px-6 py-4">
									<a
										href={resolve(`/events/${ev.id}`)}
										class="font-medium text-white hover:text-indigo-300"
									>
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
