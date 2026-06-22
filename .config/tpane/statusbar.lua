tpane.options({
	window = {
		status = {
			style = { fg = "#858585" },
			format = '#[fg=#777777]#I:#(pwd="#{pane_current_path}"; echo ${pwd####*/})',
			current_format = {
				text = '#I:#(pwd="#{pane_current_path}"; echo ${pwd####*/})',
				fg = "#8caaee",
				bold = true,
			},
		},
	},
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
