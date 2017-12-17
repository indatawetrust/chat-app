defmodule ChatWeb.PageView do
  use ChatWeb, :view

  def render("users.json", %{users: users}) do
    %{users: users}
  end
end
