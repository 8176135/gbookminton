<script lang="ts">
	import { enhance } from '$app/forms';
	import EventForm from '$lib/components/EventForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Create Event - Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 p-6 text-white">
	<div class="mx-auto max-w-2xl">
		<header class="mb-8">
			<a href="/admin" class="mb-2 inline-block text-sm text-indigo-400 hover:text-indigo-300"
				>← Back to Dashboard</a
			>
			<h1 class="text-3xl font-bold tracking-tight text-white">Create New Event</h1>
		</header>

		<EventForm mode="create" form={form ?? undefined} adminSettings={data.adminSettings} />
	</div>
</div>
