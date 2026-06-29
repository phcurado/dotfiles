tpane.register_pane("pi", {
	tag = "agent",
	command = "/home/phcurado/.local/bin/mise exec node@25 -- pi",
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
end, { desc = "Toggle Pi sidebar" })

tpane.bind("t", function(pane)
	tpane.toggle(pane, "bottom")
end, { desc = "Toggle bottom terminal" })

tpane.bind("C-g", function(pane)
	tpane.expand(pane)
end, { prefix = false, desc = "Expand current pane" })
