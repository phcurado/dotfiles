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

local agent_kinds = { pi = true, claude = true, codex = true }

tpane.widget("agents", function(ctx)
	local parts = {}
	for _, pane in ipairs(ctx.panes or {}) do
		local hidden = pane.session and pane.session:match("^__tpane%-hidden%-") ~= nil
		if pane.tag == "agent" or agent_kinds[pane.kind] then
			local presentation = tpane.state(pane.state) or {}
			if hidden then
				parts[#parts + 1] = { text = "○", fg = presentation.color or "default" }
			elseif presentation.color then
				parts[#parts + 1] = { text = presentation.glyph or "●", fg = presentation.color }
			end
			parts[#parts + 1] = { text = " " .. pane.label }
			parts[#parts + 1] = "  "
		end
	end
	if #parts == 0 then
		return nil
	end
	parts[#parts] = nil
	return parts
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
