import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PAGE_SIZE } from "./main";
import { setChatId, setUserId } from "./redux/app-state";
import { useGetChatsQuery } from "./redux/chats";
import { fetchMessages, fetchMoreMessages, postMessage } from "./redux/messages";
// import {
// 	// useGetAllMessagesFromChatQuery,
// 	useGetPaginatedMessagesFromChatQuery,
// 	usePostMessageMutation,
// } from "./redux/messages";
import { useGetUsersQuery } from "./redux/users";

function MessageBubble({ message, idx }) {
	const bubbleRef = useRef(null);

	const userId = useSelector(state => state.appState.userId);

	const [isHovered, setIsHovered] = useState(false);
	const [reactionsPaneOpen, setReactionsPaneOpen] = useState(false);
	const [optionsPaneOpen, setOptionsPaneOpen] = useState(false);

	const { data: users } = useGetUsersQuery();

	if (!users) return null;

	return (
		<div className="px-2">
			<div
				ref={bubbleRef}
				className="my-1 flex"
				style={{
					flexDirection: message.author?.id == userId ? "row" : "row-reverse",
				}}
				onPointerEnter={e => {
					setIsHovered(true);
				}}
				onPointerLeave={e => {
					setIsHovered(false);
				}}
			>
				<div
					className="relative py-1 px-2 rounded w-4/5"
					style={{
						opacity: isHovered ? "1" : ".85",
						background:
							message.author?.id == userId ? "rgb(21, 128, 61)" : "#444",
					}}
				>
					<div
						className="absolute rounded-full right-1 transition cursor-pointer hover:bg-neutral-400 hover:bg-opacity-80"
						style={{ visibility: isHovered ? "visible" : "hidden" }}
						onClick={() => setOptionsPaneOpen(!optionsPaneOpen)}
					>
						<button className="">
							<div className="-translate-y-0.5 w-6 h-6 flex justify-center items-start">
								⌵
							</div>
						</button>
					</div>

					<div className="main-content">
						<div>
							{message.id}. {message.author.name}
						</div>
						<small>{new Date(message.timestamp).toLocaleString()}</small>
						<div>{message.body}</div>
					</div>

					<div className="reactions">
						{message.reactions.map(r => (
							<div key={r.id}>
								<div title={users.find(u => u.id === r.user_id)?.name}>
									{r.reaction}
								</div>
							</div>
						))}
					</div>
				</div>
				<div
					className="flex p-1 items-center cursor-pointer"
					onClick={() => setReactionsPaneOpen(!reactionsPaneOpen)}
				>
					<button>
						<span
							className="transition"
							style={{
								transitionDuration: "300ms",
								opacity: isHovered ? 1 : 0,
							}}
						>
							🙂
						</span>
					</button>
				</div>
			</div>
		</div>
	);
}

function MessageDisplay() {
	const dispatch = useDispatch();

	const messagePaneRef = useRef(null);

	const chatId = useSelector(state => state.appState.chatId);

	const messages = useSelector(state => state.messages[chatId]?.messages);
	const hasMore = useSelector(state => state.messages[chatId]?.hasMore);
	const offset = useSelector(state => state.messages[chatId]?.offset || 0);
	const isLoading = useSelector(state => state.messages.status === "pending");
	const isFetching = useSelector(state => state.messages.isFetching);

	console.log({ offset });

	useEffect(() => {
		if (!messages) dispatch(fetchMessages({ chatId })); // initial

		if (messages && messagePaneRef.current) {
			messagePaneRef.current?.scrollTo({
				top: 999_999,
				behavior: "smooth",
			});
		}
	}, [chatId]);

	if (isLoading)
		return (
			<div className="border h-[calc(100vh-200px)] flex items-center justify-center">
				<div>Loading messages...</div>
			</div>
		);

	return (
		<div className="relative border h-[calc(100vh-200px)] ">
			<div
				ref={messagePaneRef}
				className="absolute bottom-0 w-full border max-h-[calc(100vh-200px)] overflow-y-auto flex flex-col-reverse"
			>
				{(messages ?? []).map((msg, idx) => (
					<MessageBubble key={msg.id} idx={idx} message={msg} />
				))}

				{hasMore && (
					<button
						className="w-full mx-auto"
						onClick={async e => {
							dispatch(fetchMoreMessages({ chatId }));
						}}
					>
						{isFetching ? "fetching more messages..." : "Load more"}
					</button>
				)}

				{!hasMore && messages?.length > 10 && (
					<small className="text-center text-stone-500">No more messages</small>
				)}

				{!hasMore && messages?.length === 0 && (
					<div className="border h-[calc(100vh-200px)] flex items-center justify-center text-stone-500">
						This is the beginning of a beautiful conversation
					</div>
				)}
			</div>
		</div>
	);
}

