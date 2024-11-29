<script lang="ts">
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { browser } from '$app/environment';
	import * as Alert from '$lib/components/ui/alert';
	import Button from '$lib/components/ui/button/button.svelte';
	import { fade } from 'svelte/transition';

	let { notebookId } = $props();

	let error = $state();
    let unsavedChanges = $state(false);
	let submitting = $state(false);
	let savedVisible = $state(false);
	let content = $state();

	let downloadPath = `/content/${notebookId}.txt`;
	let downloadUrl = `https://notebook.datalisk.com${downloadPath}`;

	async function load() {
		const response = await fetch(downloadPath);
		if (response.ok) {
			content = await response.text();
            unsavedChanges = false;
		}
	}

	async function submit() {
		submitting = true;
		try {
			const response = await fetch(`/api/content/${notebookId}`, {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					content
				})
			});

			if (!response.ok) throw new Error(`Server responsed with ${response.statusText} (${response.status})`);
            unsavedChanges = false;
		} finally {
			submitting = false;
		}

		savedVisible = true;
		setTimeout(() => {
			savedVisible = false;
		}, 2000);
	}

	if (browser) load();

	let form: HTMLFormElement;
</script>

<div class="w-full">
	{#if error}
		<Alert.Root variant="destructive" class="my-6">
			<Alert.Title>Failed</Alert.Title>
			<Alert.Description>{error}</Alert.Description>
		</Alert.Root>
	{/if}

	<form
		bind:this={form}
		onsubmitcapture={() =>
			submit().catch((err) => {
				error = err;
			})}
		class="comp-form"
	>
		<div class="my-6 flex w-full flex-col">
			<textarea
				bind:value={content}
                onchange={() => unsavedChanges = true}
                onkeypress={() => unsavedChanges = true}
				required
				class="h-96 w-full appearance-none rounded border border-solid border-blue-900 p-2 leading-tight shadow"
				placeholder="Insert your content here"
			></textarea>

			<div class="mt-8 flex flex-row items-center gap-4">
				<Button class="w-24" onclick={() => form.requestSubmit()} disabled={!unsavedChanges || submitting}>
                    {#if submitting}
                    <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
                    {:else}
                    Save
                    {/if}
                </Button>
				{#if savedVisible}
					<p in:fade={{ duration: 200 }} out:fade={{ duration: 1000 }}>Saved</p>
				{/if}
			</div>
		</div>
	</form>

	<div class="prose">
		<p>Direct download from <a href={downloadUrl}>{downloadUrl}</a></p>
	</div>
</div>

<style lang="postcss">
	textarea:focus {
		@apply border-blue-600 outline-none;
	}
</style>
