<script lang="ts">
	import { enhance } from '$app/forms';

	let loading = $state(false);
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

		<div class="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 shadow-2xl backdrop-blur-xl">
			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						update();
					};
				}}
				class="space-y-5"
			>
				<div>
					<label for="title" class="mb-1.5 block text-sm font-medium text-gray-300"
						>Event Title</label
					>
					<input
						type="text"
						id="title"
						name="title"
						required
						class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
						placeholder="e.g. Saturday Morning Badminton"
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="date" class="mb-1.5 block text-sm font-medium text-gray-300"
							>Date & Time</label
						>
						<input
							type="datetime-local"
							id="date"
							name="date"
							required
							class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
						/>
					</div>
					<div>
						<label for="duration" class="mb-1.5 block text-sm font-medium text-gray-300"
							>Duration (minutes)</label
						>
						<input
							type="number"
							id="duration"
							name="duration"
							required
							min="30"
							step="15"
							value="120"
							class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
						/>
					</div>
				</div>

				<div>
					<label for="location" class="mb-1.5 block text-sm font-medium text-gray-300"
						>Location</label
					>
					<input
						type="text"
						id="location"
						name="location"
						required
						class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
						placeholder="e.g. Sports Hall A"
					/>
				</div>

				<div>
					<label for="description" class="mb-1.5 block text-sm font-medium text-gray-300"
						>Description</label
					>
					<textarea
						id="description"
						name="description"
						required
						rows="3"
						class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
						placeholder="Provide extra details..."
					></textarea>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="capacity" class="mb-1.5 block text-sm font-medium text-gray-300"
							>Player Capacity</label
						>
						<input
							type="number"
							id="capacity"
							name="capacity"
							required
							min="2"
							value="10"
							class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
						/>
					</div>
					<div>
						<label for="cost" class="mb-1.5 block text-sm font-medium text-gray-300"
							>Cost (in dollars)</label
						>
						<input
							type="number"
							id="cost"
							name="cost"
							required
							min="0"
							step="0.5"
							value="15"
							class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
						/>
					</div>
				</div>

				<div>
					<label for="deadline" class="mb-1.5 block text-sm font-medium text-gray-300"
						>Withdrawal Deadline</label
					>
					<input
						type="datetime-local"
						id="deadline"
						name="deadline"
						required
						class="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none disabled:opacity-50"
				>
					{loading ? 'Creating...' : 'Create Event'}
				</button>
			</form>
		</div>
	</div>
</div>
