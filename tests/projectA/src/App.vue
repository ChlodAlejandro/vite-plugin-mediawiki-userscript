<template>
	<div id="codex-test-app">
		<h1>Welcome to Codex</h1>
		<p>
			This component will continue to load on all pages; check <code>main.ts</code>
			to stop this from happening.
		</p>
		<p>
			Test
		</p>
		<cdx-button action="progressive" weight="primary">
			Click me!
		</cdx-button>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { CdxButton } from '@wikimedia/codex';

export default defineComponent( {
	components: { CdxButton }
} );

</script>

<style scoped>
#codex-test-app {
  margin: 64px;
}
</style>
