/// <reference types="@sveltejs/kit" />

declare namespace App {
	interface Locals {}
	interface Platform {}
	interface Session {}
	interface Stuff {}
}

declare module '$env/static/private' {
	export const COCKROACH_DB_URL: string;
}
