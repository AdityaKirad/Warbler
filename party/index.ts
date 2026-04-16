import type * as Party from "partykit/server";

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // A websocket just connected!
    console.log(
      `Connected:
        id: ${conn.id}
        room: ${this.room.id}
        url: ${new URL(ctx.request.url).pathname}
      `,
    );

    // let's send a message to the connection
    conn.send(JSON.stringify({ content: "hello from server" }));
  }

  onMessage(message: string, sender: Party.Connection) {
    this.room.broadcast(message, [sender.id]);
  }
}

Server satisfies Party.Worker;
