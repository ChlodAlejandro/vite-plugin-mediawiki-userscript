<template>
	<div id="codex-test-app">
		<h1>Welcome to Codex</h1>
		<p>
			This component will continue to load on all pages; check
			<code>main.ts</code>
			to stop this from happening.
		</p>
		<CdxButton
			action="progressive"
			weight="primary"
			@click="counter++">
			<!-- Click me! Count: {{ counter }} -->
			{{ $i18n( "testscript-clickme", counter ) }}
		</CdxButton>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CdxButton } from '@wikimedia/codex';

const counter = ref( 0 );
</script>

<style scoped>
#codex-test-app {
    margin: 64px;
}
</style>
