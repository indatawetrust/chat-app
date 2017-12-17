defmodule ChatWeb.RoomChannel do
  use Phoenix.Channel

  def join("room:" <> _private_room_id, _params, _socket) do
    {:ok, _socket}
  end

  def handle_in("new_msg", %{"id" => id, "me" => me, "msg" => msg}, socket) do
    ChatWeb.Endpoint.broadcast "room:" <> id, "new_msg", %{"user" => me, "body" => msg}
    {:noreply, socket}
  end

  def handle_in("heartbeat", %{"me" => me}, socket) do
    {:ok, connect} = Redix.start_link()

    Redix.command(connect, ["SET", "heartbeat-"<>me, :os.system_time(:millisecond)])

    Redix.stop(connect)

    {:noreply, socket}
  end
end
