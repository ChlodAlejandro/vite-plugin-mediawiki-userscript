import { createMwApp } from 'vue';
import App from './App.vue';

mw.messages.set( {
	'testscript-clickme': 'Click me! Count: $1'
} );

if ( !document.getElementById( 'app' ) ) {
	const appMount = document.createElement( 'div' );
	appMount.setAttribute( 'id', 'app' );
	document
		.querySelector( '#mw-content-text' )
		?.insertAdjacentElement( 'beforebegin', appMount );
}

createMwApp( App ).mount( '#app' );
