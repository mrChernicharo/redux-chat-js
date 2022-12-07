import { createSlice } from "@reduxjs/toolkit";

const initialState = {
	userId: 1,
	chatId: 1,
};

const appStateSlice = createSlice({
	name: "appState",
	initialState: initialState,
	reducers: {
		setUserId: (state, { payload }) => {
			state.userId = payload;
		},
		setChatId: (state, { payload }) => {
			state.chatId = payload;
		},
	},
});

export const { setUserId, setChatId } = appStateSlice.actions;

export default appStateSlice.reducer;
