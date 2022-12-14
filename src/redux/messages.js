import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { PAGE_SIZE } from "../main";
import db from "../supabase";

const initialState = {
	status: "idle",
	isFetching: false,
};

async function getDBMessages({ chatId, offsetStart, offsetEnd }) {
	// fetch 11 messages, pop 11th to check hasMore, return 10 messages
	const response = await db
		.from("messages")
		.select("*, author:users(*), reactions(id, user_id, reaction)")
		.eq("chat_id", chatId)
		.order("timestamp", { ascending: false })
		.range(offsetStart, offsetEnd);

	const data = response.data ?? [];
	const hasMore = data.pop() && data.length === 10;

	return { data, hasMore, chatId };
}

export const fetchMessages = createAsyncThunk(
	"messages/fetchMessages",
	async ({ chatId }, { getState }) => {
		return await getDBMessages({
			chatId,
			offsetStart: 0,
			offsetEnd: 10,
		});
	}
);

export const fetchMoreMessages = createAsyncThunk(
	"messages/fetchMoreMessages",
	async ({ chatId }, { getState }) => {
		const offset = getState().messages[chatId].offset;

		return await getDBMessages({
			chatId,
			offsetStart: offset,
			offsetEnd: offset + 10,
		});
	}
);

export const postMessage = createAsyncThunk(
	"messages/postMessage",
	async ({ user, chatId, body }, { getState }) => {
		const response = await db
			.from("messages")
			.insert({
				user_id: user.id,
				chat_id: chatId,
				body,
			})
			.select("*");

		const message = response?.data[0] || [];
		console.log({ user, chatId, message });

		return { user, chatId, message };
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
				state.isFetching = true;
			})
			.addCase(fetchMessages.fulfilled, (state, { payload }) => {
				const { data, hasMore, chatId } = payload;
				console.log("fetchMessages.fulfilled", payload);

				if (!state[chatId]) {
					// create new message queue
					state[chatId] = {
						id: chatId,
						messages: data,
						hasMore,
						offset: 10,
					};
				}

				state.status = "idle";
				state.isFetching = false;
			})
			.addCase(fetchMoreMessages.pending, (state, action) => {
				state.isFetching = true;
			})
			.addCase(fetchMoreMessages.fulfilled, (state, action) => {
				const {
					payload: { data, hasMore, chatId },
				} = action;

				state[chatId].offset = state[chatId].offset + 10;
				state[chatId].hasMore = state[chatId].hasMore = hasMore;
				state[chatId].messages = [...state[chatId].messages, ...data];

				state.isFetching = false;
			})
			.addCase(postMessage.pending, (state, action) => {
				state.status = "posting";
			})
			.addCase(postMessage.fulfilled, (state, { payload }) => {
				console.log("postMessage.fulfilled", { payload });
				const { user, chatId, message } = payload;

				const newMessage = {
					...message,
					author: user,
					reactions: [],
				};

				state[chatId].offset++;
				state[chatId].messages = [newMessage, ...state[chatId].messages];
				state.status = "idle";
			});
	},
});

export const { registerChatQueue, unregisterChatQueue, clearAllChats } =
	messagesSlice.actions;

export default messagesSlice.reducer;
