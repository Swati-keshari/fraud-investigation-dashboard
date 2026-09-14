/**
 * Thin, named entry point matching the architecture doc's file layout.
 * The actual mock transport (a subscribe/publish bus standing in for a
 * Socket.io/MSW WebSocket mock) lives in lib/mockApi.ts — re-exported here
 * so consumers can `import { subscribeToNewAlerts } from "@/lib/websocketClient"`
 * without caring whether the backing implementation is the in-memory mock
 * or, later, a real `socket.io-client` connection.
 *
 * To swap in a real WebSocket/Socket.io connection: replace the body of
 * `subscribeToNewAlerts` with a socket.io-client listener that calls the
 * same `listener(alert)` contract, and nothing in hooks/useRealtimeAlerts.ts
 * or above needs to change.
 */
export { subscribeToNewAlerts } from "./mockApi";
