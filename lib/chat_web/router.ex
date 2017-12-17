defmodule ChatWeb.Router do
  use ChatWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", ChatWeb do
    pipe_through :browser # Use the default browser stack

    get "/", PageController, :index
    get "/users", PageController, :users
  end

  # Other scopes may use custom stacks.
  # scope "/api", ChatWeb do
  #   pipe_through :api
  # end
end
