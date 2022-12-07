import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/dist/query";
import appState from "./app-state";
import { chatsApi } from "./chats";
// import { messagesApi } from "./messages";
import { usersApi } from "./users";

export const store = configureStore({
	reducer: {
		appState,
		[usersApi.reducerPath]: usersApi.reducer,
		[chatsApi.reducerPath]: chatsApi.reducer,
		// [messagesApi.reducerPath]: messagesApi.reducer,
	},
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware().concat(
			usersApi.middleware,
			chatsApi.middleware
			// messagesApi.middleware
		),
});

setupListeners(store.dispatch);
