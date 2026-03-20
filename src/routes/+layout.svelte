<script lang="ts">
	import '../app.css';
	import { authClient } from '$lib/auth-client';
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';

	interface Props {
		children: import('svelte').Snippet;
		data: any;
	}

	let { children, data }: Props = $props();
	let session = $derived(data?.session);

	const handleLogout = async () => {
		await authClient.signOut();
		await invalidateAll();
		goto('/login');
	};
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="relative min-h-screen bg-black font-sans text-white selection:bg-indigo-500/30">
	<!-- Ambient Background -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden">
		<div
			class="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-indigo-600/10 blur-[120px]"
		></div>
		<div
			class="absolute top-[40%] -right-[5%] h-[30%] w-[30%] rounded-full bg-emerald-600/5 blur-[100px]"
		></div>
		<div
			class="absolute -bottom-[5%] left-[20%] h-[25%] w-[25%] rounded-full bg-blue-600/10 blur-[100px]"
		></div>
	</div>

	<!-- Navigation -->
	{#if session}
		<nav class="sticky top-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center gap-8">
						<a href="/dashboard" class="flex items-center gap-2">
							<div
								class="font-outfit flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-600/20"
							>
								G
							</div>
							<span
								class="font-outfit bg-linear-to-r from-white to-gray-400 bg-clip-text text-xl font-bold tracking-tight text-transparent"
								>Gookminton</span
							>
						</a>

						<div class="hidden items-center gap-1 md:flex">
							<a
								href="/dashboard"
								class="rounded-lg px-4 py-2 text-sm font-medium transition {page.url.pathname.includes(
									'/dashboard'
								)
									? 'bg-white/5 text-white'
									: 'text-gray-400 hover:bg-white/5 hover:text-white'}"
							>
								Dashboard
							</a>
							{#if session.user.role === 'admin'}
								<a
									href="/admin"
									class="rounded-lg px-4 py-2 text-sm font-medium transition {page.url.pathname.includes(
										'/admin'
									)
										? 'bg-white/5 text-white'
										: 'text-gray-400 hover:bg-white/5 hover:text-white'}"
								>
									Admin
								</a>
							{/if}
						</div>
					</div>

					<div class="flex items-center gap-4">
						<div class="hidden flex-col items-end sm:flex">
							<span class="text-xs font-medium tracking-wider text-gray-500 uppercase">Account</span
							>
							<span class="text-sm font-semibold text-gray-200">{session.user.name}</span>
						</div>
						<button
							onclick={handleLogout}
							class="rounded-lg border border-white/5 px-4 py-2 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
						>
							Logout
						</button>
					</div>
				</div>
			</div>
		</nav>
	{/if}

	<main class="relative z-10">
		{@render children()}
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: black;
	}
	:global(.font-outfit) {
		font-family: 'Outfit', sans-serif;
	}
</style>
