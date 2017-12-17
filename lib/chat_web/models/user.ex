defmodule Chat.User do
  use Ecto.Schema
  import Ecto.Changeset
  alias Chat.User


  schema "users" do
    field :code, :string

    timestamps()
  end

  @doc false
  def changeset(%User{} = user, attrs) do
    user
    |> cast(attrs, [:code])
    |> validate_required([:code])
  end
end
