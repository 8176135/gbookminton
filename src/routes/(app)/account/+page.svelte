<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';

	interface Props {
		data: { user: any };
	}

	let { data }: Props = $props();
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
</div>
