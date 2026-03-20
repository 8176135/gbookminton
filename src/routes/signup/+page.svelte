<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto, invalidateAll } from '$app/navigation';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMsg = $state('');

	const handleSignup = async (e: Event) => {
		e.preventDefault();
		loading = true;
		errorMsg = '';
		try {
			const { data, error } = await authClient.signUp.email({
				email,
				password,
				name
			});

			if (error) {
				errorMsg = error.message ?? 'An unknown error occurred.';
			} else {
				// successful signup
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
	<title>Sign Up - Gookminton</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center p-4">
	<div
		class="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl"
	>
		<div class="mb-8 flex flex-col items-center">
			<div
				class="font-outfit mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white shadow-xl shadow-indigo-600/30"
			>
				G
			</div>
			<h1 class="font-outfit text-4xl font-bold tracking-tight text-white">Join Gookminton</h1>
			<p class="mt-2 text-sm text-gray-400">Manage your badminton & pickleball bookings.</p>
		</div>

		{#if errorMsg}
			<div
				class="mb-6 animate-pulse rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
			>
				{errorMsg}
			</div>
		{/if}

		<form onsubmit={handleSignup} class="space-y-5">
			<div>
				<label
					for="name"
					class="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
					>Full Name</label
				>
				<input
					type="text"
					id="name"
					bind:value={name}
					required
					class="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 text-white transition placeholder:text-gray-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
					placeholder="John Doe"
				/>
			</div>

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
				<label
					for="password"
					class="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
					>Password</label
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

			<button
				type="submit"
				disabled={loading}
				class="font-outfit w-full rounded-2xl bg-indigo-600 px-4 py-4 text-lg font-bold text-white transition hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50"
			>
				{loading ? 'Creating Account...' : 'Get Started'}
			</button>
		</form>

		<p class="mt-8 text-center text-sm text-gray-500">
			Already have an account?
			<a href="/login" class="font-semibold text-indigo-400 transition hover:text-indigo-300"
				>Sign in</a
			>
		</p>
	</div>
</div>
