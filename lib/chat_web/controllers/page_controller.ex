defmodule ChatWeb.PageController do
  use ChatWeb, :controller
  alias Chat.Repo
  alias Chat.User
  alias Ecto.Adapters.SQL

  def index(conn, _params) do
    hash = Hashids.new([
      salt: Integer.to_string(:os.system_time(:millisecond)),
      min_len: 12,
    ])

    id = Hashids.encode(hash, 129)

    sessionId = get_session(conn, :message)

    if !get_session(conn, :message) do
      conn = put_session(conn, :message, id)
      sessionId = get_session(conn, :message)
    end

    if !Repo.get_by(User, code: sessionId) do
      %User{ code: sessionId } |> Repo.insert
    end

    result = SQL.query(Repo, "select * from users where code != '" <> sessionId <> "' and updated_at > (CURRENT_TIMESTAMP - INTERVAL '2 hour' - INTERVAL '5 second') order by random() limit 10" , [])

    users = []

    case result do
      {:ok, columns} ->
        users = for item <- columns.rows do
          code = Enum.at(item, 1)

          users = users ++ [code: code]
        end
      _ -> IO.puts("error")
    end

    users = Enum.filter(users, fn(user) -> user end)

    render conn, "index.html", %{id: sessionId, users: users}
  end

  def users(conn, _params) do
    sessionId = get_session(conn, :message)

    result = SQL.query(Repo, "select * from users where code != '" <> sessionId <> "' and updated_at > (CURRENT_TIMESTAMP - INTERVAL '2 hour' - INTERVAL '5 second') order by random() limit 10" , [])

    users = []

    case result do
      {:ok, columns} ->
        users = for item <- columns.rows do
          code = Enum.at(item, 1)

          users = users ++ %{"code"=> code}
        end
      _ -> IO.puts("error")
    end

    users = Enum.filter(users, fn(user) -> user end)

    render conn, "users.json", %{users: users}
  end
end