function MessageInput() {
	const textRef = useRef(null);

	const dispatch = useDispatch();
	const { data: users } = useGetUsersQuery();
	const chatId = useSelector(state => state.appState.chatId);
	const userId = useSelector(state => state.appState.userId);

	const isSending = useSelector(state => state.messages.status === "posting");

	const user = useMemo(
		() => users && users.find(u => u.id === userId),
		[users, userId]
	);

	const dispatchPostMessage = text =>
		dispatch(
			postMessage({
				user,
				chatId,
				body: text,
			})
		);

	return (
		<div className="">
			<div className="h-[150px]">
				<textarea
					ref={textRef}
					className="w-full h-full p-2 resize-none"
					placeholder="start typing..."
					onKeyUp={e => {
						e.preventDefault();
						if (
							e.key === "Enter" &&
							textRef.current?.value.replace(/\n/g, "")
						) {
							dispatchPostMessage(textRef.current.value);
							textRef.current.value = "";
						}
					}}
				/>
			</div>
			<div className="flex justify-end border">
				<button
					className="w-20 mt-2 mb-1.5 mr-2 rounded-full bg-cyan-700 p-1"
					onClick={() => {
						if (textRef.current?.value) {
							dispatchPostMessage(textRef.current.value);
							textRef.current.value = "";
						}
					}}
				>
					{isSending ? "Sending..." : "Send"}
				</button>
			</div>
		</div>
	);
}

function Messages() {
	return (
		<div>
			<MessageDisplay />

			<MessageInput />
		</div>
	);
}

function Roster() {
	const dispatch = useDispatch();

	const userId = useSelector(state => state.appState.userId);

	const chatId = useSelector(state => state.appState.chatId);

	const { data: chats, isLoading, isFetching } = useGetChatsQuery(userId);

	useEffect(() => {
		if (chats && chats[0]) {
			dispatch(setChatId(chats[0].id));
		}
	}, [chats]);

	if (isLoading) return <div>Loading Chats...</div>;

	return (
		<div>
			<div>
				<span>User id: </span>
				<span>{userId} </span>
				<span>Chat id: </span>
				<span>{isFetching ? "..." : chatId}</span>
			</div>
			<h2 className="text-2xl">Roster</h2>
			<ul>
				{isFetching ? (
					<div>Loading chats...</div>
				) : (
					chats?.map(chat => (
						<li
							key={chat.id}
							style={{ background: chat.id === chatId ? "#999" : "" }}
						>
							<button
								className="p-2"
								onClick={() => dispatch(setChatId(chat.id))}
							>
								<div>{chat.name}</div>
							</button>
						</li>
					))
				)}
			</ul>
			{/* <pre>{isFetching ? "fetching..." : JSON.stringify(chats, null, 2)}</pre> */}
		</div>
	);
}

function UserSelection() {
	const dispatch = useDispatch();

	const { data: users, isLoading } = useGetUsersQuery();

	if (isLoading || !users) return <div>Loading....</div>;

	return (
		<select
			onChange={e => {
				dispatch(setUserId(+e.target.value));
			}}
		>
			{users.map(user => (
				<option key={user.id} value={user.id}>
					{user.name}
				</option>
			))}
		</select>
	);
}

function App() {
	return (
		<div className="grid grid-cols-6 h-screen">
			<div className="border col-start-1 col-end-3">
				<UserSelection />

				<Roster />
			</div>
			<div className="border col-start-3 col-end-7">
				<Messages />
			</div>
		</div>
	);
}

export default App;
