<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';

	async function create() {
		const id = generateRandomID();
		goto(`/n/${id}`);
	}

	function generateRandomID() {
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let id = '';
		for (let i = 0; i < 6; i++) {
			const randomIndex = Math.floor(Math.random() * characters.length);
			id += characters[randomIndex];
		}
		return id;
	}
</script>

<svelte:head>
	<title>Notebook</title>
	<meta name="description" content="A open-source and serverless pastebin alternative." />
</svelte:head>

<section>
	<div class="prose">
		<h1>Notebook App</h1>
		<p>
			A open-source and serverless pastebin alternative.<br />
			It's a demonstration app for
			<a href="https://github.com/datalisk/pulumi-aws-toolbox">pulumi-aws-toolbox</a>.
		</p>

        <div class="mt-8">
            <Button onclick={create}>Create new notebook</Button>
        </div>
	</div>
</section>

<style lang="postcss">
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}
</style>
