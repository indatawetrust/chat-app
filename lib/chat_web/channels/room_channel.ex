defmodule ChatWeb.RoomChannel do
  use Phoenix.Channel
  alias Chat.Repo
  alias Chat.User

  def join("room:" <> _private_room_id, _params, _socket) do
    {:ok, _socket}
  end

  def handle_in("new_msg", %{"id" => id, "me" => me, "msg" => msg, "type" => type}, socket) do
    ChatWeb.Endpoint.broadcast "room:" <> id, "new_msg", %{"user" => me, "body" => msg, "type" => type}

    {:noreply, socket}
  end

  def handle_in("heartbeat", %{"code" => code}, socket) do
    Repo.get_by(User, code: code) |> Ecto.Changeset.change(%{ updated_at: Ecto.DateTime.utc }) |> Repo.update!

    {:noreply, socket}
  end
end
