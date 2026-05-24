<script lang="ts">
	import { authClient } from '$lib/auth-client';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMsg = $state('');
	let signupSuccess = $state(false);

	const handleSignup = async (e: Event) => {
		e.preventDefault();
		loading = true;
		errorMsg = '';
		try {
			const { error } = await authClient.signUp.email({
				email: email.trim(),
				password,
				name: name.trim(),
				callbackURL: '/login?verified=true'
			});

			if (error) {
				errorMsg = error.message ?? 'An unknown error occurred.';
			} else {
				// successful signup
				signupSuccess = true;
			}
		} catch (err) {
			errorMsg = 'An unexpected error occurred.';
		} finally {
			loading = false;
		}
	};
</script>

<svelte:head>
	<title>Sign Up - Gbookminton</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center p-4">
	<div
		class="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl"
	>
		{#if signupSuccess}
			<div class="flex flex-col items-center text-center animate-fade-in">
				<div class="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-8 w-8 animate-bounce-slow">
						<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
					</svg>
				</div>
				<h1 class="font-outfit text-3xl font-bold tracking-tight text-white mb-2">Check your email</h1>
				<p class="text-sm text-gray-400 font-medium">Account registration was successful.</p>
				
				<div class="my-6 w-full border-t border-white/10"></div>
				
				<p class="text-gray-300 text-sm leading-relaxed mb-8">
					We've sent a verification link to:<br/>
					<span class="font-semibold text-indigo-400 break-all">{email.trim()}</span><br/><br/>
					Please check your inbox (and spam folder) and click the link to activate your account.
				</p>
				
				<div class="w-full">
					<a
						href="/login"
						class="font-outfit block w-full rounded-2xl bg-indigo-600 px-4 py-3.5 text-center text-sm font-bold text-white transition hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98]"
					>
						Back to Login
					</a>
				</div>
			</div>
		{:else}
			<div class="mb-8 flex flex-col items-center">
				<div
					class="font-outfit mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white shadow-xl shadow-indigo-600/30"
				>
					G
				</div>
				<h1 class="font-outfit text-4xl font-bold tracking-tight text-white">Join Gbookminton</h1>
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
						placeholder="you@company.com"
					/>
					<p class="mt-1.5 text-xs text-gray-500">
						Only company email domains are accepted. Plus-one accounts must be invited.
					</p>
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
		{/if}
	</div>
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.96) translateY(4px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@keyframes bounceSlow {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4px);
		}
	}

	.animate-fade-in {
		animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.animate-bounce-slow {
		animation: bounceSlow 3s ease-in-out infinite;
	}
</style>
