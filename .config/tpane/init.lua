tpane.register_pane("pi", {
	tag = "agent",
	command = "pi",
	dir = "right",
	size = "35%",
	title = "pi",
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
	tpane.toggle(pane, "pi")
end)

tpane.bind_key("A", function(pane)
	tpane.expand(pane, "pi")
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
