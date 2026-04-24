<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let email = $state('');
	let loading = $state(false);
	let errorMsg = $state('');
	let successMsg = $state('');

	const handleForgotPassword = async (e: Event) => {
		e.preventDefault();
		loading = true;
		errorMsg = '';
		successMsg = '';
		try {
			const { data, error } = await authClient.requestPasswordReset({
				email: email.trim(),
				redirectTo: '/reset-password'
			});

			if (error) {
				errorMsg = error.message ?? 'An unknown error occurred.';
			} else {
				successMsg = 'If an account exists for that email, a password reset link has been sent.';
			}
		} catch (err) {
			errorMsg = 'An unexpected error occurred.';
		} finally {
			loading = false;
		}
	};
</script>

<svelte:head>
	<title>Forgot Password - Gbookminton</title>
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
			<h1 class="font-outfit text-3xl font-bold tracking-tight text-white">Reset Password</h1>
			<p class="mt-2 text-sm text-gray-400">
				Enter your email and we'll send you a link to reset your password.
			</p>
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
			<form onsubmit={handleForgotPassword} class="space-y-5">
				<div>
					<label
						for="email"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
						>Email Address</label
					>
					<input
						type="email"
						id="email"
						bind:value={email}
						required
						class="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 text-white transition placeholder:text-gray-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
						placeholder="you@example.com"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="font-outfit w-full rounded-2xl bg-indigo-600 px-4 py-4 text-lg font-bold text-white transition hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50"
				>
					{loading ? 'Sending...' : 'Send Reset Link'}
				</button>
			</form>
		{/if}

		<p class="mt-8 text-center text-sm text-gray-500">
			Remembered your password?
			<a href="/login" class="font-semibold text-indigo-400 transition hover:text-indigo-300"
				>Back to login</a
			>
		</p>
	</div>
</div>
