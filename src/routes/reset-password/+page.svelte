<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	interface Props {
		data: { token: string };
	}

	let { data }: Props = $props();
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let errorMsg = $state('');
	let successMsg = $state('');

	const handleResetPassword = async (e: Event) => {
		e.preventDefault();
		if (password !== confirmPassword) {
			errorMsg = 'Passwords do not match.';
			return;
		}

		loading = true;
		errorMsg = '';
		successMsg = '';
		try {
			const { error } = await authClient.resetPassword({
				newPassword: password,
				token: data.token
			});

			if (error) {
				errorMsg = error.message ?? 'An unknown error occurred.';
			} else {
				successMsg = 'Your password has been reset successfully. Redirecting to login...';
				setTimeout(() => goto('/login'), 2000);
			}
		} catch (err) {
			errorMsg = 'An unexpected error occurred.';
		} finally {
			loading = false;
		}
	};
</script>

<svelte:head>
	<title>Reset Password - Gbookminton</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center p-4">
	<div
		class="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl"
	>
		<div class="mb-8 flex flex-col items-center text-center">
			<div
				class="font-outfit mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white shadow-xl shadow-indigo-600/30"
			>
				G
			</div>
			<h1 class="font-outfit text-3xl font-bold tracking-tight text-white">Create New Password</h1>
			<p class="mt-2 text-sm text-gray-400">Choose a strong password for your account.</p>
		</div>

		{#if errorMsg}
			<div
				class="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400"
			>
				{errorMsg}
			</div>
		{/if}

		{#if successMsg}
			<div
				class="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center text-sm text-emerald-400"
			>
				{successMsg}
			</div>
		{:else}
			<form onsubmit={handleResetPassword} class="space-y-5">
				<div>
					<label
						for="password"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
						>New Password</label
					>
					<input
						type="password"
						id="password"
						bind:value={password}
						required
						class="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 text-white transition placeholder:text-gray-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
						placeholder="••••••••"
					/>
				</div>

				<div>
					<label
						for="confirmPassword"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
						>Confirm New Password</label
					>
					<input
						type="password"
						id="confirmPassword"
						bind:value={confirmPassword}
						required
						class="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 text-white transition placeholder:text-gray-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
						placeholder="••••••••"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="font-outfit w-full rounded-2xl bg-indigo-600 px-4 py-4 text-lg font-bold text-white transition hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50"
				>
					{loading ? 'Resetting...' : 'Reset Password'}
				</button>
			</form>
		{/if}
	</div>
</div>
