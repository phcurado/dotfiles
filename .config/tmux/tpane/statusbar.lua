tpane.tabline({
	label = "cwd",
	inactive = { fg = "#777777" },
	current = { fg = "#8caaee", bold = true },
})

tpane.options({
	pane = {
		border = {
			lines = "heavy",
			style = { fg = "#51576d" },
		},
		active = {
			border = {
				style = { fg = "#8caaee" },
			},
		},
	},
	status = {
		left_length = 120,
		right_length = 120,
		style = { bg = "default" },
	},
})

tpane.widget("weather", function()
	return '#(command -v weather >/dev/null 2>&1 && weather widget || echo "")'
end)

tpane.widget("clock_long", function()
	return os.date("%I:%M %p %b %d")
end)

tpane.widget("prefix", function()
	return tpane.fmt.prefix("  ", "  ")
end)

tpane.statusline({
	position = "top",
	interval = 1,
	left = { "session" },
	right = { "agents", "weather", "clock_long", "prefix" },
})
