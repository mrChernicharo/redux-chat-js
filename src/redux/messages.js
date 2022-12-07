import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { PAGE_SIZE } from "../main";
import db from "../supabase";

const initialState = {
	status: "idle",
};

export const fetchMessages = createAsyncThunk(
	"messages/fetchMessages",
	async ({ chatId }, { getState }) => {
		// fetch 11 messages, pop 11th to check hasMore, return 10 messages
		const response = await db
			.from("messages")
			.select("*, author:users(*), reactions(id, user_id, reaction)")
			.eq("chat_id", chatId)
			.order("timestamp", { ascending: false })
			.range(0, 10);

		const data = response.data ?? [];
		const hasMore = !!data.pop();

		// const messagesSlice = getState().messages;
		// console.log({ offset, chatId, hasMore, messagesSlice }, messages);

		return { data, hasMore, chatId };
	}
);

export const fetchMoreMessages = createAsyncThunk(
	"messages/fetchMoreMessages",
	async ({ chatId }, { getState }) => {
		// const offset = getState().messages[chatId]?.offset ?? 10;
		// const response = await db
		// 	.from("messages")
		// 	.select("*, author:users(*), reactions(id, user_id, reaction)")
		// 	.eq("chat_id", chatId)
		// 	.order("timestamp", { ascending: false })
		// 	.range(offset - 10, offset);
		// const messages = response.data ?? [];
		// const hasMore = !!messages.pop();
		// const messagesSlice = getState().messages;
		// console.log({ offset, chatId, hasMore, messagesSlice }, messages);
		// return { data: messages, hasMore, chatId, offset };
	}
);

const messagesSlice = createSlice({
	name: "messages",
	initialState,
	reducers: {},
	extraReducers: builder => {
		builder
			.addCase(fetchMessages.pending, (state, action) => {
				state.status = "loading";
			})
			.addCase(fetchMessages.fulfilled, (state, { payload }) => {
				const { data, hasMore, chatId } = payload;

				console.log(payload);
				// create queue

				if (!state[chatId]) {
					console.log("a new message queue");
					state[chatId] = {
						id: chatId,
						messages: data,
						hasMore,
						offset: 10,
					};
				}
				// else {
				// 	console.log("an existing queue");
				// 	state[chatId] = {
				// 		messages: [...state[chatId].messages, ...data],
				// 		hasMore,
				// 		offset: offset + 10,
				// 	};
				// }

				state.status = "idle";
			});
	},
});

export const { registerChatQueue, unregisterChatQueue, clearAllChats } =
	messagesSlice.actions;

export default messagesSlice.reducer;
