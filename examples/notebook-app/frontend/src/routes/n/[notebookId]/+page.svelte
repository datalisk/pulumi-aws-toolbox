<script lang="ts">
	import { page } from '$app/stores';
	import Notebook from './Notebook.svelte';

	const notebookId = $page.params.notebookId;
</script>

<svelte:head>
	<title>Notebook {notebookId}</title>
</svelte:head>

<section>
	<div class="prose">
		<h1>Notebook {notebookId}</h1>
	</div>
    <Notebook {notebookId} />
</section>
