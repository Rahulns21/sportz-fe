export function createSocket(): WebSocket {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    return new WebSocket(`${protocol}//${location.host}/ws`);
}
