tpane.register_pane("pi", {
	tag = "agent",
	command = "pi",
	side = "right",
	size = "35%",
	full = true,
	title = "pi",
	label = "pi",
	blocked_message = "approval active",
})

tpane.register_pane("bottom", {
	tag = "terminal",
	command = "zsh",
	side = "bottom",
	size = "30%",
	title = "tests",
	label = "bottom",
})

tpane.bind("a", function(pane)
	tpane.toggle(pane, "pi")
end)

tpane.bind("t", function(pane)
	tpane.toggle(pane, "bottom")
end)

tpane.bind("C-g", function(pane)
	tpane.expand(pane)
end, { prefix = false })

tpane.bind("g", tpane.run("agent_next"))
