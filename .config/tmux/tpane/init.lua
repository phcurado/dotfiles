tpane.use("sensible")
tpane.use("themes")
tpane.use("pane-detection")
tpane.use("vim-navigator")
tpane.use("yank")
tpane.use("open-url")
tpane.use("agents")

tpane.theme("Catppuccin Frappe", { transparent = true })

tpane.on("window:close", function(window)
	tpane.tmux.cleanup(window)
end)
