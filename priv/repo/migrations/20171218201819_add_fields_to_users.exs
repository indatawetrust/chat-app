defmodule Chat.Repo.Migrations.AddFieldsToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :last_time, :utc_datetime
    end
  end
end
