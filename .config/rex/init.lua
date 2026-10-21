require("panes")

rex.action{
	name = "catppuccin",
	title = "Apply Catppuccin Frappe theme",
	run = function()
		rex.client.queue("client.theme.import", {
			path = "/Applications/Ghostty.app/Contents/Resources/ghostty/themes/Catppuccin Frappe",
		})
	end,
}

rex.bind("ctrl+a>a", "toggle_pi")
rex.bind("ctrl+a>t", "toggle_term")
rex.bind("ctrl+a>c", "client.tab.new")
rex.bind("ctrl+a>n", "client.tab.next")
rex.bind("ctrl+a>p", "client.tab.previous")
rex.bind("ctrl+a>s", "session.switch")rex.bind("ctrl+a>ctrl+a", "pane.send_key", { key = "ctrl+a" })
rex.bind("ctrl+g", "pane.zoom")

-- vim-navigator: when nvim is in front, pass the key through; nvim moves
-- between its windows and calls `rex focus` at the edge.
local function in_nvim(block_id)
	local p = rex.block.call("com.superlogical.terminal", "process", { block_id = block_id })
	local name = p and p.foreground and p.foreground.name or ""
	return name == "nvim" or name == "vim"
end

for key, direction in pairs({ h = "left", j = "down", k = "up", l = "right" }) do
	rex.bind("ctrl+" .. key, function(ctx)
		if in_nvim(ctx.block_id) then
			return false
		end
		rex.session.focus_direction{ session_id = ctx.session_id, direction = direction }
		return true
	end)
end
