<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMsg = $state('');

	const isVerified = $derived(page.url.searchParams.get('verified') === 'true');

	const handleLogin = async (e: Event) => {
		e.preventDefault();
		loading = true;
		errorMsg = '';
		try {
			const { error } = await authClient.signIn.email({
				email: email.trim(),
				password
			});

			if (error) {
				errorMsg = error.message ?? 'An unknown error occurred.';
			} else {
				// successful login
				await invalidateAll();
				goto('/dashboard');
			}
		} catch (err) {
			errorMsg = 'An unexpected error occurred.';
		} finally {
			loading = false;
		}
	};
</script>

<svelte:head>
	<title>Log In - Gbookminton</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center p-4">
	<div
		class="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl"
	>
		<div class="mb-8 flex flex-col items-center">
			<div
				class="font-outfit mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-center text-2xl font-bold text-white shadow-xl shadow-indigo-600/30"
			>
				G
			</div>
			<h1 class="font-outfit text-4xl font-bold tracking-tight text-white">Welcome Back</h1>
			<p class="mt-2 text-sm text-gray-400">Sign in to check your balance and bookings.</p>
		</div>

		{#if isVerified}
			<div
				class="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center text-sm text-emerald-400 animate-fade-in flex flex-col items-center gap-1.5"
			>
				<div class="flex items-center gap-2 font-semibold">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-5 w-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
					</svg>
					Email Verified!
				</div>
				<p class="text-xs text-emerald-400/80">Your email has been successfully verified. You can now log in below.</p>
			</div>
		{/if}

		{#if errorMsg}
			<div
				class="mb-6 animate-pulse rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400"
			>
				{errorMsg}
			</div>
		{/if}

		<form onsubmit={handleLogin} class="space-y-5">
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

			<div>
				<div class="mb-1.5 flex items-center justify-between">
					<label
						for="password"
						class="block text-xs font-semibold tracking-wider text-gray-500 uppercase"
						>Password</label
					>
					<a
						href="/forgot-password"
						tabindex="-1"
						class="text-xs font-medium text-indigo-400 hover:text-indigo-300">Forgot?</a
					>
				</div>
				<input
					type="password"
					id="password"
					bind:value={password}
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
				{loading ? 'Signing in...' : 'Log In'}
			</button>
		</form>

		<p class="mt-8 text-center text-sm text-gray-500">
			New to Gbookminton?
			<a href="/signup" class="font-semibold text-indigo-400 transition hover:text-indigo-300"
				>Create an account</a
			>
		</p>
	</div>
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.98) translateY(2px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.animate-fade-in {
		animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}
</style>
