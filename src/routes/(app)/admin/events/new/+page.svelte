<script lang="ts">
	import EventForm from '$lib/components/EventForm.svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Create Event - Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 p-6 text-white">
	<div class="mx-auto max-w-2xl">
		<header class="mb-8">
			<a
				href={resolve('/admin')}
				class="mb-2 inline-block text-sm text-indigo-400 hover:text-indigo-300"
				>← Back to Dashboard</a
			>
			<h1 class="text-3xl font-bold tracking-tight text-white">Create New Event</h1>
		</header>

		<!-- Template Selection -->
		<div class="mb-6 rounded-2xl border border-gray-800 bg-gray-900/50 p-5 backdrop-blur-xl">
			<label for="template-select" class="mb-2 block text-sm font-medium text-gray-300">
				Use an existing event as a template
			</label>
			<select
				id="template-select"
				class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
				onchange={(e) => {
					const val = (e.target as HTMLSelectElement).value;
					if (val) {
						window.location.href = `/admin/events/new?templateId=${val}`;
					} else {
						window.location.href = `/admin/events/new`;
					}
				}}
			>
				<option value="">-- No template (start from scratch) --</option>
				{#each data.events as ev (ev.id)}
					<option value={ev.id} selected={data.templateEvent?.id === ev.id}>
						{ev.title} ({new Date(ev.date).toLocaleDateString(undefined, {
							month: 'short',
							day: 'numeric',
							year: 'numeric'
						})})
					</option>
				{/each}
			</select>
		</div>

		<EventForm
			mode="create"
			event={data.templateEvent ?? undefined}
			form={form ?? undefined}
			adminSettings={data.adminSettings}
		/>
	</div>
</div>
