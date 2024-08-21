local wezterm = require("wezterm")
local mux = wezterm.mux

local config = wezterm.config_builder()

config = {
	automatically_reload_config = true,
	enable_tab_bar = true,
	color_scheme = "Gruvbox Dark (Gogh)",
	font = wezterm.font("SourceCodeVF", { weight = "DemiBold" }),
	font_size = 11,
	use_fancy_tab_bar = false,
	-- window_decorations = "TITLE | RESIZE",
	window_decorations = "RESIZE",
	window_padding = {
		left = 0,
		right = 0,
		top = 0,
		bottom = 0,
	},
}
wezterm.on("gui-startup", function(cmd)
	local tab, pane, window = mux.spawn_window(cmd or {})
	window:gui_window():maximize()
end)

return config
