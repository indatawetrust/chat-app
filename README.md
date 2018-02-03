# chat-app
A simple chat application with the Phoenix Framework

```bash
cd assets && MIX_ENV=prod brunch build --production && cd .. && pokill 4001 && MIX_ENV=prod PORT=4001 elixir --detached -S mix do compile, phx.server
```
