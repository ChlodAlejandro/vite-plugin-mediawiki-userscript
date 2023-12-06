import { createApp } from 'vue';
import App from './App.vue';

if ( !document.getElementById( 'app' ) ) {
	const appMount = document.createElement( 'div' );
	appMount.setAttribute( 'id', 'app' );
	document.querySelector( '#mw-content-text' )
		?.insertAdjacentElement( 'beforebegin', appMount );
}

createApp( App ).mount( '#app' );
