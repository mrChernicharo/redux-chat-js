import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import db from "../supabase";

export const chatsApi = createApi({
	reducerPath: "chats",
	baseQuery: fakeBaseQuery(),
	endpoints: build => ({
		getChats: build.query({
			// @ts-ignore
			queryFn: async (userId, queryApi, extraOptions, baseQuery) => {
				const response = await db
					.from("chat_participants")
					.select("*, chat:chats(*)")
					.eq("user_id", userId);

				const userChats = response.data?.map(entry => entry.chat);

				return { data: userChats };
			},
		}),
	}),
});

export const { useGetChatsQuery } = chatsApi;
