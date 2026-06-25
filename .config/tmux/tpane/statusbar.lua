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

local weather = tpane.job("weather", {
	every = "10m",
	timeout = "5s",
	cmd = 'command -v weather >/dev/null 2>&1 && weather widget || echo ""',
})

local battery = tpane.widgets.battery({ every = "30s" })

tpane.statusline({
	position = "top",
	interval = 1,
	left = { tpane.widgets.session },
	right = { weather, battery, tpane.widgets.clock, tpane.widgets.date, tpane.widgets.prefix },
})
