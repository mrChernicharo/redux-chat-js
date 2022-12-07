import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import db from "../supabase";

const initialState = {
	status: "idle",
};

// prettier-ignore
export const fetchMessages = createAsyncThunk("messages/fetchMessages", async ({ chatId, offset }) => {
  const response = await db
		.from("messages")
		.select("*, author:users(*), reactions(id, user_id, reaction)")
		.eq("chat_id", chatId)
		.order("timestamp", { ascending: false });
	// .range(0, offset! + PAGE_SIZE - 1);

	const messages = response.data ?? [];
	console.log({ offset, chatId }, messages);

	return { data: messages };
});

const messagesSlice = createSlice({
	name: "messages",
	initialState,
	reducers: {
		registerChatQueue: (state, { payload }) => {
			const { chatId } = payload;
			state[chatId] = [];
		},
		unregisterChatQueue: (state, { payload }) => {
			const { chatId } = payload;
			delete state.chatId;
		},
		clearAllChats: state => {
			state = {};
		},
		// getMessages: (state, { payload }) => {
		// 	const { userId, chatId } = payload;
		// },
	},
	extraReducers: builder => {
		builder
			.addCase(fetchMessages.pending, (state, action) => {
				state.status = "loading";
			})
			.addCase(fetchMessages.fulfilled, (state, { payload }) => {
				state.status = "idle";
				console.log(payload);
			});
	},
});

export const { registerChatQueue, unregisterChatQueue, clearAllChats } =
	messagesSlice.actions;

export default messagesSlice.reducer;
