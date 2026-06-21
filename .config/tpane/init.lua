tpane.register_pane("agent", {
  command = "pi",
  dir = "right",
  size = "35%",
  title = "agent",
  label = "pi",
  blocked_message = "approval active",
})

tpane.register_pane("bottom", {
  tag = "terminal",
  command = "zsh",
  dir = "below",
  size = "30%",
  title = "tests",
  label = "bottom",
})

tpane.bind_key("a", function(pane)
  tpane.toggle(pane, "agent")
end)

tpane.bind_key("A", function(pane)
  tpane.expand(pane, "agent")
end)

tpane.bind_key("t", function(pane)
  tpane.toggle(pane, "bottom")
end)

tpane.bind_key("T", function(pane)
  tpane.expand(pane, "bottom")
end)

tpane.on("window:close", function(window)
  tpane.tmux.cleanup(window)
end)
