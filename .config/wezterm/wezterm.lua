local wezterm = require("wezterm")
local mux = wezterm.mux
local config = wezterm.config_builder()

config.automatically_reload_config = true
config.enable_tab_bar = true
config.color_scheme = "Gruvbox Dark (Gogh)"
-- config.colors = require("colors/kanagawa-lotus")
config.font = wezterm.font("SourceCodeVF", { weight = "DemiBold" })
config.font_size = 12
config.use_fancy_tab_bar = false
-- config.window_decorations = "TITLE | RESIZE"
config.window_decorations = "RESIZE"
config.hide_tab_bar_if_only_one_tab = true
config.window_padding = {
	left = 0,
	right = 0,
	top = 0,
	bottom = 0,
}

config.window_background_opacity = 0.95

wezterm.on("gui-startup", function(cmd)
	local tab, pane, window = mux.spawn_window(cmd or {})
	window:gui_window():maximize()
end)

return config
